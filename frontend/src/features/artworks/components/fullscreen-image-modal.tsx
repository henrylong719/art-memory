import type { ImageLoadEventData } from 'expo-image';
import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Image, View } from '@/components/ui';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const PHOTO_SPRING = {
  damping: 18,
  stiffness: 220,
  mass: 0.9,
};

type Size = {
  width: number;
  height: number;
};

type Translation = {
  x: number;
  y: number;
};

type FullscreenImageModalProps = {
  visible: boolean;
  imageUrl: string | null | undefined;
  topInset: number;
  onClose: () => void;
};

type PhotoTransformState = {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  pinchStartScale: SharedValue<number>;
  pinchStartTranslateX: SharedValue<number>;
  pinchStartTranslateY: SharedValue<number>;
  pinchStartFocalX: SharedValue<number>;
  pinchStartFocalY: SharedValue<number>;
  panStartTranslateX: SharedValue<number>;
  panStartTranslateY: SharedValue<number>;
};

type PhotoTransformOptions = {
  containerSize: Size;
  displayedImageSize: Size;
  imageUrl: string | null | undefined;
  visible: boolean;
};

type PhotoBounds = {
  containerSize: Size;
  displayedImageSize: Size;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function getContainedImageSize(containerSize: Size, imageSize: Size) {
  if (
    containerSize.width <= 0
    || containerSize.height <= 0
    || imageSize.width <= 0
    || imageSize.height <= 0
  ) {
    return { width: 0, height: 0 };
  }

  const containerAspect = containerSize.width / containerSize.height;
  const imageAspect = imageSize.width / imageSize.height;

  if (imageAspect > containerAspect) {
    return {
      width: containerSize.width,
      height: containerSize.width / imageAspect,
    };
  }

  return {
    width: containerSize.height * imageAspect,
    height: containerSize.height,
  };
}

function clampOffset({
  value,
  scale,
  contentSize,
  containerSize,
}: {
  value: number;
  scale: number;
  contentSize: number;
  containerSize: number;
}) {
  'worklet';

  const maxOffset = Math.max(0, (contentSize * scale - containerSize) / 2);
  return clamp(value, -maxOffset, maxOffset);
}

function clampTranslation({
  scale,
  translation,
  displayedImageSize,
  containerSize,
}: {
  scale: number;
  translation: Translation;
  displayedImageSize: Size;
  containerSize: Size;
}) {
  'worklet';

  return {
    x: clampOffset({
      value: translation.x,
      scale,
      contentSize: displayedImageSize.width,
      containerSize: containerSize.width,
    }),
    y: clampOffset({
      value: translation.y,
      scale,
      contentSize: displayedImageSize.height,
      containerSize: containerSize.height,
    }),
  };
}

function stopTransformAnimations(state: PhotoTransformState) {
  'worklet';
  cancelAnimation(state.scale);
  cancelAnimation(state.translateX);
  cancelAnimation(state.translateY);
}

function jumpToIdentity(state: PhotoTransformState) {
  'worklet';
  state.scale.value = MIN_SCALE;
  state.translateX.value = 0;
  state.translateY.value = 0;
}

function springToIdentity(state: PhotoTransformState) {
  'worklet';
  state.scale.value = withSpring(MIN_SCALE, PHOTO_SPRING);
  state.translateX.value = withSpring(0, PHOTO_SPRING);
  state.translateY.value = withSpring(0, PHOTO_SPRING);
}

function createPinchGesture(state: PhotoTransformState, bounds: PhotoBounds) {
  return Gesture.Pinch()
    .onStart((event) => {
      stopTransformAnimations(state);
      state.pinchStartScale.value = state.scale.value;
      state.pinchStartTranslateX.value = state.translateX.value;
      state.pinchStartTranslateY.value = state.translateY.value;
      state.pinchStartFocalX.value = event.focalX;
      state.pinchStartFocalY.value = event.focalY;
    })
    .onUpdate((event) => {
      const nextScale = clamp(
        state.pinchStartScale.value * event.scale,
        MIN_SCALE,
        MAX_SCALE,
      );
      const scaleRatio = nextScale / state.pinchStartScale.value;
      const nextTranslation = clampTranslation({
        scale: nextScale,
        displayedImageSize: bounds.displayedImageSize,
        containerSize: bounds.containerSize,
        translation: {
          x:
            state.pinchStartTranslateX.value
            + (event.focalX - state.pinchStartFocalX.value)
            + (
              state.pinchStartFocalX.value
              - bounds.containerSize.width / 2
              - state.pinchStartTranslateX.value
            ) * (1 - scaleRatio),
          y:
            state.pinchStartTranslateY.value
            + (event.focalY - state.pinchStartFocalY.value)
            + (
              state.pinchStartFocalY.value
              - bounds.containerSize.height / 2
              - state.pinchStartTranslateY.value
            ) * (1 - scaleRatio),
        },
      });

      state.scale.value = nextScale;
      state.translateX.value = nextTranslation.x;
      state.translateY.value = nextTranslation.y;
    })
    .onEnd(() => {
      if (state.scale.value <= MIN_SCALE + 0.01) {
        springToIdentity(state);
      }
    });
}

function createPanGesture(state: PhotoTransformState, bounds: PhotoBounds) {
  return Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      cancelAnimation(state.translateX);
      cancelAnimation(state.translateY);
      state.panStartTranslateX.value = state.translateX.value;
      state.panStartTranslateY.value = state.translateY.value;
    })
    .onUpdate((event) => {
      if (state.scale.value <= MIN_SCALE) {
        state.translateX.value = 0;
        state.translateY.value = 0;
        return;
      }

      const nextTranslation = clampTranslation({
        scale: state.scale.value,
        displayedImageSize: bounds.displayedImageSize,
        containerSize: bounds.containerSize,
        translation: {
          x: state.panStartTranslateX.value + event.translationX,
          y: state.panStartTranslateY.value + event.translationY,
        },
      });

      state.translateX.value = nextTranslation.x;
      state.translateY.value = nextTranslation.y;
    });
}

function createDoubleTapGesture(state: PhotoTransformState, bounds: PhotoBounds) {
  return Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((event, success) => {
      if (!success) {
        return;
      }

      stopTransformAnimations(state);

      if (state.scale.value > MIN_SCALE + 0.01) {
        springToIdentity(state);
        return;
      }

      const targetScale = DOUBLE_TAP_SCALE;
      const nextTranslation = clampTranslation({
        scale: targetScale,
        displayedImageSize: bounds.displayedImageSize,
        containerSize: bounds.containerSize,
        translation: {
          x:
            state.translateX.value
            + (
              event.x
              - bounds.containerSize.width / 2
              - state.translateX.value
            ) * (1 - targetScale / state.scale.value),
          y:
            state.translateY.value
            + (
              event.y
              - bounds.containerSize.height / 2
              - state.translateY.value
            ) * (1 - targetScale / state.scale.value),
        },
      });

      state.scale.value = withSpring(targetScale, PHOTO_SPRING);
      state.translateX.value = withSpring(nextTranslation.x, PHOTO_SPRING);
      state.translateY.value = withSpring(nextTranslation.y, PHOTO_SPRING);
    });
}

function usePhotoTransform({
  containerSize,
  displayedImageSize,
  imageUrl,
  visible,
}: PhotoTransformOptions) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);
  const pinchStartTranslateX = useSharedValue(0);
  const pinchStartTranslateY = useSharedValue(0);
  const pinchStartFocalX = useSharedValue(0);
  const pinchStartFocalY = useSharedValue(0);
  const panStartTranslateX = useSharedValue(0);
  const panStartTranslateY = useSharedValue(0);

  const state = useMemo<PhotoTransformState>(
    () => ({
      scale,
      translateX,
      translateY,
      pinchStartScale,
      pinchStartTranslateX,
      pinchStartTranslateY,
      pinchStartFocalX,
      pinchStartFocalY,
      panStartTranslateX,
      panStartTranslateY,
    }),
    [
      panStartTranslateX,
      panStartTranslateY,
      pinchStartFocalX,
      pinchStartFocalY,
      pinchStartScale,
      pinchStartTranslateX,
      pinchStartTranslateY,
      scale,
      translateX,
      translateY,
    ],
  );
  const bounds = useMemo(
    () => ({ containerSize, displayedImageSize }),
    [containerSize, displayedImageSize],
  );

  useEffect(() => {
    stopTransformAnimations(state);
    jumpToIdentity(state);
  }, [displayedImageSize.height, displayedImageSize.width, imageUrl, state, visible]);

  const translationStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: state.translateX.value },
      { translateY: state.translateY.value },
    ],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: state.scale.value }],
  }));

  return {
    gesture: Gesture.Simultaneous(
      createPinchGesture(state, bounds),
      createPanGesture(state, bounds),
      createDoubleTapGesture(state, bounds),
    ),
    scaleStyle,
    translationStyle,
  };
}

function ZoomablePhoto({
  imageUrl,
  visible,
}: {
  imageUrl: string;
  visible: boolean;
}) {
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [imageSize, setImageSize] = useState<Size>({ width: 0, height: 0 });

  const displayedImageSize = useMemo(
    () =>
      getContainedImageSize(containerSize, {
        width: imageSize.width || containerSize.width,
        height: imageSize.height || containerSize.height,
      }),
    [containerSize, imageSize.height, imageSize.width],
  );

  const { gesture, scaleStyle, translationStyle } = usePhotoTransform({
    containerSize,
    displayedImageSize,
    imageUrl,
    visible,
  });

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize(current =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  const handleImageLoad = (event: ImageLoadEventData) => {
    const { width, height } = event.source;

    if (width > 0 && height > 0) {
      setImageSize({ width, height });
    }
  };

  return (
    <View className="flex-1 bg-black" onLayout={handleContainerLayout}>
      <GestureDetector gesture={gesture}>
        <View style={styles.gestureLayer}>
          {displayedImageSize.width > 0 && displayedImageSize.height > 0
            ? (
                <Animated.View
                  style={[
                    {
                      width: displayedImageSize.width,
                      height: displayedImageSize.height,
                    },
                    translationStyle,
                  ]}
                >
                  <Animated.View style={[styles.fill, scaleStyle]}>
                    <Image
                      source={imageUrl}
                      style={styles.fill}
                      contentFit="fill"
                      onLoad={handleImageLoad}
                    />
                  </Animated.View>
                </Animated.View>
              )
            : null}
        </View>
      </GestureDetector>
    </View>
  );
}

export function FullscreenImageModal({
  visible,
  imageUrl,
  topInset,
  onClose,
}: FullscreenImageModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {imageUrl
          ? <ZoomablePhoto key={imageUrl} imageUrl={imageUrl} visible={visible} />
          : null}
        <Pressable
          onPress={onClose}
          className="absolute size-11 items-center justify-center rounded-full"
          style={{
            top: topInset + 8,
            right: 20,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
          hitSlop={8}
        >
          <X size={22} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  gestureLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
