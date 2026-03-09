import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { museumApi } from '@/lib/api/services';

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export function useNearbyMuseums(radiusMeters = 10000) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
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
    queryKey: ['museums', 'nearby', coords?.latitude, coords?.longitude, radiusMeters],
    queryFn: async () => {
      const { data } = await museumApi.nearby(coords!.latitude, coords!.longitude, radiusMeters);
      return data.responseObject;
    },
    enabled: !!coords,
  });

  return { ...query, locationStatus, coords };
}
