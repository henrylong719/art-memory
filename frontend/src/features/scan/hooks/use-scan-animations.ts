import { useEffect, useRef } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { PhysicalOrientation, Step } from '@/features/scan/types';

/** Animations for the viewfinder frame and instruction text entrance. */
export function useFrameAnimations(step: Step) {
  const frameScale = useSharedValue(0.75);
  const frameOpacity = useSharedValue(0);
  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: frameScale.value }],
    opacity: frameOpacity.value,
  }));

  const textTranslateY = useSharedValue(18);
  const textOpacity = useSharedValue(0);
  const textBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const isFirstMount = useRef(true);

  useEffect(() => {
    const delay = isFirstMount.current ? 400 : 0;
    isFirstMount.current = false;

    textTranslateY.value = 18;
    textOpacity.value = 0;
    textTranslateY.value = withDelay(
      delay,
      withSpring(0, { damping: 16, stiffness: 120, mass: 0.8 }),
    );
    textOpacity.value = withDelay(delay, withTiming(1, { duration: 250 }));

    frameScale.value = 0.55;
    frameOpacity.value = 0;
    frameScale.value = withDelay(
      delay + 200,
      withSpring(1, { damping: 10, stiffness: 120, mass: 1 }),
    );
    frameOpacity.value = withDelay(
      delay + 200,
      withTiming(1, { duration: 200 }),
    );
  }, [step, frameScale, frameOpacity, textTranslateY, textOpacity]);

  return { frameStyle, textBounceStyle, frameScale };
}

/** Bounces the viewfinder frame when the device orientation changes. */
export function useOrientationBounce(
  physicalOrientation: PhysicalOrientation,
  frameScale: { value: number },
) {
  const prevOrientation = useRef(physicalOrientation);

  useEffect(() => {
    if (prevOrientation.current === physicalOrientation) return;
    prevOrientation.current = physicalOrientation;

    frameScale.value = 0.82;
    frameScale.value = withSpring(1, {
      damping: 10,
      stiffness: 130,
      mass: 0.8,
    });
  }, [physicalOrientation, frameScale]);
}

/** Scan-line + pulse animations shown during the processing overlay. */
export function useProcessingAnimations(
  processing: boolean,
  artworkIsLandscape: boolean,
) {
  const scanLineY = useSharedValue(0);
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const pulseOpacity = useSharedValue(0.5);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const scanLineDistance = artworkIsLandscape ? 200 : 320;

  useEffect(() => {
    if (processing) {
      scanLineY.value = 0;
      scanLineY.value = withRepeat(
        withSequence(
          withTiming(scanLineDistance, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        false,
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 750 }),
          withTiming(0.5, { duration: 750 }),
        ),
        -1,
        false,
      );
    }
  }, [processing, pulseOpacity, scanLineDistance, scanLineY]);

  return { scanLineStyle, pulseStyle };
}
