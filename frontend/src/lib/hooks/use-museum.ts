import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { museumApi } from '@/lib/api/services';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'error';

export function useNearbyMuseums(radiusMeters = 10000) {
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLocationStatus('requesting');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== 'granted') {
          setLocationStatus('denied');
          return;
        }

        setLocationStatus('granted');
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch {
        if (!cancelled) setLocationStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const query = useQuery({
    queryKey: [
      'museums',
      'nearby',
      coords?.latitude,
      coords?.longitude,
      radiusMeters,
    ],
    queryFn: async () => {
      const { data } = await museumApi.nearby(
        coords!.latitude,
        coords!.longitude,
        radiusMeters,
      );
      return data.responseObject;
    },
    enabled: !!coords,
  });

  return { ...query, locationStatus, coords };
}

// ─── Museum by ID or Place ID ────────────────────────────

export function useMuseum(id: string, isPlaceId = false) {
  return useQuery({
    queryKey: ['museums', isPlaceId ? 'place' : 'id', id],
    queryFn: async () => {
      const { data } = isPlaceId
        ? await museumApi.getDetails(id)
        : await museumApi.getById(id);
      return data.responseObject;
    },
    enabled: !!id,
  });
}

// ─── Debounce hook ───────────────────────────────────────

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ─── Museum Search ───────────────────────────────────────

export function useMuseumSearch(
  query: string,
  coords?: { latitude: number; longitude: number } | null,
) {
  const debouncedQuery = useDebouncedValue(query.trim(), 400);

  return useQuery({
    queryKey: [
      'museums',
      'search',
      debouncedQuery,
      coords?.latitude,
      coords?.longitude,
    ],
    queryFn: async () => {
      const { data } = await museumApi.search(
        debouncedQuery,
        coords?.latitude,
        coords?.longitude,
      );
      return data.responseObject;
    },
    enabled: debouncedQuery.length > 0,
    placeholderData: keepPreviousData,
  });
}
