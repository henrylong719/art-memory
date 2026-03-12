import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

import type { PhysicalOrientation } from '@/features/scan/types';

/**
 * Tracks the device's physical orientation using the accelerometer.
 * Falls back to 'portrait' on web.
 */
export function usePhysicalOrientation() {
  const [orientation, setOrientation] =
    useState<PhysicalOrientation>('portrait');

  useEffect(() => {
    if (Platform.OS === 'web') return;

    Accelerometer.setUpdateInterval(300);
    const subscription = Accelerometer.addListener(({ x, y }) => {
      if (Math.abs(x) > Math.abs(y) + 0.15) {
        setOrientation(x > 0 ? 'landscape-right' : 'landscape-left');
      } else {
        setOrientation('portrait');
      }
    });

    return () => subscription.remove();
  }, []);

  return orientation;
}
