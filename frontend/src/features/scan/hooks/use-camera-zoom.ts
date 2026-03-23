import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

const MAX_ZOOM_FACTOR = 10;
const ZOOM_FACTOR_RANGE_LOG = Math.log(MAX_ZOOM_FACTOR);
const PINCH_SCALE_DEADZONE = 0.03;
const PINCH_ZOOM_SENSITIVITY = 0.8;
const PINCH_MAX_STEP = 0.04;

function clampZoomFactor(value: number) {
  'worklet';
  return Math.max(1, Math.min(value, MAX_ZOOM_FACTOR));
}

function zoomFactorToNativeZoom(zoomFactor: number) {
  'worklet';
  return Math.log(clampZoomFactor(zoomFactor)) / ZOOM_FACTOR_RANGE_LOG;
}

function getCrossedWholeZoomLevel(previous: number, next: number) {
  'worklet';

  const previousWhole = Math.floor(previous + 0.0001);
  const nextWhole = Math.floor(next + 0.0001);

  if (nextWhole === previousWhole) {
    return 0;
  }

  if (nextWhole > previousWhole) {
    return nextWhole >= 2 ? nextWhole : 0;
  }

  return previousWhole >= 2 ? previousWhole : 0;
}

export function useCameraZoom() {
  const [zoomFactor, setZoomFactor] = useState(1);

  const nativeZoomShared = useSharedValue(0);
  const zoomFactorShared = useSharedValue(1);
  const pinchStartZoomFactor = useSharedValue(1);
  const zoomIndicatorOpacity = useSharedValue(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateZoomFactor = useCallback((value: number) => {
    setZoomFactor(value);
  }, []);

  const triggerZoomLevelHaptic = useCallback(() => {
    void Haptics.selectionAsync();
  }, []);

  const showZoomIndicator = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    zoomIndicatorOpacity.value = withTiming(1, { duration: 150 });
  }, [zoomIndicatorOpacity]);

  const hideZoomIndicatorSoon = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      zoomIndicatorOpacity.value = withTiming(0, { duration: 300 });
    }, 1200);
  }, [zoomIndicatorOpacity]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    },
    [],
  );

  const cameraGesture = Gesture.Pinch()
    .onBegin(() => {
      pinchStartZoomFactor.value = zoomFactorShared.value;
      runOnJS(showZoomIndicator)();
    })
    .onUpdate((event) => {
      const scaleDelta = event.scale - 1;
      const adjustedScaleDelta
        = scaleDelta > 0
          ? Math.max(0, scaleDelta - PINCH_SCALE_DEADZONE)
          : Math.min(0, scaleDelta + PINCH_SCALE_DEADZONE);
      const targetZoomFactor = clampZoomFactor(
        pinchStartZoomFactor.value
        + adjustedScaleDelta * PINCH_ZOOM_SENSITIVITY,
      );
      const zoomFactorStep = Math.max(
        -PINCH_MAX_STEP,
        Math.min(
          targetZoomFactor - zoomFactorShared.value,
          PINCH_MAX_STEP,
        ),
      );
      const nextZoomFactor = clampZoomFactor(
        zoomFactorShared.value + zoomFactorStep,
      );
      const crossedWholeZoomLevel = getCrossedWholeZoomLevel(
        zoomFactorShared.value,
        nextZoomFactor,
      );

      zoomFactorShared.value = nextZoomFactor;
      nativeZoomShared.value = zoomFactorToNativeZoom(nextZoomFactor);
      runOnJS(updateZoomFactor)(nextZoomFactor);

      if (crossedWholeZoomLevel > 0) {
        runOnJS(triggerZoomLevelHaptic)();
      }
    })
    .onEnd(() => {
      runOnJS(hideZoomIndicatorSoon)();
    });

  const animatedCameraProps = useAnimatedProps(() => ({
    zoom: nativeZoomShared.value,
  }));

  const zoomIndicatorStyle = useAnimatedStyle(() => ({
    opacity: zoomIndicatorOpacity.value,
  }));

  return {
    animatedCameraProps,
    cameraGesture,
    zoomFactor,
    zoomIndicatorStyle,
  };
}
