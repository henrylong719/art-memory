/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useMemo, useRef, useState } from 'react';
import { AnimatePresence } from '@legendapp/motion';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Motion } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bookmark,
  Camera,
  ChevronLeft,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Palette,
  Pencil,
  Ruler,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Share,
  Platform,
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
import Toast from '@/components/ui/toast';
import { CollectionSheet } from '@/features/artworks/components/collection-sheet';
import { ConfirmModal } from '@/features/artworks/components/confirm-modal';
import { DetailCard } from '@/features/artworks/components/detail-card';
import { FullscreenImageModal } from '@/features/artworks/components/fullscreen-image-modal';
import { TagPill } from '@/features/artworks/components/tag-pill';
import { useImageOrientation } from '@/features/artworks/hooks/use-image-orientation';
import {
  useArtwork,
  useDeleteArtwork,
  useStoryGenerator,
  useSaveArtwork,
  useSavedArtworks,
  useRemoveSavedArtwork,
  useToast,
} from '@/lib/hooks';
import { showGlobalToast } from '@/lib/toast-store';
import { getErrorMessage } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────
const HERO_HEIGHT_PORTRAIT = 420;
const HERO_HEIGHT_LANDSCAPE = 280;
const HEADER_HEIGHT = 56;

const px = (v: number) =>
  Platform.OS === 'web' ? (`${v}px` as unknown as number) : v;

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

  const imageOrientation = useImageOrientation(artwork?.imageUrl);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const { toast, showToast } = useToast();

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
    } catch (error) {
      if (
        error instanceof Error &&
        error.message?.toLowerCase().includes('cancel')
      ) {
        return;
      }
      showToast("We couldn't open the share sheet. Please try again.", 'error');
    }
  };

  const handleSaveToggle = () => {
    if (saveArtwork.isPending || removeSavedArtwork.isPending) return;

    if (isSaved && savedEntry) {
      removeSavedArtwork.mutate(savedEntry.id, {
        onSuccess: () =>
          showToast('Removed from your saved artworks.', 'success'),
        onError: (error) =>
          showToast(
            getErrorMessage(
              error,
              "We couldn't remove this artwork right now.",
            ),
            'error',
          ),
      });
    } else {
      bottomSheetRef.current?.present();
    }
  };

  const handleSaveToCollection = (collectionId: string) => {
    saveArtwork.mutate(
      { artworkId: id, collectionId },
      {
        onSuccess: () => {
          bottomSheetRef.current?.dismiss();
          showToast('Artwork saved to your collection.', 'success');
        },
        onError: (error) =>
          showToast(
            getErrorMessage(error, "We couldn't save this artwork."),
            'error',
          ),
      },
    );
  };

  const handleDelete = () => {
    deleteArtwork.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmVisible(false);
        showGlobalToast('Artwork deleted');
        router.dismissAll();
      },
      onError: (error) => {
        setDeleteConfirmVisible(false);
        showToast(
          getErrorMessage(error, "We couldn't remove this artwork."),
          'error',
        );
      },
    });
  };

  const isImageReady = !artwork?.imageUrl || imageOrientation !== null;

  if (isLoading || !isImageReady) {
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

  const confidence = artwork.scanConfidence ?? null;
  const confidencePercent =
    confidence != null ? Math.round(confidence * 100) : null;
  const isUnverifiedAiScan = confidence != null && confidence < 0.5;
  const isManualEntry = artwork.source === 'MANUAL';
  const isLowConfidence =
    (isUnverifiedAiScan || isManualEntry) && !artwork.verified;

  return (
    <View className="flex-1 bg-neutral-50">
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>

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
              <View
                style={{ height: px(heroHeight), overflow: 'hidden' }}
                className="bg-neutral-200"
              >
                {artwork.imageUrl ? (
                  <Image
                    source={artwork.imageUrl}
                    className="h-full w-full"
                    contentFit="cover"
                    transition={400}
                    onLoad={() => setHeroImageLoaded(true)}
                    style={{ opacity: heroImageLoaded ? 1 : 0 }}
                  />
                ) : null}
              </View>
            </Pressable>
          </Animated.View>

          {confidencePercent != null && confidencePercent > 0 && (
            <Motion.View
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400, delay: 300 }}
              className="absolute left-0 right-0 top-0 items-center"
              style={{ top: insets.top + 14 }}
            >
              <View
                className={`rounded-full px-3 py-1.5 ${
                  isLowConfidence ? 'bg-black/40' : 'bg-white/20'
                }`}
              >
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
              disabled={saveArtwork.isPending || removeSavedArtwork.isPending}
              className="mt-1 h-11 w-11 items-center justify-center rounded-full bg-charcoal-50"
              hitSlop={8}
            >
              {saveArtwork.isPending || removeSavedArtwork.isPending ? (
                <ActivityIndicator size="small" color="#1E1E1E" />
              ) : (
                <Bookmark
                  size={20}
                  color={isSaved ? '#1E1E1E' : '#7D7D7D'}
                  fill={isSaved ? '#1E1E1E' : 'none'}
                />
              )}
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
            {isLowConfidence ? (
              <TagPill
                icon={<Camera size={14} color="#969696" />}
                label="Personal upload"
              />
            ) : null}
          </View>

          {/* About Section */}
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
            ) : isLowConfidence ? (
              <View className="items-center rounded-2xl border border-neutral-200 bg-charcoal-50 p-6">
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-white">
                  <Sparkles size={20} color="#a8a29e" />
                </View>
                <Text className="mb-1 text-center font-medium text-charcoal-900">
                  No story available
                </Text>
                <Text className="max-w-60 text-center text-sm leading-5 text-charcoal-400">
                  AI stories are available for recognized artworks. You can add
                  your own description from the edit page.
                </Text>
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

          {/* Details Section */}
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

          {/* Location Map */}
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
                  if (!url) return;

                  Linking.openURL(url).catch(() => {
                    showToast("We couldn't open your maps app.", 'error');
                  });
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

          {/* Wiki Link */}
          {artwork.wikiUrl ? (
            <Pressable
              onPress={() => {
                if (!artwork.wikiUrl) return;
                Linking.openURL(artwork.wikiUrl).catch(() => {
                  showToast("We couldn't open that link.", 'error');
                });
              }}
              className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 active:bg-neutral-50"
            >
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

          {/* Delete Action */}
          <View className="items-center border-t border-neutral-200/60 mt-6 pt-6 pb-8">
            <Pressable
              onPress={() => setDeleteConfirmVisible(true)}
              className="rounded-full px-6 py-2.5 active:bg-red-50"
            >
              <Text className="text-sm font-medium text-red-400">
                Remove Artwork
              </Text>
            </Pressable>
          </View>
        </Motion.View>
      </Animated.ScrollView>

      <FullscreenImageModal
        visible={fullscreenVisible}
        imageUrl={artwork.imageUrl}
        topInset={insets.top}
        onClose={() => setFullscreenVisible(false)}
      />

      <CollectionSheet
        ref={bottomSheetRef}
        onSelect={handleSaveToCollection}
        isPending={saveArtwork.isPending}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Remove Artwork?"
        description="This artwork will be removed from your saved artworks or collection. This action cannot be undone."
        confirmLabel="Remove"
        isPending={deleteArtwork.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </View>
  );
}
