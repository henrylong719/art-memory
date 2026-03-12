/* eslint-disable better-tailwindcss/no-unknown-classes */
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text, View } from '@/components/ui';
import { CornerMarker } from '@/features/scan/components/corner-marker';
import type { PhysicalOrientation } from '@/features/scan/types';

type ViewfinderOverlayProps = {
  isLandscape: boolean;
  isArtworkStep: boolean;
  isCombined: boolean;
  physicalOrientation: PhysicalOrientation;
  topInset: number;
  frameStyle: { transform: { scale: number }[]; opacity: number };
  textBounceStyle: {
    transform: { translateY: number }[];
    opacity: number;
  };
};

export function ViewfinderOverlay({
  isLandscape,
  isArtworkStep,
  isCombined,
  physicalOrientation,
  topInset,
  frameStyle,
  textBounceStyle,
}: ViewfinderOverlayProps) {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ paddingTop: 40 }}
      pointerEvents="none"
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <Animated.View
        className={`relative rounded-xl border-2 ${
          isLandscape
            ? 'h-[85%] aspect-4/3'
            : isArtworkStep
              ? 'w-[85%] aspect-3/4'
              : 'w-[90%] aspect-4/5'
        }`}
        style={[frameStyle, { borderColor: 'rgba(255,255,255,0.45)' }]}
      >
        <CornerMarker position="tl" />
        <CornerMarker position="tr" />
        <CornerMarker position="bl" />
        <CornerMarker position="br" />

        <View style={styles.instructionBottom}>
          <View
            style={
              physicalOrientation === 'portrait'
                ? undefined
                : physicalOrientation === 'landscape-left'
                  ? styles.rotateCW
                  : styles.rotateCCW
            }
          >
            <Animated.View
              style={[
                textBounceStyle,
                {
                  backgroundColor: 'rgba(0,0,0,0.10)',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 9999,
                },
              ]}
            >
              <Text className="text-center text-sm font-semibold tracking-wide text-white">
                {isArtworkStep
                  ? 'Center the artwork in the frame'
                  : 'Capture the label or wall text clearly'}
              </Text>
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {isCombined && (
        <View
          className="absolute items-center"
          style={{ top: topInset + 64 }}
        >
          <View className="flex-row gap-2">
            <View
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: isArtworkStep
                  ? '#fff'
                  : 'rgba(255,255,255,0.3)',
              }}
            />
            <View
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: !isArtworkStep
                  ? '#fff'
                  : 'rgba(255,255,255,0.3)',
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  instructionBottom: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  rotateCW: { transform: [{ rotate: '90deg' }] },
  rotateCCW: { transform: [{ rotate: '-90deg' }] },
});
