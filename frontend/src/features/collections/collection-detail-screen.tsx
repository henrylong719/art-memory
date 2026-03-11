/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useState } from 'react';
import { Motion } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  ChevronLeft,
  LayoutGrid,
  List,
  MoreHorizontal,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import {
  useCollection,
  useDeleteCollection,
  useSavedArtworksByCollection,
} from '@/lib/hooks';

import type { SavedArtwork } from '@/lib/api/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 16;
const GRID_PADDING = 24;
const COLUMN_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// ─── Grid Item ───────────────────────────────────────────
function GridItem({
  item,
  index,
  onPress,
}: {
  item: SavedArtwork;
  index: number;
  onPress: () => void;
}) {
  const title = item.customTitle ?? item.artwork?.title ?? 'Untitled';
  const artist =
    item.customArtist ?? item.artwork?.artist?.name ?? 'Unknown Artist';
  const imageUrl = item.artwork?.imageUrl ?? item.userPhotoUrl;

  return (
    <Motion.View
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 50 }}
      style={{ width: COLUMN_WIDTH }}
    >
      <Pressable onPress={onPress} className="gap-2 active:opacity-80">
        <View
          className="rounded-2xl overflow-hidden bg-stone-200"
          style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.25 }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full"
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-stone-400 text-xs">No image</Text>
            </View>
          )}
        </View>
        <View>
          <Text
            className="font-serif text-[15px] font-medium text-stone-900 leading-tight"
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text className="text-stone-500 text-xs mt-1" numberOfLines={1}>
            {artist}
          </Text>
        </View>
      </Pressable>
    </Motion.View>
  );
}

// ─── List Item ───────────────────────────────────────────
function ListItem({
  item,
  index,
  onPress,
}: {
  item: SavedArtwork;
  index: number;
  onPress: () => void;
}) {
  const title = item.customTitle ?? item.artwork?.title ?? 'Untitled';
  const artist =
    item.customArtist ?? item.artwork?.artist?.name ?? 'Unknown Artist';
  const year = item.customYear ?? item.artwork?.year;
  const museum = item.artwork?.museum?.name;
  const imageUrl = item.artwork?.imageUrl ?? item.userPhotoUrl;

  return (
    <Motion.View
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 50 }}
    >
      <Pressable
        onPress={onPress}
        className="flex-row gap-4 bg-white rounded-3xl p-3 border border-stone-100 active:bg-stone-50"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.02,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <View className="w-24 h-32 rounded-2xl overflow-hidden bg-stone-200">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full"
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-stone-400 text-xs">No image</Text>
            </View>
          )}
        </View>
        <View className="flex-1 py-1 pr-2 justify-center">
          <Text
            className="font-serif text-[17px] font-medium text-stone-900 leading-snug mb-1.5"
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            className="text-stone-600 text-[13px] font-medium mb-1"
            numberOfLines={1}
          >
            {artist}
          </Text>
          {(year || museum) && (
            <Text className="text-stone-400 text-xs" numberOfLines={1}>
              {[year, museum].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      </Pressable>
    </Motion.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: collection, isLoading: loadingCollection } = useCollection(id);
  const { data: savedArtworks, isLoading: loadingSaved } =
    useSavedArtworksByCollection(id);

  const deleteCollection = useDeleteCollection();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isLoading = loadingCollection || loadingSaved;

  if (isLoading) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  if (!collection) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center px-8">
        <Text className="font-serif text-2xl font-semibold text-stone-900 mb-2 text-center">
          Collection not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-stone-900 px-6 py-3 rounded-2xl mt-4"
        >
          <Text className="text-white font-semibold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const artworkCount = savedArtworks?.length ?? 0;

  const handleDelete = () => {
    deleteCollection.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmVisible(false);
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          router.back();
        }, 1800);
      },
    });
  };

  const navigateToArtwork = (item: SavedArtwork) => {
    if (item.artwork?.id) {
      router.push(`/artworks/${item.artwork.id}`);
    }
  };

  return (
    <View className="flex-1 bg-stone-50">
      {/* Sticky Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-stone-50/90 px-6 pb-4 flex-row justify-between items-center border-b border-stone-200/50"
      >
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-stone-200/50"
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#1c1917" />
        </Pressable>
        <Text
          className="font-serif text-[22px] font-medium text-stone-900 flex-1 text-center px-4"
          numberOfLines={1}
        >
          {collection.name}
        </Text>
        <Pressable
          onPress={() => setDeleteConfirmVisible(true)}
          className="p-2 -mr-2 rounded-full active:bg-stone-200/50"
          hitSlop={8}
        >
          <MoreHorizontal size={24} color="#1c1917" />
        </Pressable>
      </View>

      {/* Content */}
      <FlatList
        data={savedArtworks ?? []}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // force re-render on mode change
        contentContainerStyle={{
          paddingHorizontal: GRID_PADDING,
          paddingTop: 24,
          paddingBottom: 100 + insets.bottom,
        }}
        columnWrapperStyle={
          viewMode === 'grid'
            ? { gap: GRID_GAP, marginBottom: GRID_GAP }
            : undefined
        }
        ItemSeparatorComponent={
          viewMode === 'list'
            ? () => <View style={{ height: 16 }} />
            : undefined
        }
        ListHeaderComponent={
          <View className="flex-row justify-between items-end mb-8">
            <View>
              <Text className="text-stone-500 font-medium text-sm">
                {artworkCount} saved artwork{artworkCount === 1 ? '' : 's'}
              </Text>
            </View>
            {/* View Mode Toggle */}
            <View className="flex-row bg-stone-200/50 p-1 rounded-full">
              <Pressable
                onPress={() => setViewMode('grid')}
                className={`p-1.5 rounded-full ${
                  viewMode === 'grid' ? 'bg-white' : ''
                }`}
                style={
                  viewMode === 'grid'
                    ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : undefined
                }
              >
                <LayoutGrid
                  size={18}
                  color={viewMode === 'grid' ? '#1c1917' : '#a8a29e'}
                />
              </Pressable>
              <Pressable
                onPress={() => setViewMode('list')}
                className={`p-1.5 rounded-full ${
                  viewMode === 'list' ? 'bg-white' : ''
                }`}
                style={
                  viewMode === 'list'
                    ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : undefined
                }
              >
                <List
                  size={18}
                  color={viewMode === 'list' ? '#1c1917' : '#a8a29e'}
                />
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-stone-500 font-medium text-[15px]">
              No artworks saved yet
            </Text>
          </View>
        }
        renderItem={({ item, index }) =>
          viewMode === 'grid' ? (
            <GridItem
              item={item}
              index={index}
              onPress={() => navigateToArtwork(item)}
            />
          ) : (
            <ListItem
              item={item}
              index={index}
              onPress={() => navigateToArtwork(item)}
            />
          )
        }
      />

      {/* ── Success toast ── */}
      {showSuccessToast && (
        <Motion.View
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 300 }}
          style={{ top: insets.top + 12 }}
          className="absolute left-0 right-0 z-120 items-center"
        >
          <View
            className="bg-stone-900 flex-row items-center gap-2.5 px-5 py-3 rounded-full"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View className="w-5 h-5 rounded-full bg-white/20 items-center justify-center">
              <Check size={12} color="#fff" strokeWidth={3} />
            </View>
            <Text className="text-sm font-medium text-white tracking-wide">
              Collection deleted
            </Text>
          </View>
        </Motion.View>
      )}

      {/* ── Delete confirmation modal ── */}
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <Pressable
          onPress={() => setDeleteConfirmVisible(false)}
          className="flex-1 bg-stone-900/40 items-center justify-center px-6"
        >
          <Pressable
            onPress={() => {}}
            className="w-full max-w-[320px] bg-white rounded-4xl p-7 items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <Text className="font-serif text-2xl font-medium text-stone-900 text-center mb-3">
              Delete Collection?
            </Text>
            <Text className="text-[15px] text-stone-400 text-center leading-6 mb-8">
              This collection and all its saved artworks will be permanently
              removed. This action cannot be undone.
            </Text>
            <View className="w-full gap-3">
              <Pressable
                onPress={handleDelete}
                disabled={deleteCollection.isPending}
                className="w-full py-4 bg-red-50 rounded-2xl items-center active:bg-red-100"
              >
                {deleteCollection.isPending ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text className="text-red-600 font-semibold text-[15px]">
                    Delete
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setDeleteConfirmVisible(false)}
                className="w-full py-4 bg-stone-100 rounded-2xl items-center active:bg-stone-200"
              >
                <Text className="text-stone-700 font-semibold text-[15px]">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
