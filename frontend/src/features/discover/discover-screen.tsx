/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, ScrollView, Text, View } from '@/components/ui';
import { useNearbyMuseums, useMuseumSearch } from '@/lib/hooks';

import type { NearbyMuseum } from '@/lib/api/types';

// ─── Category Chips ──────────────────────────────────────
const CATEGORIES = ['All', 'Art Museums', 'Modern Art', 'Contemporary'];

function CategoryChips({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (cat: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 24,
        gap: 8,
        paddingBottom: 8,
      }}
    >
      {CATEGORIES.map((cat) => (
        <Pressable
          key={cat}
          onPress={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full ${
            active === cat ? 'bg-stone-900' : 'bg-white border border-stone-200'
          }`}
          style={
            active === cat
              ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : undefined
          }
        >
          <Text
            className={`text-sm font-medium ${
              active === cat ? 'text-white' : 'text-stone-600'
            }`}
          >
            {cat}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Museum Card ─────────────────────────────────────────
function MuseumCard({
  museum,
  index,
  onPress,
}: {
  museum: NearbyMuseum;
  index: number;
  onPress: () => void;
}) {
  const distance = museum.distance
    ? museum.distance < 1000
      ? `${Math.round(museum.distance)} m`
      : `${(museum.distance / 1000).toFixed(1)} km`
    : null;

  return (
    <Motion.View
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
    >
      <Pressable
        onPress={onPress}
        className="bg-white rounded-3xl overflow-hidden border border-stone-100 active:opacity-90"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 12,
          elevation: 1,
        }}
      >
        {/* Image */}
        <View className="h-48 bg-stone-200 overflow-hidden">
          {museum.photoUrl ? (
            <Image
              source={{ uri: museum.photoUrl }}
              className="w-full h-full"
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-stone-200">
              <MapPin size={24} color="#a8a29e" />
            </View>
          )}

          {/* Open badge */}
          {museum.openNow != null && (
            <View
              className="absolute top-4 left-4 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full ${
                  museum.openNow ? 'bg-emerald-500' : 'bg-stone-400'
                }`}
              />
              <Text className="text-xs font-semibold text-stone-900">
                {museum.openNow ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          )}

          {/* Rating badge */}
          {museum.rating != null && (
            <View
              className="absolute bottom-4 right-4 flex-row items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            >
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text className="text-white text-xs font-semibold">
                {museum.rating}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="p-5">
          <Text
            className="font-serif text-xl font-medium text-stone-900 leading-snug mb-2"
            numberOfLines={2}
          >
            {museum.name}
          </Text>
          <Text
            className="text-stone-600 text-sm leading-relaxed mb-4"
            numberOfLines={2}
          >
            {museum.address}
          </Text>

          {/* Footer */}
          <View className="flex-row items-center justify-between border-t border-stone-100 pt-4">
            {museum.userRatingsTotal != null && (
              <View className="px-2.5 py-1 bg-stone-100 rounded-lg">
                <Text className="text-xs font-medium text-stone-600">
                  {museum.userRatingsTotal.toLocaleString()} reviews
                </Text>
              </View>
            )}
            {distance && (
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color="#78716c" />
                <Text className="text-stone-500 text-sm font-medium">
                  {distance}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Motion.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');

  const nearby = useNearbyMuseums();
  const searchResults = useMuseumSearch(searchQuery, nearby.coords);

  const isSearching = searchQuery.length > 0;
  const museums = isSearching ? searchResults.data : nearby.data;
  const isLoading = isSearching ? searchResults.isLoading : nearby.isLoading;

  // Derive a location label from coords (simplified)
  const locationLabel = nearby.coords
    ? 'Your location'
    : nearby.locationStatus === 'denied'
      ? 'Location disabled'
      : 'Locating…';

  return (
    <View className="flex-1 bg-stone-50">
      {/* Sticky Header */}
      <View className="bg-stone-50/90 px-6 pb-2 border-b border-stone-200/50 pt-16">
        {/* Title Row */}
        <View className="flex-row items-center gap-4 mb-6 mt-2">
          <Pressable
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-stone-200/50"
            hitSlop={8}
          >
            <ChevronLeft size={24} color="#1c1917" />
          </Pressable>
          <View className="flex-1">
            <Text className="font-serif text-2xl font-medium text-stone-900 leading-none">
              Discover
            </Text>
            <Text className="text-stone-500 text-sm mt-1">
              Museums and galleries near you
            </Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 flex-row items-center bg-stone-200/50 border border-stone-200 rounded-full px-4">
            <Search size={20} color="#a8a29e" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search museums..."
              placeholderTextColor="#a8a29e"
              className="flex-1 py-3 pl-3 text-[15px] text-stone-900"
              returnKeyType="search"
            />
          </View>
          <Pressable
            className="p-3.5 bg-stone-900 rounded-full active:bg-stone-800"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <SlidersHorizontal size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Categories */}
        <CategoryChips active={activeCategory} onSelect={setActiveCategory} />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          {/* Location indicator */}
          <View className="flex-row items-center gap-2 mb-6 bg-stone-200/50 px-4 py-3 rounded-2xl">
            <MapPin size={18} color="#78716c" />
            <Text className="text-sm text-stone-600">
              Current location:{' '}
              <Text className="text-stone-900 font-semibold">
                {locationLabel}
              </Text>
            </Text>
          </View>

          {/* Loading */}
          {(nearby.locationStatus === 'requesting' || isLoading) && (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#1c1917" />
              <Text className="text-stone-400 text-sm mt-4">
                {nearby.locationStatus === 'requesting'
                  ? 'Getting your location…'
                  : 'Finding museums nearby…'}
              </Text>
            </View>
          )}

          {/* Location denied */}
          {nearby.locationStatus === 'denied' && !isSearching && (
            <View className="py-16 items-center px-4">
              <View className="w-16 h-16 bg-stone-100 rounded-full items-center justify-center mb-4">
                <MapPin size={28} color="#a8a29e" />
              </View>
              <Text className="font-serif text-xl font-medium text-stone-900 mb-2 text-center">
                Location access needed
              </Text>
              <Text className="text-stone-500 text-sm text-center leading-5 max-w-[260px]">
                Enable location in your device settings to discover museums near
                you, or use search above.
              </Text>
            </View>
          )}

          {/* Museum Cards */}
          {!isLoading && nearby.locationStatus !== 'requesting' && museums && (
            <View className="gap-6">
              {museums.map((museum, index) => (
                <MuseumCard
                  key={museum.placeId}
                  museum={museum}
                  index={index}
                  onPress={() =>
                    museum.museumId
                      ? router.push(`/discover/${museum.museumId}`)
                      : undefined
                  }
                />
              ))}
            </View>
          )}

          {/* Empty state */}
          {!isLoading &&
            nearby.locationStatus !== 'requesting' &&
            museums &&
            museums.length === 0 && (
              <View className="py-16 items-center">
                <Text className="text-stone-500 font-medium text-[15px]">
                  No museums found nearby
                </Text>
              </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}
