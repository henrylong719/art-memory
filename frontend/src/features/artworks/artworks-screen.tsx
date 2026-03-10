/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useMemo, useState } from 'react';
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, ScrollView, Text, View } from '@/components/ui';
import { useArtworks, useSearchArtworks } from '@/lib/hooks';

import type { Artwork } from '@/lib/api/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 16;
const GRID_PADDING = 24;
const COLUMN_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// ─── Filter Chips ────────────────────────────────────────
const FILTERS = [
  'All',
  'Renaissance',
  'Impressionism',
  'Modern',
  'Contemporary',
];

function FilterChips({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (filter: string) => void;
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
      {FILTERS.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onSelect(filter)}
          className={`px-4 py-2 rounded-full ${
            active === filter
              ? 'bg-stone-900'
              : 'bg-white border border-stone-200'
          }`}
          style={
            active === filter
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
              active === filter ? 'text-white' : 'text-stone-600'
            }`}
          >
            {filter}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Grid Item ───────────────────────────────────────────
function ArtworkGridItem({
  artwork,
  index,
  onPress,
}: {
  artwork: Artwork;
  index: number;
  onPress: () => void;
}) {
  // Treat empty string same as null
  const hasImage = !!artwork.imageUrl && artwork.imageUrl.length > 0;

  return (
    <Motion.View
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: Math.min(index * 50, 500),
      }}
      style={{ width: COLUMN_WIDTH }}
    >
      <Pressable onPress={onPress} className="active:opacity-80">
        {/* Image container — always renders with fixed size */}
        <View
          style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.25 }}
          className="rounded-2xl overflow-hidden bg-stone-200 mb-2"
        >
          {hasImage ? (
            <Image
              source={{ uri: artwork.imageUrl! }}
              className="w-full h-full"
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-stone-400 text-xs">No image</Text>
            </View>
          )}
        </View>
        <Text
          className="font-serif text-[15px] font-medium text-stone-900 leading-tight"
          numberOfLines={2}
        >
          {artwork.title}
        </Text>
        <Text className="text-stone-500 text-xs mt-1" numberOfLines={1}>
          {artwork.artist?.name ?? 'Unknown Artist'}
        </Text>
      </Pressable>
    </Motion.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export function ArtworksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Fetch all artworks for browsing; use search hook when user types
  const allArtworks = useArtworks();
  const searchResults = useSearchArtworks(searchQuery);

  const isSearching = searchQuery.length > 0;
  const artworks = isSearching ? searchResults.data : allArtworks.data;
  const isLoading = isSearching
    ? searchResults.isLoading
    : allArtworks.isLoading;

  // Client-side filter by style
  const filteredArtworks = useMemo(() => {
    if (!artworks) return [];
    if (activeFilter === 'All') return artworks;
    return artworks.filter((a) => {
      const style = a.style?.toLowerCase() ?? '';
      const filter = activeFilter.toLowerCase();
      if (filter === 'modern')
        return style === 'abstract' || style === 'modern';
      return style.includes(filter);
    });
  }, [artworks, activeFilter]);

  return (
    <View className="flex-1 bg-stone-50">
      {/* Sticky Header */}
      <View className="bg-stone-50/90 px-6 pb-2 pt-16">
        <Text className="font-serif text-3xl font-medium text-stone-900 mb-6 mt-4">
          Artworks
        </Text>

        {/* Search Bar */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 flex-row items-center bg-stone-200/50 border border-stone-200 rounded-full px-4">
            <Search size={20} color="#a8a29e" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search artworks, artists..."
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

        {/* Filter Chips */}
        <FilterChips active={activeFilter} onSelect={setActiveFilter} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1c1917" />
        </View>
      ) : (
        <FlatList
          data={filteredArtworks}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: GRID_PADDING,
            paddingTop: 16,
            paddingBottom: 100 + insets.bottom,
          }}
          columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-stone-500 font-medium text-[15px]">
                No artworks found
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ArtworkGridItem
              artwork={item}
              index={index}
              onPress={() => router.push(`/artworks/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
