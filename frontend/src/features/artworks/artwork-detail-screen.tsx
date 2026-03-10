/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { Artwork } from '@/lib/api/types';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Motion } from '@legendapp/motion';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bookmark,
  ChevronLeft,
  Clock,
  ExternalLink,
  MapPin,
  Palette,
  Plus,
  Ruler,
  Share2,
  X,
} from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, Share, Platform } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import { renderBackdrop } from '@/components/ui/modal';
import {
  useArtwork,
  useCollections,
  useSaveArtwork,
  useSavedArtworks,
  useRemoveSavedArtwork,
} from '@/lib/hooks';

// ─── Constants ───────────────────────────────────────────
const HERO_HEIGHT = 420;
const HEADER_HEIGHT = 56;

// ─── Main Screen ─────────────────────────────────────────
export function ArtworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: artwork, isLoading, error } = useArtwork(id);
  const { data: savedArtworks } = useSavedArtworks();
  const saveArtwork = useSaveArtwork();
  const removeSavedArtwork = useRemoveSavedArtwork();

  const scrollY = useSharedValue(0);
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);

  // Check if already saved
  const savedEntry = React.useMemo(
    () => savedArtworks?.find((s) => s.artworkId === id),
    [savedArtworks, id],
  );
  const isSaved = !!savedEntry;

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated header opacity
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [HERO_HEIGHT - 140, HERO_HEIGHT - 80],
      [0, 1],
    ),
  }));

  // Animated hero parallax
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

  // ── Loading ──
  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  // ── Error ──
  if (error || !artwork) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center px-8">
        <Text className="font-serif text-2xl font-semibold text-charcoal-900 mb-2 text-center">
          Artwork not found
        </Text>
        <Text className="text-charcoal-400 text-center mb-6">
          We couldn't load this artwork. It may have been removed.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-charcoal-900 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const confidence = artwork.source === 'AI_SCAN' ? 0.89 : null; // from scan context
  const confidencePercent = confidence ? Math.round(confidence * 100) : null;

  return (
    <View className="flex-1 bg-neutral-50">
      {/* ── Sticky header (appears on scroll) ── */}
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
          },
        ]}
        className="bg-neutral-50 border-b border-neutral-200"
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

      {/* ── Nav buttons (always visible) ── */}
      <View
        style={{ paddingTop: insets.top + 4 }}
        className="absolute top-0 left-0 right-0 z-[60] flex-row justify-between items-center px-5"
      >
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 bg-black/30 rounded-full items-center justify-center"
          style={{ backdropFilter: 'blur(12px)' }}
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>

        <Pressable
          onPress={handleShare}
          className="w-11 h-11 bg-black/30 rounded-full items-center justify-center"
          style={{ backdropFilter: 'blur(12px)' }}
          hitSlop={8}
        >
          <Share2 size={18} color="#fff" />
        </Pressable>
      </View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        {/* Hero image */}
        <View style={{ height: HERO_HEIGHT, overflow: 'hidden' }}>
          <Animated.View style={[heroStyle, { height: HERO_HEIGHT + 80 }]}>
            <Image
              source={artwork.imageUrl ?? ''}
              className="w-full h-full"
              contentFit="cover"
              transition={400}
            />
          </Animated.View>
          {/* Bottom fade */}
          <LinearGradient
            colors={['transparent', 'rgba(250,250,250,0.6)', '#FAFAFA']}
            locations={[0, 0.6, 1]}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
            }}
          />
          {/* Top fade */}
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 120,
            }}
          />
          {/* Confidence badge */}
          {confidencePercent && confidencePercent >= 80 && (
            <Motion.View
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400, delay: 300 }}
              className="absolute top-0 left-0 right-0 items-center"
              style={{ top: insets.top + 14 }}
            >
              <View className="bg-white/20 px-3 py-1.5 rounded-full">
                <Text className="text-white text-xs font-semibold tracking-wider">
                  {confidencePercent}% match
                </Text>
              </View>
            </Motion.View>
          )}
        </View>

        {/* Content */}
        <Motion.View
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          className="px-6 -mt-2"
        >
          {/* Title + bookmark */}
          <View className="flex-row items-start justify-between gap-3 mb-1">
            <Text className="font-serif text-[28px] leading-[34px] font-semibold text-charcoal-900 flex-1 flex-shrink">
              {artwork.title}
            </Text>
            <Pressable
              onPress={handleSaveToggle}
              className="mt-1 w-11 h-11 rounded-full bg-charcoal-50 items-center justify-center"
              hitSlop={8}
            >
              <Bookmark
                size={20}
                color={isSaved ? '#1E1E1E' : '#7D7D7D'}
                fill={isSaved ? '#1E1E1E' : 'none'}
              />
            </Pressable>
          </View>

          {/* Artist, year */}
          <Text className="text-base text-charcoal-500 mb-5">
            <Text className="font-semibold text-charcoal-800">
              {artwork.artist?.name ?? 'Unknown Artist'}
            </Text>
            {artwork.year ? (
              <Text className="text-charcoal-400">, {artwork.year}</Text>
            ) : null}
          </Text>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2 mb-8">
            {artwork.medium ? (
              <TagPill
                icon={<Palette size={14} color="#969696" />}
                label={artwork.medium}
              />
            ) : null}
            {artwork.style ? <TagPill label={artwork.style} /> : null}
            {artwork.museum ? (
              <TagPill
                icon={<View className="w-2 h-2 rounded-full bg-success-500" />}
                label={artwork.museum.name}
              />
            ) : null}
          </View>

          {/* About */}
          {artwork.description ? (
            <View className="mb-8">
              <Text className="font-serif text-xl font-semibold text-charcoal-900 mb-3">
                About
              </Text>
              <Text className="text-[15px] leading-6 text-charcoal-500">
                {artwork.description}
              </Text>
            </View>
          ) : null}

          {/* Details grid */}
          <View className="mb-8">
            <Text className="font-serif text-xl font-semibold text-charcoal-900 mb-4">
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

          {/* Learn more link */}
          {artwork.wikiUrl ? (
            <Pressable
              onPress={() => {
                // Use Linking or WebBrowser
              }}
              className="flex-row items-center justify-between bg-white border border-neutral-200 rounded-2xl px-5 py-4"
            >
              <View>
                <Text className="text-sm font-semibold text-charcoal-900">
                  Learn more
                </Text>
                <Text className="text-xs text-charcoal-400 mt-0.5">
                  Wikipedia
                </Text>
              </View>
              <ExternalLink size={18} color="#969696" />
            </Pressable>
          ) : null}
        </Motion.View>
      </Animated.ScrollView>

      {/* ── Save to Collection bottom sheet ── */}
      <CollectionSheet
        ref={bottomSheetRef}
        onSelect={handleSaveToCollection}
        isPending={saveArtwork.isPending}
      />
    </View>
  );
}

// ─── Tag Pill ────────────────────────────────────────────
function TagPill({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 bg-white border border-neutral-200 px-4 py-2 rounded-full">
      {icon}
      <Text className="text-sm font-semibold text-charcoal-700">{label}</Text>
    </View>
  );
}

// ─── Detail Card ─────────────────────────────────────────
function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="bg-white border border-neutral-200 rounded-2xl px-4 py-3.5 w-[48%]">
      <View className="flex-row items-center gap-1.5 mb-1.5">
        {icon}
        <Text className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
          {label}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-charcoal-800">{value}</Text>
    </View>
  );
}

// ─── Collection Bottom Sheet ─────────────────────────────
const CollectionSheet = React.forwardRef<
  BottomSheetModal,
  {
    onSelect: (id: string) => void;
    isPending: boolean;
    onCreateNew?: () => void;
  }
>(({ onSelect, isPending, onCreateNew }, ref) => {
  const { data: collections, isLoading } = useCollections();

  const snapPoints = React.useMemo(() => ['55%'], []);

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      handleComponent={() => (
        <View className="items-center pt-3 pb-2">
          <View className="w-12 h-1.5 bg-stone-200 rounded-full" />
        </View>
      )}
    >
      <BottomSheetView className="flex-1 px-6 pb-8">
        {/* Title row */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="font-serif text-2xl font-medium text-stone-900">
            Save to Collection
          </Text>
          <Pressable
            onPress={() =>
              (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
            }
            className="p-2 bg-stone-100 rounded-full"
            hitSlop={8}
          >
            <X size={20} color="#1c1917" />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#1c1917" className="mt-4" />
        ) : (
          <View className="gap-3 mb-6">
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
                  className="flex-row items-center p-3 rounded-2xl active:bg-stone-50 border border-transparent active:border-stone-200"
                >
                  {/* Collection thumbnail */}
                  <View className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 mr-4">
                    {coverImage ? (
                      <Image
                        source={{ uri: coverImage }}
                        className="w-full h-full"
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Bookmark size={16} color="#a8a29e" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-medium text-stone-900 text-[15px]"
                      numberOfLines={1}
                    >
                      {collection.name}
                    </Text>
                    <Text className="text-stone-500 text-xs mt-1">
                      {collection._count.savedArtworks} artwork
                      {collection._count.savedArtworks === 1 ? '' : 's'}
                      {collection.isDefault ? ' · Default' : ''}
                    </Text>
                  </View>
                  <View className="w-6 h-6 rounded-full border border-stone-300" />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Create New Collection */}
        <Pressable
          onPress={onCreateNew}
          className="flex-row items-center justify-center gap-2 py-4 border-2 border-dashed border-stone-200 rounded-2xl active:bg-stone-50 active:border-stone-300"
        >
          <Plus size={20} color="#57534e" />
          <Text className="text-stone-600 font-medium">
            Create New Collection
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
