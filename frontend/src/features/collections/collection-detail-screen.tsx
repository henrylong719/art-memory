/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Motion } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  ChevronLeft,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import { ConfirmModal } from '@/features/artworks/components/confirm-modal';
import {
  AddArtworksModal,
  type CollectionArtworkOption,
} from '@/features/collections/components/add-artworks-modal';
import {
  useCollection,
  useDeleteCollection,
  useRemoveSavedArtwork,
  useSaveArtwork,
  useSavedArtworksByCollection,
  useScanHistory,
} from '@/lib/hooks';
import { showGlobalToast } from '@/lib/toast-store';
import { getErrorMessage } from '@/lib/utils';

import type { SavedArtwork } from '@/lib/api/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 16;
const GRID_PADDING = 24;
const COLUMN_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const blurActiveElementOnWeb = () => {
  if (Platform.OS !== 'web') return;
  const active = document.activeElement as HTMLElement | null;
  active?.blur();
};

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
  const queryClient = useQueryClient();

  const { data: collection, isLoading: loadingCollection } = useCollection(id);
  const { data: savedArtworks, isLoading: loadingSaved } =
    useSavedArtworksByCollection(id);

  const deleteCollection = useDeleteCollection();
  const saveArtwork = useSaveArtwork();
  const removeSavedArtwork = useRemoveSavedArtwork();
  const { data: scans } = useScanHistory();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isLoading = loadingCollection || loadingSaved;
  const artworkCount = savedArtworks?.length ?? 0;

  const collectionArtworkOptions = useMemo<CollectionArtworkOption[]>(
    () => {
      const options: CollectionArtworkOption[] = [];
      const existingArtworkIds = new Set<string>();
      const seenScanArtworkIds = new Set<string>();

      for (const savedArtwork of savedArtworks ?? []) {
        options.push({
          id: `saved:${savedArtwork.id}`,
          title: savedArtwork.customTitle ?? savedArtwork.artwork?.title ?? 'Untitled',
          artist:
            savedArtwork.customArtist ??
            savedArtwork.artwork?.artist?.name ??
            'Unknown Artist',
          imageUrl: savedArtwork.artwork?.imageUrl ?? savedArtwork.userPhotoUrl,
          isInCollection: true,
          savedArtworkId: savedArtwork.id,
          artworkId: savedArtwork.artworkId,
        });

        if (savedArtwork.artworkId) {
          existingArtworkIds.add(savedArtwork.artworkId);
        }
      }

      for (const scan of scans ?? []) {
        const artworkId = scan.artwork?.id;

        if (
          !artworkId ||
          existingArtworkIds.has(artworkId) ||
          seenScanArtworkIds.has(artworkId)
        ) {
          continue;
        }

        seenScanArtworkIds.add(artworkId);
        options.push({
          id: `artwork:${artworkId}`,
          title:
            scan.userCorrectedTitle ?? scan.artwork?.title ?? 'Unknown Artwork',
          artist:
            scan.userCorrectedArtist ??
            scan.artwork?.artist?.name ??
            'Unknown Artist',
          imageUrl: scan.artwork?.imageUrl ?? scan.imageUrl,
          isInCollection: false,
          artworkId,
        });
      }

      return options;
    },
    [savedArtworks, scans],
  );
  const initialSelectedArtworkIds = useMemo(
    () =>
      collectionArtworkOptions
        .filter((option) => option.isInCollection)
        .map((option) => option.id),
    [collectionArtworkOptions],
  );

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

  const handleSaveArtworkSelections = async (selectedOptionIds: Set<string>) => {
    const artworksToAdd = collectionArtworkOptions.filter(
      (option) =>
        !option.isInCollection &&
        selectedOptionIds.has(option.id) &&
        option.artworkId,
    );
    const artworksToRemove = collectionArtworkOptions.filter(
      (option) =>
        option.isInCollection &&
        !selectedOptionIds.has(option.id) &&
        option.savedArtworkId,
    );

    if (artworksToAdd.length === 0 && artworksToRemove.length === 0) {
      setAddModalVisible(false);
      return;
    }

    try {
      await Promise.all([
        ...artworksToAdd.map((option) =>
          saveArtwork.mutateAsync({
            artworkId: option.artworkId!,
            collectionId: id,
            deferInvalidation: true,
          }),
        ),
        ...artworksToRemove.map((option) =>
          removeSavedArtwork.mutateAsync({
            id: option.savedArtworkId!,
            deferInvalidation: true,
          }),
        ),
      ]);

      const addedCount = artworksToAdd.length;
      const removedCount = artworksToRemove.length;

      setAddModalVisible(false);
      setSuccessMessage(
        addedCount > 0 && removedCount === 0
          ? addedCount === 1
            ? 'Artwork added'
            : `${addedCount} artworks added`
          : removedCount > 0 && addedCount === 0
            ? removedCount === 1
              ? 'Artwork removed'
              : `${removedCount} artworks removed`
            : 'Collection updated',
      );
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 1800);
    } catch (error) {
      showGlobalToast(
        getErrorMessage(error, "We couldn't update this collection."),
        'error',
      );
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['saved-artworks'] }),
        queryClient.invalidateQueries({ queryKey: ['collections'] }),
      ]);
    }
  };

  const handleDelete = () => {
    deleteCollection.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmVisible(false);
        setSuccessMessage('Collection deleted');
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
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => {
              blurActiveElementOnWeb();
              setAddModalVisible(true);
            }}
            className="p-2 rounded-full active:bg-stone-200/50"
            hitSlop={8}
          >
            <Plus size={24} color="#1c1917" />
          </Pressable>
          <Pressable
            onPress={() => {
              blurActiveElementOnWeb();
              setDeleteConfirmVisible(true);
            }}
            className="p-2 -mr-2 rounded-full active:bg-stone-200/50"
            hitSlop={8}
          >
            <MoreHorizontal size={24} color="#1c1917" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={savedArtworks ?? []}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
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
          <View className="py-20 items-center px-6">
            <Text className="font-serif text-xl font-medium text-stone-900 mb-2">
              No artworks yet
            </Text>
            <Text className="text-stone-400 text-sm text-center max-w-60">
              Add artworks from your scans to this collection
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

      {/* Success toast */}
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
              {successMessage}
            </Text>
          </View>
        </Motion.View>
      )}

      <AddArtworksModal
        visible={addModalVisible}
        artworks={collectionArtworkOptions}
        initialSelectedIds={initialSelectedArtworkIds}
        bottomInset={insets.bottom}
        onSave={handleSaveArtworkSelections}
        onClose={() => {
          blurActiveElementOnWeb();
          setAddModalVisible(false);
        }}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Collection?"
        description="This collection and all its saved artworks will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        isPending={deleteCollection.isPending}
        onConfirm={handleDelete}
        onCancel={() => {
          blurActiveElementOnWeb();
          setDeleteConfirmVisible(false);
        }}
      />
    </View>
  );
}
