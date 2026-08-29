import { useQuery } from '@tanstack/react-query';
import { getNearbyCourses } from '../lib/discgolfapi';
import type { Course } from '../types/course';

export function useNearestCourses(
  lat: number | null,
  lng: number | null,
  radiusMiles = 50
) {
  return useQuery<Course[]>({
    queryKey: ['nearestCourses', lat?.toFixed(3), lng?.toFixed(3)],
    queryFn: () => getNearbyCourses(lat!, lng!, radiusMiles),
    enabled: lat !== null && lng !== null,
    staleTime: 15 * 60 * 1000,  // 15 minutes
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });
}
