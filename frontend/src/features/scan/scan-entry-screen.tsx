/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { Image, ScanLine } from 'lucide-react-native';
import * as React from 'react';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from '@/components/ui';

export function ScanEntryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="font-serif text-[28px] font-semibold text-charcoal-900 text-center">
          Scan
        </Text>
      </View>

      <View className="flex-1 px-6 pt-6 pb-8 justify-center gap-5">
        {/* ── Artwork + Details (primary) ── */}
        <Motion.View
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/scan/camera',
                params: { type: 'combined', step: 'artwork' },
              })
            }
            className="bg-charcoal-900 rounded-[32px] px-8 pt-10 pb-10 items-center aspect-square justify-center active:bg-charcoal-800"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            {/* Icon */}
            <View className="w-24 h-24 rounded-full border border-white/20 bg-white/10 items-center justify-center mb-7">
              <ScanLine size={48} color="#fff" strokeWidth={1.5} />
            </View>

            {/* Text */}
            <Text className="font-serif text-[28px] font-semibold text-white text-center mb-2">
              Artwork + Details
            </Text>
            <Text className="text-sm text-white/55 text-center max-w-[220px] leading-5">
              Capture the artwork first, then the museum text for the most
              complete result
            </Text>
          </Pressable>
        </Motion.View>

        {/* ── Artwork Only (secondary) ── */}
        <Motion.View
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/scan/camera',
                params: { type: 'artwork_only', step: 'artwork' },
              })
            }
            className="bg-white border border-charcoal-100 rounded-[32px] px-8 py-7 flex-row items-center active:bg-neutral-100"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-1 pr-6">
              <Text className="font-serif text-2xl font-semibold text-charcoal-900 mb-1">
                Artwork Only
              </Text>
              <Text className="text-sm text-charcoal-500 leading-5">
                Capture only the artwork for a faster scan
              </Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center">
              <Image size={24} color="#474747" strokeWidth={1.5} />
            </View>
          </Pressable>
        </Motion.View>
      </View>
    </SafeAreaView>
  );
}
