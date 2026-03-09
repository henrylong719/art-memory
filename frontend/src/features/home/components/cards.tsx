/* eslint-disable better-tailwindcss/no-unknown-classes */
import * as React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import type { Artwork, NearbyMuseum, Scan } from '@/lib/api/types';

function formatDistance(meters?: number): string {
  if (meters == null) return '';
  return meters < 1000
    ? `${Math.round(meters)} m away`
    : `${(meters / 1000).toFixed(1)} km away`;
}

export function ScanCard({ scan, onPress }: { scan: Scan; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 128 }}>
      <View className="w-[128px] aspect-4/5 rounded-xl overflow-hidden bg-stone-200 mb-2.5">
        {scan.artwork?.imageUrl ? (
          <Image
            source={{ uri: scan.artwork.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View className="absolute inset-0 bg-stone-300" />
        )}
      </View>
      <Text className="text-[13px] font-semibold text-stone-900 leading-[18px]" numberOfLines={1}>
        {scan.artwork?.title ?? 'Unknown artwork'}
      </Text>
      <Text className="text-[11px] text-stone-500 mt-0.5" numberOfLines={1}>
        {scan.artwork?.artist?.name ?? '—'}
      </Text>
    </Pressable>
  );
}

export function ArtworkCard({ artwork, onPress }: { artwork: Artwork; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 140 }}>
      <View className="w-[140px] aspect-3/4 rounded-xl overflow-hidden bg-stone-200 mb-2.5">
        {artwork.imageUrl ? (
          <Image
            source={{ uri: artwork.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View className="absolute inset-0 bg-stone-300" />
        )}
      </View>
      <Text className="text-[13px] font-semibold text-stone-900 leading-[18px]" numberOfLines={2}>
        {artwork.title}
      </Text>
      <Text className="text-[11px] text-stone-500 mt-0.5" numberOfLines={1}>
        {artwork.artist?.name ?? '—'}
      </Text>
    </Pressable>
  );
}

export function MuseumCard({ museum, onPress }: { museum: NearbyMuseum; onPress: () => void }) {
  const dist = formatDistance(museum.distance);

  return (
    <Pressable
      className="bg-white rounded-[20px] overflow-hidden border border-neutral-200"
      onPress={onPress}
    >
      <View className="h-40 bg-stone-200 relative">
        {museum.photoUrl ? (
          <Image
            source={{ uri: museum.photoUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View className="absolute inset-0 bg-stone-300" />
        )}
        {museum.openNow != null && (
          <View className="absolute top-3 left-3 flex-row items-center gap-1.5 bg-white/92 rounded-full px-2.5 py-1">
            <View
              className={`w-1.5 h-1.5 rounded-full ${
                museum.openNow ? 'bg-green-500' : 'bg-stone-400'
              }`}
            />
            <Text className="text-[11px] font-semibold text-stone-900">
              {museum.openNow ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
      </View>
      <View className="p-3.5">
        <Text className="text-base font-semibold text-stone-900 mb-1" numberOfLines={1}>
          {museum.name}
        </Text>
        <Text className="text-xs text-stone-500" numberOfLines={1}>
          {[museum.address, dist].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}
