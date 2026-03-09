/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView, Text, View } from '@/components/ui';
import { useArtworks, useMe, useNearbyMuseums, useScanHistory } from '@/lib/hooks';

import { ArtworkCard, MuseumCard, ScanCard } from './components/cards';
import { ScanCtaRow } from './components/scan-cta-row';
import { SectionHeader, SkeletonRow } from './components/shared';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export function HomeScreen() {
  const router = useRouter();
  const { data: me } = useMe();

  const scans = useScanHistory();
  const artworks = useArtworks();
  const nearby = useNearbyMuseums();

  const recentScans = scans.data?.slice(0, 6) ?? [];
  const featuredArtworks = artworks.data?.slice(0, 8) ?? [];
  const nearbyMuseum = nearby.data?.[0] ?? null;

  const greeting = getGreeting();
  const firstName = me?.firstName ?? me?.email?.split('@')[0] ?? 'there';
  const initials =
    [me?.firstName?.[0], me?.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    me?.email?.[0]?.toUpperCase() ||
    '?';

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-4 pb-7">
          <View>
            <Text className="text-xs font-semibold text-stone-500 tracking-widest uppercase mb-1">
              {greeting}
            </Text>
            <Text className="font-serif text-[32px] font-semibold text-stone-900 leading-[38px]">
              {firstName}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/profile')} hitSlop={8}>
            <View className="w-12 h-12 rounded-full bg-stone-200 items-center justify-center border-2 border-white">
              <Text className="text-[15px] font-semibold text-stone-600">{initials}</Text>
            </View>
          </Pressable>
        </View>

        <ScanCtaRow />

        {/* Recent Scans */}
        <View className="mb-8">
          <SectionHeader
            title="Recent Scans"
            linkLabel="View all"
            onPress={() => router.push('/profile/history')}
          />
          {scans.isLoading ? (
            <SkeletonRow count={3} width={128} height={160} />
          ) : recentScans.length === 0 ? (
            <View className="px-6 py-5 items-center">
              <Text className="text-[13px] text-stone-400 text-center leading-5">
                No scans yet. Go scan your first artwork!
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-6 gap-3.5"
            >
              {recentScans.map(scan => (
                <ScanCard
                  key={scan.id}
                  scan={scan}
                  onPress={() =>
                    scan.artwork ? router.push(`/artworks/${scan.artwork.id}`) : undefined
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Nearby Museums */}
        <View className="mb-8">
          <SectionHeader
            title="Nearby Museums"
            linkLabel="Explore"
            onPress={() => router.push('/discover')}
          />
          {nearby.locationStatus === 'requesting' || nearby.isLoading ? (
            <View className="px-6 py-5 items-center">
              <ActivityIndicator size="small" color="#a8a29e" />
              <Text className="text-[13px] text-stone-400 text-center leading-5 mt-2">
                Discovering nearby museums…
              </Text>
            </View>
          ) : nearby.locationStatus === 'denied' ? (
            <Pressable
              className="mx-6 bg-stone-100 rounded-2xl p-[18px] gap-1.5"
              onPress={() => router.push('/discover')}
            >
              <Text className="text-sm text-stone-600 leading-5">
                Enable location to see museums near you
              </Text>
              <Text className="text-[13px] font-semibold text-stone-900">Browse manually →</Text>
            </Pressable>
          ) : nearbyMuseum ? (
            <View className="px-6">
              <MuseumCard
                museum={nearbyMuseum}
                onPress={() =>
                  nearbyMuseum.museumId
                    ? router.push(`/discover/${nearbyMuseum.museumId}`)
                    : router.push('/discover')
                }
              />
            </View>
          ) : (
            <View className="px-6 py-5 items-center">
              <Text className="text-[13px] text-stone-400 text-center leading-5">
                No museums found nearby.
              </Text>
            </View>
          )}
        </View>

        {/* Featured Artworks */}
        <View className="mb-8">
          <SectionHeader
            title="Featured Artworks"
            linkLabel="View all"
            onPress={() => router.push('/(app)/artworks')}
          />
          {artworks.isLoading ? (
            <SkeletonRow count={3} width={140} height={180} />
          ) : featuredArtworks.length === 0 ? (
            <View className="px-6 py-5 items-center">
              <Text className="text-[13px] text-stone-400 text-center leading-5">
                No artworks in the database yet.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-6 gap-3.5"
            >
              {featuredArtworks.map(artwork => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  onPress={() => router.push(`/artworks/${artwork.id}`)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
