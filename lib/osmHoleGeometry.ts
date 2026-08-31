import type { Hole, Mando, OutOfBoundsZone } from '../types/course';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
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

const OSM_GEOMETRY_CACHE = new Map<string, Hole[]>();

/**
 * Automatically query OpenStreetMap Overpass API around a course's lat/lng to ingest legitimate tee/basket/hole geometry
 */
export async function fetchCourseHoleGeometry(
  courseId: string,
  latitude: number,
  longitude: number,
  holeCount = 18
): Promise<Hole[]> {
  const cacheKey = `${courseId}_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
  if (OSM_GEOMETRY_CACHE.has(cacheKey)) {
    return OSM_GEOMETRY_CACHE.get(cacheKey)!;
  }

  try {
    const query = `[out:json][timeout:25];(node["disc_golf"="tee"](around:900,${latitude},${longitude});node["disc_golf"="basket"](around:900,${latitude},${longitude});way["disc_golf"="hole"](around:900,${latitude},${longitude});way["disc_golf"="fairway"](around:900,${latitude},${longitude});node["disc_golf"="mando"](around:900,${latitude},${longitude});way["disc_golf"="out_of_bounds"](around:900,${latitude},${longitude});node["disc_golf"="drop_zone"](around:900,${latitude},${longitude}););out body center;>;out skel qt;`;

    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Overpass geometry status ${res.status}`);
    const data = await res.json();

    if (data.elements && data.elements.length > 0) {
      const nodesMap = new Map<number, { lat: number; lng: number }>();
      const teesMap = new Map<number, { lat: number; lng: number }>();
      const basketsMap = new Map<number, { lat: number; lng: number }>();
      const fairwaysMap = new Map<number, { lat: number; lng: number }[]>();
      const mandosMap = new Map<number, Mando[]>();
      const dropZonesMap = new Map<number, { lat: number; lng: number }>();
      const obZones: OutOfBoundsZone[] = [];

      // First pass: collect node coordinates
      data.elements.forEach((el: any) => {
        if (el.type === 'node' && el.lat && el.lon) {
          nodesMap.set(el.id, { lat: el.lat, lng: el.lon });

          const tags = el.tags || {};
          const dgType = tags.disc_golf;
          const refStr = tags.ref || tags.hole || tags['disc_golf:hole'] || tags.number;
          const holeNum = parseInt(refStr, 10);

          if (dgType === 'tee' && !isNaN(holeNum)) {
            teesMap.set(holeNum, { lat: el.lat, lng: el.lon });
          } else if (dgType === 'basket' && !isNaN(holeNum)) {
            basketsMap.set(holeNum, { lat: el.lat, lng: el.lon });
          } else if (dgType === 'drop_zone' && !isNaN(holeNum)) {
            dropZonesMap.set(holeNum, { lat: el.lat, lng: el.lon });
          } else if (dgType === 'mando' && !isNaN(holeNum)) {
            const mandos = mandosMap.get(holeNum) || [];
            mandos.push({ lat: el.lat, lng: el.lon, direction: tags.direction });
            mandosMap.set(holeNum, mandos);
          }
        }
      });

      // Second pass: collect ways (hole line paths & OB boundaries)
      data.elements.forEach((el: any) => {
        if (el.type === 'way' && el.nodes) {
          const tags = el.tags || {};
          const dgType = tags.disc_golf;
          const refStr = tags.ref || tags.hole || tags['disc_golf:hole'] || tags.number;
          const holeNum = parseInt(refStr, 10);

          const points: { lat: number; lng: number }[] = [];
          el.nodes.forEach((nId: number) => {
            const pt = nodesMap.get(nId);
            if (pt) points.push(pt);
          });

          if (points.length > 0) {
            if ((dgType === 'hole' || dgType === 'fairway') && !isNaN(holeNum)) {
              fairwaysMap.set(holeNum, points);
              // Infer tee & basket if not explicitly tagged as nodes
              if (!teesMap.has(holeNum)) {
                teesMap.set(holeNum, points[0]);
              }
              if (!basketsMap.has(holeNum)) {
                basketsMap.set(holeNum, points[points.length - 1]);
              }
            } else if (dgType === 'out_of_bounds') {
              obZones.push({ coordinates: points });
            }
          }
        }
      });

      // Construct ingested Hole objects for the layout
      const holesList: Hole[] = [];
      const count = Math.max(holeCount, Math.max(teesMap.size, basketsMap.size));

      for (let h = 1; h <= (count > 0 ? count : 18); h++) {
        const tee = teesMap.get(h);
        const basket = basketsMap.get(h);
        const fairway = fairwaysMap.get(h);
        const mandos = mandosMap.get(h);
        const dropZone = dropZonesMap.get(h);

        let distFt = 310;
        let isVerified = false;

        if (tee && basket) {
          const distM = getDistanceMeters(tee.lat, tee.lng, basket.lat, basket.lng);
          distFt = Math.round(distM * 3.28084);
          isVerified = true;
        } else if (fairway && fairway.length >= 2) {
          const p1 = fairway[0];
          const p2 = fairway[fairway.length - 1];
          const distM = getDistanceMeters(p1.lat, p1.lng, p2.lat, p2.lng);
          distFt = Math.round(distM * 3.28084);
          isVerified = true;
        }

        // Estimate par based on authentic distance
        let par = 3;
        if (distFt > 650) par = 5;
        else if (distFt > 420) par = 4;

        holesList.push({
          id: `hole-${h}`,
          layoutId: `layout-main-${courseId}`,
          holeNumber: h,
          par: par,
          distanceFt: distFt,
          teeLat: tee?.lat,
          teeLng: tee?.lng,
          basketLat: basket?.lat,
          basketLng: basket?.lng,
          fairwayPath: fairway,
          mandos: mandos,
          outOfBounds: obZones.length > 0 ? obZones : undefined,
          dropZone: dropZone,
          isOsmVerified: isVerified,
        });
      }

      if (holesList.some((h) => h.isOsmVerified)) {
        OSM_GEOMETRY_CACHE.set(cacheKey, holesList);
        return holesList;
      }
    }
  } catch (err) {
    console.warn(`OSM hole geometry ingestion warning for course ${courseId}:`, err);
  }

  // Graceful fallback if course has not been mapped on OSM yet
  const fallbackHoles: Hole[] = Array.from({ length: holeCount }, (_, i) => {
    const hNum = i + 1;
    const dist = 280 + ((hNum * 25) % 150);
    return {
      id: `hole-${hNum}`,
      layoutId: `layout-main-${courseId}`,
      holeNumber: hNum,
      par: dist > 420 ? 4 : 3,
      distanceFt: dist,
      isOsmVerified: false,
    };
  });

  OSM_GEOMETRY_CACHE.set(cacheKey, fallbackHoles);
  return fallbackHoles;
}
