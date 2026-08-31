import type { Course, DiscGolfApiCourse } from '../types/course';
import * as Location from 'expo-location';

const BASE_URL = 'https://io.discgolfapi.com/v1';

// In-memory course registry cache to instantly resolve course by ID
const COURSE_REGISTRY = new Map<string, Course>();
const GEOCODE_CACHE = new Map<string, { city: string; state: string; parkName?: string }>();

function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Reverse geocode latitude and longitude using native Expo Location / BigDataCloud for exact real-world city & state info
 */
async function reverseGeocodeLocation(lat: number, lng: number): Promise<{ city: string; state: string; parkName?: string }> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (GEOCODE_CACHE.has(cacheKey)) {
    return GEOCODE_CACHE.get(cacheKey)!;
  }

  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results && results.length > 0) {
      const addr = results[0];
      const city = addr.city || addr.subregion || addr.district || addr.region || 'Disc Golf Area';
      const state = addr.region || addr.isoCountryCode || '';
      const result = { city, state, parkName: addr.name || undefined };
      GEOCODE_CACHE.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (res.ok) {
        const data = await res.json();
        const city = data.locality || data.city || data.principalSubdivision || 'Disc Golf Area';
        const state = data.principalSubdivisionCode ? data.principalSubdivisionCode.replace(/^[A-Z]{2}-/, '') : '';
        const result = { city, state };
        GEOCODE_CACHE.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn('Fallback geocode error:', e);
    }
  }

  return { city: 'Disc Golf Area', state: '' };
}

let API_COURSES_CACHE: DiscGolfApiCourse[] | null = null;

async function fetchDiscGolfApiCatalog(): Promise<DiscGolfApiCourse[]> {
  if (API_COURSES_CACHE && API_COURSES_CACHE.length > 0) return API_COURSES_CACHE;
  try {
    const res = await fetch(`${BASE_URL}/courses`);
    if (res.ok) {
      const data = await res.json();
      API_COURSES_CACHE = data.courses || [];
      return API_COURSES_CACHE || [];
    }
  } catch (err) {
    console.warn('DiscGolfAPI catalog fetch error:', err);
  }
  return [];
}

function getApiCourseCoords(c: DiscGolfApiCourse): { lat: number; lng: number } | null {
  const lat = c.lat ?? c.latitude ?? c.location?.latitude;
  const lng = c.lon ?? c.longitude ?? c.location?.longitude;
  if (lat && lng) return { lat, lng };
  return null;
}

/**
 * Query OpenStreetMap Overpass API for real live disc golf courses around user GPS coordinates
 */
async function fetchOverpassNearbyCourses(lat: number, lng: number, radiusMeters = 100000): Promise<Course[]> {
  try {
    const query = `[out:json][timeout:25];(node["leisure"="disc_golf_course"](around:${radiusMeters},${lat},${lng});way["leisure"="disc_golf_course"](around:${radiusMeters},${lat},${lng});relation["leisure"="disc_golf_course"](around:${radiusMeters},${lat},${lng}););out center;`;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Overpass API error ${res.status}`);
    const data = await res.json();

    if (!data.elements || data.elements.length === 0) {
      return [];
    }

    const apiCoursesCatalog = await fetchDiscGolfApiCatalog();

    const coursesPromises = data.elements.map(async (el: any, idx: number) => {
      const cLat = el.lat || el.center?.lat || lat;
      const cLng = el.lon || el.center?.lon || lng;

      let nameTag = el.tags?.name || el.tags?.['name:en'] || el.tags?.description || el.tags?.operator || el.tags?.official_name || el.tags?.alt_name;
      let cityTag = el.tags?.['addr:city'] || el.tags?.is_in || el.tags?.['addr:suburb'];
      let stateTag = el.tags?.['addr:state'];

      // Cross-reference with DiscGolfAPI database by GPS distance (< 3 miles) to get official course name
      if (!nameTag) {
        let closestApiCourse: DiscGolfApiCourse | null = null;
        let minDist = 3.0;

        for (const apiC of apiCoursesCatalog) {
          const coords = getApiCourseCoords(apiC);
          if (coords) {
            const d = getDistanceInMiles(cLat, cLng, coords.lat, coords.lng);
            if (d < minDist) {
              minDist = d;
              closestApiCourse = apiC;
            }
          }
        }

        if (closestApiCourse && closestApiCourse.name) {
          nameTag = closestApiCourse.name;
          if (!cityTag) cityTag = closestApiCourse.locality || closestApiCourse.city;
          if (!stateTag) stateTag = closestApiCourse.region_code || closestApiCourse.state;
        }
      }

      // Reverse geocode details for exact real-world city & state if missing
      const geoInfo = await reverseGeocodeLocation(cLat, cLng);
      if (!cityTag) {
        cityTag = geoInfo.city;
      }
      if (!stateTag) {
        stateTag = geoInfo.state;
      }

      if (!nameTag) {
        nameTag = geoInfo.parkName && !geoInfo.parkName.match(/^\d+$/)
          ? `${geoInfo.parkName} Disc Golf Course`
          : `${geoInfo.city} Disc Golf Course`;
      }

      const holes = parseInt(el.tags?.holes || el.tags?.holeCount || '18', 10);
      const holeCount = isNaN(holes) ? 18 : holes;
      
      let totalDistanceFt: number | undefined = undefined;
      if (el.tags?.length || el.tags?.distance) {
        const rawLen = String(el.tags.length || el.tags.distance);
        const parsedNum = parseFloat(rawLen.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedNum)) {
          totalDistanceFt = rawLen.toLowerCase().includes('m') ? Math.round(parsedNum * 3.28084) : Math.round(parsedNum);
        }
      }

      let parTotal: number | undefined = undefined;
      if (el.tags?.par) {
        const parsedPar = parseInt(el.tags.par, 10);
        if (!isNaN(parsedPar)) parTotal = parsedPar;
      }

      const courseObj: Course = {
        id: `osm-${el.id || idx}`,
        name: nameTag,
        city: cityTag,
        state: stateTag,
        country: 'US',
        holeCount: holeCount,
        totalDistanceFt: totalDistanceFt,
        parTotal: parTotal,
        status: 'open',
        latitude: cLat,
        longitude: cLng,
        distanceMiles: getDistanceInMiles(lat, lng, cLat, cLng),
      };

      COURSE_REGISTRY.set(courseObj.id, courseObj);
      return courseObj;
    });

    const realCourses = await Promise.all(coursesPromises);
    return realCourses.sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0));
  } catch (err) {
    console.warn('Overpass OSM fetch fallback:', err);
    return [];
  }
}

/**
 * Fetch courses by country code
 */
export async function getCoursesByCountry(
  countryCode: string = 'US',
  limit: number = 50,
  offset: number = 0
): Promise<DiscGolfApiCourse[]> {
  try {
    const res = await fetch(`${BASE_URL}/courses`);
    if (!res.ok) throw new Error(`DiscGolfAPI error ${res.status}`);
    const data = await res.json();
    return data.courses || [];
  } catch (err) {
    console.warn('DiscGolfAPI fetch failed:', err);
    return [];
  }
}

export async function getNearbyCourses(
  userLat: number | null,
  userLng: number | null,
  maxDistanceMiles: number = 100
): Promise<Course[]> {
  if (userLat === null || userLng === null) {
    return [];
  }

  // 1. Primary Source: DiscGolfAPI Official Database sorted by distance from user's live GPS coordinates
  try {
    const apiCourses = await fetchDiscGolfApiCatalog();
    if (apiCourses.length > 0) {
      const liveMappedPromises = apiCourses.map(async (c) => {
        const coords = getApiCourseCoords(c);
        if (!coords) return null;

        const dist = getDistanceInMiles(userLat, userLng, coords.lat, coords.lng);
        
        let city = c.locality || c.city || c.region_code;
        let state = c.region_code || c.state || c.country_code || c.country || '';
        if (!city || city === 'US' || city.length <= 2) {
          const geoInfo = await reverseGeocodeLocation(coords.lat, coords.lng);
          city = geoInfo.city;
          if (!state || state === 'US') state = geoInfo.state;
        }

        const totalDistFt = c.primary_layout?.length_meters
          ? Math.round(c.primary_layout.length_meters * 3.28084)
          : undefined;
        const parTotal = c.primary_layout?.par_total || undefined;

        const courseObj: Course = {
          id: c.id,
          name: c.name, // Official real-world DiscGolfAPI course name (e.g. Maple Hill, Pyramids, Buffumville Dam, etc.)
          city: city,
          state: state === 'US' ? '' : state,
          country: c.country_code || c.country || 'US',
          holeCount: c.holes || c.hole_count || c.holes_count || 18,
          totalDistanceFt: totalDistFt,
          parTotal: parTotal,
          status: 'open' as const,
          latitude: coords.lat,
          longitude: coords.lng,
          distanceMiles: dist,
        };
        COURSE_REGISTRY.set(courseObj.id, courseObj);
        return courseObj;
      });

      const liveMappedResults = await Promise.all(liveMappedPromises);
      const liveMapped = liveMappedResults.filter((c): c is Course => c !== null);
      
      // Filter to courses within user's search radius (or closest courses)
      const nearbySorted = liveMapped
        .filter((c) => c.distanceMiles! <= maxDistanceMiles)
        .sort((a, b) => a.distanceMiles! - b.distanceMiles!);

      if (nearbySorted.length > 0) {
        return nearbySorted;
      }
    }
  } catch (err) {
    console.warn('DiscGolfAPI primary fetch error:', err);
  }

  // 2. Secondary Source: OpenStreetMap Overpass live GPS query
  const osmRealCourses = await fetchOverpassNearbyCourses(userLat, userLng, maxDistanceMiles * 1609.34);
  if (osmRealCourses.length > 0) {
    return osmRealCourses;
  }

  return [];
}

/**
 * Fetch a single course by ID without ever failing
 */
export async function getCourseById(id: string): Promise<Course | null> {
  // 1. Check in-memory registry map
  if (COURSE_REGISTRY.has(id)) {
    return COURSE_REGISTRY.get(id)!;
  }

  // 2. Query remote API
  try {
    const apiCatalog = await fetchDiscGolfApiCatalog();
    const found = apiCatalog.find((c) => c.id === id);
    if (found) {
      const coords = getApiCourseCoords(found) || { lat: 37.7749, lng: -122.4194 };
      const geoInfo = await reverseGeocodeLocation(coords.lat, coords.lng);
      const courseObj: Course = {
        id: found.id,
        name: found.name,
        city: found.locality || found.city || geoInfo.city,
        state: found.region_code || found.state || geoInfo.state,
        country: found.country_code || 'US',
        holeCount: found.holes || found.hole_count || 18,
        status: 'open',
        latitude: coords.lat,
        longitude: coords.lng,
      };
      COURSE_REGISTRY.set(courseObj.id, courseObj);
      return courseObj;
    }
  } catch (err) {
    console.warn('DiscGolfAPI course fetch error:', err);
  }

  return null;
}

export const getCourse = getCourseById;
