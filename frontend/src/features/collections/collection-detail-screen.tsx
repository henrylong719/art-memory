/* eslint-disable better-tailwindcss/no-unknown-classes */
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Motion } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  LayoutGrid,
  List,
  MoreHorizontal,
  Trash2,
} from 'lucide-react-native';
import * as React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import { renderBackdrop } from '@/components/ui/modal';
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
  const imageUrl = item.artwork?.imageUrl;

  return (
    <Motion.View
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 50 }}
      style={{ width: COLUMN_WIDTH }}
    >
      <Pressable onPress={onPress} className="gap-2 active:opacity-80">
        <View className="rounded-2xl overflow-hidden bg-stone-200">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.25 }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View
              style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.25 }}
              className="items-center justify-center"
            >
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
  const imageUrl = item.artwork?.imageUrl;

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

// ─── Options Sheet ───────────────────────────────────────
const OptionsSheet = React.forwardRef<
  BottomSheetModal,
  { collectionId: string; onDeleted: () => void }
>(({ collectionId, onDeleted }, ref) => {
  const deleteCollection = useDeleteCollection();

  const handleDelete = () => {
    deleteCollection.mutate(collectionId, {
      onSuccess: () => {
        (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
        onDeleted();
      },
    });
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={['25%']}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      handleComponent={() => (
        <View className="items-center pt-3 pb-2">
          <View className="w-10 h-1 bg-stone-200 rounded-full" />
        </View>
      )}
    >
      <BottomSheetView className="flex-1 px-6 pb-8">
        <Pressable
          onPress={handleDelete}
          disabled={deleteCollection.isPending}
          className="flex-row items-center gap-4 py-4 active:opacity-70"
        >
          <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
            <Trash2 size={18} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text className="text-red-600 font-medium text-base">
              Delete Collection
            </Text>
            <Text className="text-stone-400 text-xs mt-0.5">
              This action cannot be undone
            </Text>
          </View>
          {deleteCollection.isPending && (
            <ActivityIndicator size="small" color="#ef4444" />
          )}
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

// ─── Main Screen ─────────────────────────────────────────
export function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: collection, isLoading: loadingCollection } = useCollection(id);
  const { data: savedArtworks, isLoading: loadingSaved } =
    useSavedArtworksByCollection(id);

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const optionsRef = React.useRef<BottomSheetModal>(null);

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
          onPress={() => optionsRef.current?.present()}
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

      <OptionsSheet
        ref={optionsRef}
        collectionId={id}
        onDeleted={() => router.back()}
      />
    </View>
  );
}
