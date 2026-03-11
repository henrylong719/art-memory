/* eslint-disable better-tailwindcss/no-unknown-classes */
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
  X,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import {
  useCollection,
  useDeleteCollection,
  useSaveArtwork,
  useSavedArtworksByCollection,
  useScanHistory,
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
  const saveArtwork = useSaveArtwork();
  const { data: scans } = useScanHistory();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<Set<string>>(
    new Set(),
  );
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Scans with artwork that aren't already in this collection
  const existingArtworkIds = useMemo(
    () => new Set(savedArtworks?.map((s) => s.artworkId).filter(Boolean)),
    [savedArtworks],
  );
  const availableScans = useMemo(
    () =>
      scans
        ?.filter((s) => s.artwork && !existingArtworkIds.has(s.artwork.id))
        // Deduplicate by artworkId
        .filter(
          (s, i, arr) =>
            arr.findIndex((x) => x.artwork?.id === s.artwork?.id) === i,
        ) ?? [],
    [scans, existingArtworkIds],
  );

  const toggleSelection = (artworkId: string) => {
    setSelectedArtworkIds((prev) => {
      const next = new Set(prev);
      if (next.has(artworkId)) {
        next.delete(artworkId);
      } else {
        next.add(artworkId);
      }
      return next;
    });
  };

  const handleBatchAdd = async () => {
    if (selectedArtworkIds.size === 0) return;
    setIsBatchSaving(true);
    try {
      const promises = Array.from(selectedArtworkIds).map((artworkId) =>
        saveArtwork.mutateAsync({ artworkId, collectionId: id }),
      );
      await Promise.all(promises);
      const count = selectedArtworkIds.size;
      setSelectedArtworkIds(new Set());
      setAddModalVisible(false);
      setSuccessMessage(
        count === 1 ? 'Artwork added' : `${count} artworks added`,
      );
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 1800);
    } finally {
      setIsBatchSaving(false);
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
            onPress={() => setAddModalVisible(true)}
            className="p-2 rounded-full active:bg-stone-200/50"
            hitSlop={8}
          >
            <Plus size={24} color="#1c1917" />
          </Pressable>
          <Pressable
            onPress={() => setDeleteConfirmVisible(true)}
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
              {successMessage}
            </Text>
          </View>
        </Motion.View>
      )}

      {/* ── Add artwork modal ── */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          setAddModalVisible(false);
          setSelectedArtworkIds(new Set());
        }}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => {
            setAddModalVisible(false);
            setSelectedArtworkIds(new Set());
          }}
        />
        <View
          className="bg-white rounded-t-4xl pt-3"
          style={{
            maxHeight: '70%',
            paddingBottom: insets.bottom + 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          {/* Handle */}
          <View className="items-center pb-2">
            <View className="w-12 h-1.5 bg-stone-200 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center mb-5 px-6">
            <View>
              <Text className="font-serif text-2xl font-medium text-stone-900">
                Add Artworks
              </Text>
              {availableScans.length > 0 && (
                <Text className="text-stone-400 text-xs mt-1">
                  Select artworks from your scan history
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => {
                setAddModalVisible(false);
                setSelectedArtworkIds(new Set());
              }}
              className="p-2 bg-stone-100 rounded-full"
              hitSlop={8}
            >
              <X size={20} color="#1c1917" />
            </Pressable>
          </View>

          {availableScans.length === 0 ? (
            <View className="py-12 items-center px-6">
              <Text className="text-stone-400 font-medium text-[15px] text-center mb-1">
                No artworks to add
              </Text>
              <Text className="text-stone-400 text-sm text-center leading-5 max-w-56">
                Scan new artworks and they'll appear here
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                className="px-6"
              >
                <View className="gap-2 pb-4">
                  {availableScans.map((scan) => {
                    const artworkId = scan.artwork?.id;
                    if (!artworkId) return null;
                    const isSelected = selectedArtworkIds.has(artworkId);
                    const title =
                      scan.userCorrectedTitle ??
                      scan.artwork?.title ??
                      'Unknown Artwork';
                    const artist =
                      scan.userCorrectedArtist ??
                      scan.artwork?.artist?.name ??
                      'Unknown Artist';
                    const imageUrl = scan.artwork?.imageUrl ?? scan.imageUrl;

                    return (
                      <Pressable
                        key={scan.id}
                        onPress={() => toggleSelection(artworkId)}
                        className={`flex-row items-center p-3 rounded-2xl border ${
                          isSelected
                            ? 'bg-stone-50 border-stone-300'
                            : 'border-transparent'
                        }`}
                      >
                        <View className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 mr-3">
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              className="w-full h-full"
                              contentFit="cover"
                              transition={200}
                            />
                          ) : (
                            <View className="w-full h-full items-center justify-center">
                              <Text className="text-stone-400 text-[10px]">
                                No image
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            className="font-medium text-stone-900 text-[15px]"
                            numberOfLines={1}
                          >
                            {title}
                          </Text>
                          <Text className="text-stone-500 text-xs mt-1">
                            {artist}
                          </Text>
                        </View>
                        <View
                          className={`w-6 h-6 rounded-full items-center justify-center ${
                            isSelected
                              ? 'bg-stone-900'
                              : 'border border-stone-300'
                          }`}
                        >
                          {isSelected && (
                            <Check size={14} color="#fff" strokeWidth={3} />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Confirm button */}
              <View className="px-6 pt-3 border-t border-stone-100">
                <Pressable
                  onPress={handleBatchAdd}
                  disabled={selectedArtworkIds.size === 0 || isBatchSaving}
                  className={`py-4 rounded-2xl items-center ${
                    selectedArtworkIds.size > 0
                      ? 'bg-stone-900 active:bg-stone-800'
                      : 'bg-stone-200'
                  }`}
                >
                  {isBatchSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      className={`font-semibold text-[15px] ${
                        selectedArtworkIds.size > 0
                          ? 'text-white'
                          : 'text-stone-400'
                      }`}
                    >
                      {selectedArtworkIds.size === 0
                        ? 'Select artworks'
                        : selectedArtworkIds.size === 1
                          ? 'Add 1 artwork'
                          : `Add ${selectedArtworkIds.size} artworks`}
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Modal>

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
