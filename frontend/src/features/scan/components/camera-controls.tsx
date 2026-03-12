/* eslint-disable better-tailwindcss/no-unknown-classes */
import { ImageUp, X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Image, View } from '@/components/ui';

type CameraControlsProps = {
  isLandscape: boolean;
  isArtworkStep: boolean;
  isCombined: boolean;
  artworkUri: string | null;
  processing: boolean;
  bottomInset: number;
  onCapture: () => void;
  onPickImage: () => void;
  onResetArtwork: () => void;
};

export function CameraControls({
  isLandscape,
  isArtworkStep,
  isCombined,
  artworkUri,
  processing,
  bottomInset,
  onCapture,
  onPickImage,
  onResetArtwork,
}: CameraControlsProps) {
  return (
    <View
      className={`${isLandscape ? 'h-24' : 'h-36'} items-center justify-center border-t border-white/10 bg-black`}
      style={{ paddingBottom: bottomInset }}
    >
      {!isArtworkStep && artworkUri && (
        <Animated.View
          entering={ZoomIn.duration(250)}
          className="absolute bottom-0 left-6 top-0 justify-center"
        >
          <View className="relative">
            <View
              className="h-14 w-14 overflow-hidden rounded-xl border-2"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            >
              <Image
                source={artworkUri}
                className="h-full w-full"
                contentFit="cover"
              />
            </View>
            <Pressable
              onPress={onResetArtwork}
              className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-black/70"
              hitSlop={6}
            >
              <X size={12} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      <View className="flex-row items-center gap-8">
        {/* Spacer to keep capture button centered */}
        <View className="h-12 w-12" />

        <Pressable
          onPress={onCapture}
          disabled={processing}
          className={`h-20 w-20 items-center justify-center rounded-full border-[3px] p-0.75 ${
            !isArtworkStep && isCombined
              ? 'border-warning-400'
              : 'border-neutral-300'
          }`}
        >
          <View className="h-full w-full rounded-full bg-white" />
        </Pressable>

        <Pressable
          onPress={onPickImage}
          disabled={processing}
          className="h-12 w-12 items-center justify-center rounded-full bg-white/15"
          hitSlop={8}
        >
          <ImageUp size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
