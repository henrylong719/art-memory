/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useRouter } from 'expo-router';
import { Image, ScanLine } from 'lucide-react-native';
import * as React from 'react';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';

export function ScanCtaRow() {
  const router = useRouter();

  return (
    <View className="flex-row items-stretch gap-3 px-6 mb-9">
      <View className="flex-1">
        <Pressable
          className="flex-1 bg-charcoal-900 rounded-[20px] p-4 justify-start"
          style={{ gap: 10 }}
          onPress={() =>
            router.push({
              pathname: '/scan/camera',
              params: { type: 'combined', step: 'artwork' },
            })
          }
        >
          <View
            className="w-11 h-11 rounded-xl items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 2 }}
          >
            <ScanLine size={22} color="#fff" />
          </View>
          <View style={{ gap: 4 }}>
            <Text className="text-sm font-bold text-white">
              Artwork + Details
            </Text>
            <Text
              className="text-[11px]"
              style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 16 }}
            >
              Scan artwork and museum label for richer results
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="flex-1">
        <Pressable
          className="flex-1 bg-white rounded-[20px] p-4 border border-charcoal-100 justify-start"
          style={{ gap: 10 }}
          onPress={() =>
            router.push({
              pathname: '/scan/camera',
              params: { type: 'artwork_only', step: 'artwork' },
            })
          }
        >
          <View
            className="w-11 h-11 rounded-xl bg-neutral-100 items-center justify-center"
            style={{ marginBottom: 2 }}
          >
            <Image size={22} color="#474747" />
          </View>
          <View style={{ gap: 4 }}>
            <Text className="text-sm font-bold text-charcoal-900">
              Artwork Only
            </Text>
            <Text
              className="text-[11px] text-charcoal-500"
              style={{ lineHeight: 16 }}
            >
              Quickly identify without scanning the label
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
