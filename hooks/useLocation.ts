import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
}

export function useLocation(watch = false) {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    isLoading: true,
    error: null,
    hasPermission: false,
  });

  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const requestLocationPermission = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({
          ...s,
          isLoading: false,
          hasPermission: false,
          error: 'Location permission not granted',
        }));
        return false;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setState({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        isLoading: false,
        error: null,
        hasPermission: true,
      });
      return true;
    } catch (e: any) {
      setState((s) => ({ ...s, isLoading: false, error: e.message }));
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            isLoading: false,
            hasPermission: false,
            error: 'Location permission denied',
          }));
        }
        return;
      }

      if (!cancelled) {
        setState((s) => ({ ...s, hasPermission: true }));
      }

      if (watch) {
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 2,
          },
          (loc) => {
            if (!cancelled) {
              setState((s) => ({
                ...s,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: loc.coords.accuracy,
                isLoading: false,
                error: null,
              }));
            }
          }
        );
      } else {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setState((s) => ({
            ...s,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
            isLoading: false,
            error: null,
          }));
        }
      }
    }

    start().catch((e) => {
      if (!cancelled) {
        setState((s) => ({ ...s, isLoading: false, error: e.message }));
      }
    });

    return () => {
      cancelled = true;
      watchRef.current?.remove();
    };
  }, [watch]);

  return {
    ...state,
    requestLocationPermission,
  };
}
