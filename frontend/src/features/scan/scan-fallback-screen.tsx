/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileEdit, SearchX, X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';

export function ScanFallbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { imageUri, scanImageUrl, scanId } = useLocalSearchParams<{
    imageUri?: string;
    scanImageUrl?: string;
    scanId?: string;
  }>();

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Top bar */}
      <View
        className="flex-row items-center px-5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={() => router.replace('/(app)')}
          className="w-11 h-11 bg-charcoal-50 rounded-full items-center justify-center"
          hitSlop={8}
        >
          <X size={22} color="#1E1E1E" />
        </Pressable>
      </View>

      <View className="flex-1 px-6 pb-8">
        <Motion.View
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450 }}
          className="flex-1"
        >
          {/* Image preview */}
          <View
            className="w-full rounded-[28px] overflow-hidden bg-charcoal-100 mb-8 mt-4"
            style={{ aspectRatio: 4 / 3 }}
          >
            {imageUri && (
              <Image
                source={imageUri}
                className="w-full h-full"
                contentFit="cover"
                style={{ opacity: 0.9 }}
              />
            )}
            <View className="absolute inset-0 bg-charcoal-900/10" />

            {/* Badge */}
            <View className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 rounded-full items-center justify-center">
              <SearchX size={22} color="#7D7D7D" />
            </View>
          </View>

          {/* Copy */}
          <View className="flex-1 items-center px-2">
            <Text className="font-serif text-[26px] font-semibold text-charcoal-900 text-center mb-3 leading-8">
              We couldn't identify this artwork
            </Text>
            <Text className="text-base text-charcoal-500 text-center leading-6 max-w-[300px]">
              Your scan was saved, but we couldn't confidently match it to a
              known artwork in our system.
            </Text>
          </View>

          {/* Actions */}
          <View className="gap-3 mt-auto">
            <Pressable
              onPress={() => {
                const params: Record<string, string> = {};
                if (imageUri) params.imageUri = imageUri;
                if (scanImageUrl) params.scanImageUrl = scanImageUrl;
                if (scanId) params.scanId = scanId;
                router.push({
                  pathname: '/scan/manual-entry',
                  params: Object.keys(params).length > 0 ? params : undefined,
                });
              }}
              className="w-full py-4 bg-charcoal-900 rounded-2xl flex-row items-center justify-center gap-2.5 active:bg-charcoal-800"
              style={{
                shadowColor: '#1E1E1E',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <FileEdit size={20} color="#fff" />
              <Text className="text-white font-semibold text-lg">
                Enter Details Manually
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/(app)')}
              className="w-full py-4 rounded-2xl items-center active:bg-charcoal-50"
            >
              <Text className="text-charcoal-400 font-semibold text-lg">
                Discard
              </Text>
            </Pressable>
          </View>
        </Motion.View>
      </View>
    </View>
  );
}
