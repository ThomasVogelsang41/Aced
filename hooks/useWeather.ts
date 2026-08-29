import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather } from '../lib/openmeteo';

export function useWeather(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['weather', lat?.toFixed(2), lng?.toFixed(2)],
    queryFn: () => getCurrentWeather(lat!, lng!),
    enabled: lat !== null && lng !== null,
    staleTime: 10 * 60 * 1000,  // 10 minutes
    gcTime: 30 * 60 * 1000,     // keep for 30 min
    retry: 2,
  });
}
