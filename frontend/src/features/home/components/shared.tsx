/* eslint-disable better-tailwindcss/no-unknown-classes */
import * as React from 'react';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';

export function SectionHeader({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View className="flex-row justify-between items-center px-6 mb-4">
      <Text className="font-serif text-xl font-medium text-charcoal-900">
        {title}
      </Text>
      {linkLabel && (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text className="text-[13px] font-medium text-charcoal-500">
            {linkLabel} ›
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function SkeletonRow({
  count = 3,
  width = 128,
  height = 160,
}: {
  count?: number;
  width?: number;
  height?: number;
}) {
  return (
    <View className="flex-row gap-3 px-6">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="rounded-xl bg-charcoal-100"
          style={{ width, height }}
        />
      ))}
    </View>
  );
}
