/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useState } from 'react';
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  Navigation,
  Search,
  Star,
} from 'lucide-react-native';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, ScrollView, Text, View } from '@/components/ui';
import { useNearbyMuseums, useMuseumSearch } from '@/lib/hooks';

import type { NearbyMuseum } from '@/lib/api/types';

// ─── Map Navigation ─────────────────────────────────────
async function openMapsForMuseum(museum: NearbyMuseum) {
  const { latitude, longitude, name } = museum;
  const encodedName = encodeURIComponent(name);

  if (Platform.OS === 'ios') {
    const candidates = [
      {
        label: 'Apple Maps',
        scheme: 'maps:',
        url: `maps:0,0?q=${encodedName}&ll=${latitude},${longitude}`,
      },
      {
        label: 'Google Maps',
        scheme: 'comgooglemaps://',
        url: `comgooglemaps://?q=${encodedName}&center=${latitude},${longitude}`,
      },
      {
        label: 'Waze',
        scheme: 'waze://',
        url: `waze://?ll=${latitude},${longitude}&navigate=yes`,
      },
    ];

    const available: typeof candidates = [];
    for (const c of candidates) {
      try {
        if (await Linking.canOpenURL(c.scheme)) {
          available.push(c);
        }
      } catch {
        // scheme not queryable
      }
    }

    // Fallback: Google Maps in browser
    if (available.length === 0) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      ).catch(() => {});
      return;
    }

    if (available.length === 1) {
      Linking.openURL(available[0].url).catch(() => {});
      return;
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...available.map((o) => o.label), 'Cancel'],
        cancelButtonIndex: available.length,
        title: 'Open in Maps',
        message: `Get directions to ${name}`,
      },
      (buttonIndex) => {
        if (buttonIndex < available.length) {
          Linking.openURL(available[buttonIndex].url).catch(() => {});
        }
      },
    );
  } else {
    const url = `geo:${latitude},${longitude}?q=${encodedName}`;
    Linking.openURL(url).catch(() => {});
  }
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
  const distance =
    museum.distance != null
      ? museum.distance < 1
        ? `${Math.round(museum.distance * 1000)} m`
        : `${museum.distance.toFixed(1)} km`
      : null;

  return (
    <Motion.View
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
    >
      <View
        className="bg-white rounded-3xl overflow-hidden border border-stone-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 12,
          elevation: 1,
        }}
      >
        <Pressable onPress={onPress} className="active:opacity-90">
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
          <View className="px-5 pt-5">
            <Text
              className="font-serif text-xl font-medium text-stone-900 leading-snug mb-2"
              numberOfLines={2}
            >
              {museum.name}
            </Text>
            <Text
              className="text-stone-600 text-sm leading-relaxed"
              numberOfLines={2}
            >
              {museum.address}
            </Text>
          </View>
        </Pressable>

        {/* Footer — outside card Pressable so Directions button gets its own tap */}
        <View className="flex-row items-center justify-between border-t border-stone-100 mx-5 mt-4 pt-4 pb-5">
          <View className="flex-row items-center gap-3">
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
          <Pressable
            onPress={() => openMapsForMuseum(museum)}
            className="flex-row items-center gap-1.5 bg-stone-100 px-3.5 py-2 rounded-full active:bg-stone-800"
            hitSlop={4}
          >
            <Navigation size={13} color="#57534e" />
            <Text className="text-stone-600 text-xs font-semibold">
              Directions
            </Text>
          </Pressable>
        </View>
      </View>
    </Motion.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

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
      <View
        className="bg-stone-50/90 px-6 pb-2 border-b border-stone-200/50"
        style={{ paddingTop: insets.top }}
      >
        {/* Title Row */}
        <View className="flex-row items-center gap-4 mb-6 mt-3">
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
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          {/* Location indicator */}
          {/* <View className="flex-row items-center gap-2 mb-6 bg-stone-200/50 px-4 py-3 rounded-2xl">
            <MapPin size={18} color="#78716c" />
            <Text className="text-sm text-stone-600">
              Current location:{' '}
              <Text className="text-stone-900 font-semibold">
                {locationLabel}
              </Text>
            </Text>
          </View> */}

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
              <Text className="text-stone-500 text-sm text-center leading-5 max-w-65">
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
                      : router.push(`/discover/${museum.placeId}?place=1`)
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
              <View className="py-16 items-center px-4">
                <View className="w-16 h-16 bg-stone-100 rounded-full items-center justify-center mb-4">
                  <MapPin size={28} color="#a8a29e" />
                </View>
                <Text className="font-serif text-xl font-medium text-stone-900 mb-2 text-center">
                  No museums found
                </Text>
                <Text className="text-stone-400 text-sm text-center max-w-60 leading-5">
                  {isSearching
                    ? 'Try a different search term'
                    : 'No museums found in your area'}
                </Text>
              </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}
