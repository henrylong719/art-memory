/* eslint-disable better-tailwindcss/no-unknown-classes */
import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Motion } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bookmark,
  Check,
  ChevronLeft,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Palette,
  Pencil,
  Plus,
  Ruler,
  Share2,
  Sparkles,
  X,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  Share,
  Platform,
  Image as RNImage,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import { GeneratingSkeleton } from '@/components/ui/generating-skeleton';
import { renderBackdrop } from '@/components/ui/modal';
import {
  useArtwork,
  useCollections,
  useDeleteArtwork,
  useStoryGenerator,
  useSaveArtwork,
  useSavedArtworks,
  useRemoveSavedArtwork,
} from '@/lib/hooks';

// ─── Constants ───────────────────────────────────────────
const HERO_HEIGHT_PORTRAIT = 420;
const HERO_HEIGHT_LANDSCAPE = 280;
const HEADER_HEIGHT = 56;

/** Convert a numeric size to a web-safe CSS value (px string on web, number on native). */
const px = (v: number) =>
  Platform.OS === 'web' ? (`${v}px` as unknown as number) : v;

type ImageOrientation = 'portrait' | 'landscape' | 'square';

function getImageOrientation(width: number, height: number): ImageOrientation {
  if (width > height) return 'landscape';
  if (height > width) return 'portrait';
  return 'square';
}

// ─── Main Screen ─────────────────────────────────────────
export function ArtworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: artwork, isLoading, error } = useArtwork(id);
  const { data: savedArtworks } = useSavedArtworks();
  const saveArtwork = useSaveArtwork();
  const removeSavedArtwork = useRemoveSavedArtwork();

  const deleteArtwork = useDeleteArtwork();
  const storyGen = useStoryGenerator({ artworkId: id });

  const [imageOrientation, setImageOrientation] =
    useState<ImageOrientation | null>(null);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const scrollY = useSharedValue(0);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const lastTapRef = useRef(0);

  const savedEntry = useMemo(
    () => savedArtworks?.find((s) => s.artworkId === id),
    [savedArtworks, id],
  );
  const isSaved = !!savedEntry;

  const imageIsLandscape = imageOrientation === 'landscape';
  const heroHeight = imageIsLandscape
    ? HERO_HEIGHT_LANDSCAPE
    : HERO_HEIGHT_PORTRAIT;

  useEffect(() => {
    if (!artwork?.imageUrl || typeof artwork.imageUrl !== 'string') return;

    RNImage.getSize(
      artwork.imageUrl,
      (width, height) => {
        setImageOrientation(getImageOrientation(width, height));
      },
      (err) => {
        console.log('Failed to get image size:', err);
        setImageOrientation('portrait');
      },
    );
  }, [artwork?.imageUrl]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [heroHeight - 140, heroHeight - 80],
      [0, 1],
    ),
  }));

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * 0.4 }],
  }));

  const handleShare = async () => {
    if (!artwork) return;
    try {
      await Share.share({
        message: `${artwork.title} by ${artwork.artist?.name ?? 'Unknown Artist'} — shared from ArtMemory`,
        url: artwork.wikiUrl ?? undefined,
      });
    } catch {
      // user cancelled
    }
  };

  const handleSaveToggle = () => {
    if (isSaved && savedEntry) {
      removeSavedArtwork.mutate(savedEntry.id);
    } else {
      bottomSheetRef.current?.present();
    }
  };

  const handleSaveToCollection = (collectionId: string) => {
    saveArtwork.mutate(
      { artworkId: id, collectionId },
      { onSuccess: () => bottomSheetRef.current?.dismiss() },
    );
  };

  const handleDelete = () => {
    deleteArtwork.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmVisible(false);
        router.dismissAll();
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  if (error || !artwork) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-8">
        <Text className="mb-2 text-center font-serif text-2xl font-semibold text-charcoal-900">
          Artwork not found
        </Text>
        <Text className="mb-6 text-center text-charcoal-400">
          We couldn't load this artwork. It may have been removed.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-2xl bg-charcoal-900 px-6 py-3"
        >
          <Text className="font-semibold text-white">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const confidence = artwork.source === 'AI_SCAN' ? 0.89 : null;
  const confidencePercent = confidence ? Math.round(confidence * 100) : null;

  return (
    <View className="flex-1 bg-neutral-50">
      <Animated.View
        style={[
          headerStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            paddingTop: insets.top,
            height: HEADER_HEIGHT + insets.top,
            backgroundColor: '#FAFAFA',
            borderBottomWidth: 1,
            borderBottomColor: '#e5e5e5',
          },
        ]}
      >
        <View className="flex-1 flex-row items-center justify-center px-16">
          <Text
            className="font-serif text-base font-semibold text-charcoal-900"
            numberOfLines={1}
          >
            {artwork.title}
          </Text>
        </View>
      </Animated.View>

      <View
        style={{ paddingTop: insets.top + 4 }}
        className="absolute left-0 right-0 top-0 z-60 flex-row items-center justify-between px-5"
      >
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-black/30"
          style={{ backdropFilter: 'blur(12px)' }}
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push(`/artworks/${id}/edit`)}
            className="h-11 w-11 items-center justify-center rounded-full bg-black/30"
            style={{ backdropFilter: 'blur(12px)' }}
            hitSlop={8}
          >
            <Pencil size={18} color="#fff" />
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="h-11 w-11 items-center justify-center rounded-full bg-black/30"
            style={{ backdropFilter: 'blur(12px)' }}
            hitSlop={8}
          >
            <Share2 size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View className="mb-8">
          <Animated.View style={heroStyle}>
            <Pressable
              onPress={() => {
                const now = Date.now();
                if (now - lastTapRef.current < 300) {
                  setFullscreenVisible(true);
                }
                lastTapRef.current = now;
              }}
            >
              <View style={{ height: px(heroHeight), overflow: 'hidden' }}>
                <Image
                  source={artwork.imageUrl ?? ''}
                  className="h-full w-full"
                  contentFit="cover"
                  transition={400}
                />
              </View>
            </Pressable>
          </Animated.View>

          {confidencePercent && confidencePercent >= 80 && (
            <Motion.View
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400, delay: 300 }}
              className="absolute left-0 right-0 top-0 items-center"
              style={{ top: insets.top + 14 }}
            >
              <View className="rounded-full bg-white/20 px-3 py-1.5">
                <Text className="text-xs font-semibold tracking-wider text-white">
                  {confidencePercent}% match
                </Text>
              </View>
            </Motion.View>
          )}
        </View>

        <Motion.View
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          className="-mt-5 rounded-t-3xl bg-neutral-50 px-6 pt-6"
        >
          <View className="mb-1 flex-row items-start justify-between gap-3">
            <Text className="flex-1 shrink font-serif text-[28px] font-semibold leading-8.5 text-charcoal-900">
              {artwork.title}
            </Text>
            <Pressable
              onPress={handleSaveToggle}
              className="mt-1 h-11 w-11 items-center justify-center rounded-full bg-charcoal-50"
              hitSlop={8}
            >
              <Bookmark
                size={20}
                color={isSaved ? '#1E1E1E' : '#7D7D7D'}
                fill={isSaved ? '#1E1E1E' : 'none'}
              />
            </Pressable>
          </View>

          <Text className="mb-5 text-base text-charcoal-500">
            <Text className="font-semibold text-charcoal-800">
              {artwork.artist?.name ?? 'Unknown Artist'}
            </Text>
            {artwork.year ? (
              <Text className="text-charcoal-400">, {artwork.year}</Text>
            ) : null}
          </Text>

          <View className="mb-8 flex-row flex-wrap gap-2">
            {artwork.medium ? (
              <TagPill
                icon={<Palette size={14} color="#969696" />}
                label={artwork.medium}
              />
            ) : null}
            {artwork.style ? <TagPill label={artwork.style} /> : null}
            {artwork.museum ? (
              <TagPill
                icon={<View className="h-2 w-2 rounded-full bg-success-500" />}
                label={artwork.museum.name}
              />
            ) : null}
          </View>

          <View className="mb-8">
            <Text className="mb-3 font-serif text-xl font-semibold text-charcoal-900">
              About
            </Text>

            {artwork.description ? (
              <View>
                <Text className="text-[15px] leading-6 text-charcoal-500">
                  {artwork.description}
                </Text>
                {artwork.description.length > 200 && (
                  <View className="mt-3 flex-row items-center gap-1.5">
                    <Sparkles size={12} color="#a8a29e" />
                    <Text className="text-xs font-medium text-charcoal-400">
                      AI Generated
                    </Text>
                  </View>
                )}
              </View>
            ) : storyGen.isPending ? (
              <GeneratingSkeleton />
            ) : (
              <View className="items-center rounded-2xl border border-neutral-200 bg-charcoal-50 p-6">
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-white">
                  <Sparkles size={20} color="#a8a29e" />
                </View>
                <Text className="mb-1 font-medium text-charcoal-900">
                  No story available yet
                </Text>
                <Text className="mb-5 max-w-50 text-center text-sm leading-5 text-charcoal-400">
                  Use AI to generate a short story and context for this artwork
                </Text>

                {storyGen.errorMessage && (
                  <Text className="mb-3 max-w-60 text-center text-xs text-red-500">
                    {storyGen.errorMessage}
                  </Text>
                )}

                <Pressable
                  onPress={storyGen.generate}
                  disabled={storyGen.isDisabled}
                  className={`rounded-xl px-5 py-2.5 ${
                    storyGen.isDisabled
                      ? 'bg-charcoal-200'
                      : 'bg-charcoal-900 active:bg-charcoal-800'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      storyGen.isDisabled ? 'text-charcoal-400' : 'text-white'
                    }`}
                  >
                    {storyGen.isOnCooldown
                      ? `Wait ${storyGen.cooldownRemaining}s`
                      : storyGen.isAtLimit
                        ? 'Daily limit reached'
                        : 'Generate Story'}
                  </Text>
                </Pressable>

                {storyGen.limitInfo && !storyGen.isAtLimit && (
                  <Text className="mt-2.5 text-[11px] text-charcoal-300">
                    {storyGen.limitInfo.remaining} of {storyGen.limitInfo.limit}{' '}
                    generations left today
                  </Text>
                )}
              </View>
            )}
          </View>

          <View className="mb-8">
            <Text className="mb-4 font-serif text-xl font-semibold text-charcoal-900">
              Details
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {artwork.year ? (
                <DetailCard
                  icon={<Clock size={15} color="#969696" />}
                  label="Year"
                  value={String(artwork.year)}
                />
              ) : null}
              {artwork.dimensions ? (
                <DetailCard
                  icon={<Ruler size={15} color="#969696" />}
                  label="Dimensions"
                  value={artwork.dimensions}
                />
              ) : null}
              {artwork.medium ? (
                <DetailCard
                  icon={<Palette size={15} color="#969696" />}
                  label="Medium"
                  value={artwork.medium}
                />
              ) : null}
              {artwork.museum ? (
                <DetailCard
                  icon={<MapPin size={15} color="#969696" />}
                  label="Museum"
                  value={artwork.museum.name}
                />
              ) : null}
            </View>
          </View>

          {artwork.latitude != null && artwork.longitude != null && (
            <View className="mb-8">
              <Text className="mb-3 font-serif text-xl font-semibold text-charcoal-900">
                Location
              </Text>
              <Pressable
                onPress={() => {
                  const url = Platform.select({
                    ios: `maps:0,0?q=${artwork.latitude},${artwork.longitude}`,
                    android: `geo:${artwork.latitude},${artwork.longitude}?q=${artwork.latitude},${artwork.longitude}`,
                    default: `https://maps.google.com/?q=${artwork.latitude},${artwork.longitude}`,
                  });
                  if (url) Linking.openURL(url).catch(() => {});
                }}
                className="overflow-hidden rounded-2xl border border-neutral-200 active:opacity-90"
              >
                <Image
                  source={{
                    uri: `https://maps.googleapis.com/maps/api/staticmap?center=${artwork.latitude},${artwork.longitude}&zoom=15&size=600x300&scale=2&markers=color:0x1c1917%7C${artwork.latitude},${artwork.longitude}&style=feature:poi%7Cvisibility:off&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}`,
                  }}
                  className="h-40 w-full"
                  contentFit="cover"
                  transition={300}
                />
                <View className="flex-row items-center justify-between bg-white px-4 py-3">
                  <View className="flex-row items-center gap-2">
                    <MapPin size={14} color="#969696" />
                    <Text className="text-sm text-charcoal-500">
                      Scanned location
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 rounded-full bg-charcoal-50 px-3 py-1.5">
                    <Navigation size={12} color="#57534e" />
                    <Text className="text-xs font-semibold text-charcoal-600">
                      Directions
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          )}

          {artwork.wikiUrl ? (
            <Pressable className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4">
              <View>
                <Text className="text-sm font-semibold text-charcoal-900">
                  Learn more
                </Text>
                <Text className="mt-0.5 text-xs text-charcoal-400">
                  Wikipedia
                </Text>
              </View>
              <ExternalLink size={18} color="#969696" />
            </Pressable>
          ) : null}

          <View className="items-center border-t border-neutral-200/60 pb-8">
            <Pressable
              onPress={() => setDeleteConfirmVisible(true)}
              className="rounded-full px-6 py-2.5 active:bg-red-100"
            >
              <Text className="text-sm font-medium text-red-400">
                Remove Artwork
              </Text>
            </Pressable>
          </View>
        </Motion.View>
      </Animated.ScrollView>

      <Modal
        visible={fullscreenVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black">
          {artwork.imageUrl && (
            <Image
              source={artwork.imageUrl}
              className="h-full w-full"
              contentFit="contain"
            />
          )}
          <Pressable
            onPress={() => setFullscreenVisible(false)}
            className="absolute h-11 w-11 items-center justify-center rounded-full"
            style={{
              top: insets.top + 8,
              right: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
            hitSlop={8}
          >
            <X size={22} color="#fff" />
          </Pressable>
        </View>
      </Modal>

      <CollectionSheet
        ref={bottomSheetRef}
        onSelect={handleSaveToCollection}
        isPending={saveArtwork.isPending}
      />

      {showSuccessToast && (
        <Motion.View
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 300 }}
          style={{ top: insets.top + 12 }}
          className="absolute left-0 right-0 z-120 items-center"
        >
          <View className="flex-row items-center gap-2.5 rounded-full bg-charcoal-900 px-5 py-3">
            <View className="h-5 w-5 items-center justify-center rounded-full bg-white/20">
              <Check size={12} color="#fff" strokeWidth={3} />
            </View>
            <Text className="text-sm font-medium tracking-wide text-white">
              Artwork removed
            </Text>
          </View>
        </Motion.View>
      )}

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <Pressable
          onPress={() => setDeleteConfirmVisible(false)}
          className="flex-1 items-center justify-center bg-charcoal-900/40 px-6"
        >
          <Pressable
            onPress={() => {}}
            className="w-full max-w-[320px] items-center rounded-4xl bg-white p-7"
          >
            <Text className="mb-3 text-center font-serif text-2xl font-medium text-charcoal-900">
              Remove Artwork?
            </Text>
            <Text className="mb-8 text-center text-[15px] leading-6 text-charcoal-400">
              This artwork will be removed from your saved artworks or
              collection. This action cannot be undone.
            </Text>
            <View className="w-full gap-3">
              <Pressable
                onPress={handleDelete}
                disabled={deleteArtwork.isPending}
                className="w-full items-center rounded-2xl bg-red-50 py-4 active:bg-red-100"
              >
                {deleteArtwork.isPending ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text className="text-[15px] font-semibold text-red-600">
                    Remove
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setDeleteConfirmVisible(false)}
                className="w-full items-center rounded-2xl bg-charcoal-50 py-4 active:bg-charcoal-100"
              >
                <Text className="text-[15px] font-semibold text-charcoal-700">
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

function TagPill({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2">
      {icon}
      <Text className="text-sm font-semibold text-charcoal-700">{label}</Text>
    </View>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="w-[48%] rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
      <View className="mb-1.5 flex-row items-center gap-1.5">
        {icon}
        <Text className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
          {label}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-charcoal-800">{value}</Text>
    </View>
  );
}

const CollectionSheet = forwardRef<
  BottomSheetModal,
  {
    onSelect: (id: string) => void;
    isPending: boolean;
    onCreateNew?: () => void;
  }
>(({ onSelect, isPending, onCreateNew }, ref) => {
  const { data: collections, isLoading } = useCollections();
  const snapPoints = useMemo(() => ['55%'], []);

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      handleComponent={() => (
        <View className="items-center pb-2 pt-3">
          <View className="h-1.5 w-12 rounded-full bg-stone-200" />
        </View>
      )}
    >
      <BottomSheetView className="flex-1 px-6 pb-8">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="font-serif text-2xl font-medium text-stone-900">
            Save to Collection
          </Text>
          <Pressable
            onPress={() =>
              (ref as RefObject<BottomSheetModal>)?.current?.dismiss()
            }
            className="rounded-full bg-stone-100 p-2"
            hitSlop={8}
          >
            <X size={20} color="#1c1917" />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#1c1917" className="mt-4" />
        ) : (
          <View className="mb-6 gap-3">
            {collections?.map((collection) => {
              const coverImage =
                collection.coverUrl ??
                collection.savedArtworks?.[0]?.artwork?.imageUrl ??
                null;

              return (
                <Pressable
                  key={collection.id}
                  onPress={() => onSelect(collection.id)}
                  disabled={isPending}
                  className="flex-row items-center rounded-2xl border border-transparent p-3 active:border-stone-200 active:bg-stone-50"
                >
                  <View className="mr-4 h-16 w-16 overflow-hidden rounded-xl bg-stone-100">
                    {coverImage ? (
                      <Image
                        source={{ uri: coverImage }}
                        className="h-full w-full"
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Bookmark size={16} color="#a8a29e" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[15px] font-medium text-stone-900"
                      numberOfLines={1}
                    >
                      {collection.name}
                    </Text>
                    <Text className="mt-1 text-xs text-stone-500">
                      {collection._count.savedArtworks} artwork
                      {collection._count.savedArtworks === 1 ? '' : 's'}
                      {collection.isDefault ? ' · Default' : ''}
                    </Text>
                  </View>
                  <View className="h-6 w-6 rounded-full border border-stone-300" />
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={onCreateNew}
          className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-200 py-4 active:border-stone-300 active:bg-stone-50"
        >
          <Plus size={20} color="#57534e" />
          <Text className="font-medium text-stone-600">
            Create New Collection
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
