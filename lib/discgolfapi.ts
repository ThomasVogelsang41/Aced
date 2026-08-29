import type { Course, DiscGolfApiCourse } from '../types/course';
import { haversineDistanceMiles } from './distance';

const BASE_URL = 'https://io.discgolfapi.com/v1';

function mapCourse(raw: DiscGolfApiCourse, userLat?: number, userLng?: number): Course {
  const course: Course = {
    id: raw.id,
    name: raw.name,
    city: raw.location.city,
    state: raw.location.state,
    country: raw.location.country,
    latitude: raw.location.latitude,
    longitude: raw.location.longitude,
    holeCount: raw.hole_count,
    rating: raw.rating,
    status: raw.status,
  };
  if (userLat !== undefined && userLng !== undefined) {
    course.distanceMiles = haversineDistanceMiles(
      userLat,
      userLng,
      raw.location.latitude,
      raw.location.longitude
    );
  }
  return course;
}

export async function getNearbyCourses(
  lat: number,
  lng: number,
  radiusMiles = 50,
  limit = 30
): Promise<Course[]> {
  // DiscGolfAPI doesn't have a native radius search — we fetch by country/region
  // and sort client-side by distance
  const url = new URL(`${BASE_URL}/courses`);
  url.searchParams.set('limit', String(Math.min(limit * 3, 100))); // over-fetch, then filter
  url.searchParams.set('country', 'US'); // default; could be made dynamic

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`DiscGolfAPI error: ${res.status}`);
  const data = await res.json();
  const courses: DiscGolfApiCourse[] = data.courses ?? data ?? [];

  return courses
    .map((c) => mapCourse(c, lat, lng))
    .filter((c) => (c.distanceMiles ?? Infinity) <= radiusMiles)
    .sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999))
    .slice(0, limit);
}

export async function searchCourses(query: string, limit = 20): Promise<Course[]> {
  const url = new URL(`${BASE_URL}/courses`);
  url.searchParams.set('search', query);
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`DiscGolfAPI error: ${res.status}`);
  const data = await res.json();
  const courses: DiscGolfApiCourse[] = data.courses ?? data ?? [];
  return courses.map((c) => mapCourse(c));
}

export async function getCourse(id: string): Promise<Course | null> {
  const res = await fetch(`${BASE_URL}/courses/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`DiscGolfAPI error: ${res.status}`);
  const raw: DiscGolfApiCourse = await res.json();
  return mapCourse(raw);
}
