/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { ReactNode } from 'react';
import { Motion } from '@legendapp/motion';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Clock,
  Globe,
  MapPin,
  Phone,
  Share2,
} from 'lucide-react-native';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Share,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, ScrollView, Text, View } from '@/components/ui';
import { useMuseum } from '@/lib/hooks';

// ─── Constants ───────────────────────────────────────────
const HERO_HEIGHT = 320;
const HEADER_HEIGHT = 56;

// ─── Info Card ───────────────────────────────────────────
function InfoCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="bg-white p-4 rounded-2xl border border-stone-100 flex-row items-start gap-3 flex-1 active:bg-stone-50"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {icon}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-stone-900 mb-0.5">
          {title}
        </Text>
        <Text className="text-xs text-stone-500" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export function MuseumDetailScreen() {
  const { id, place } = useLocalSearchParams<{ id: string; place?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPlaceId = place === '1';
  const { data: museum, isLoading, error } = useMuseum(id, isPlaceId);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated header
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [HERO_HEIGHT - 140, HERO_HEIGHT - 80],
      [0, 1],
    ),
  }));

  // Hero parallax
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * 0.4 }],
  }));

  const handleShare = async () => {
    if (!museum) return;
    try {
      await Share.share({
        message: `${museum.name} — shared from ArtMemory`,
        url: museum.websiteUrl ?? undefined,
      });
    } catch {
      // user cancelled
    }
  };

  const handleOpenMaps = async () => {
    if (!museum) return;
    const { latitude, longitude, name } = museum;
    const encodedName = encodeURIComponent(name);
    const encodedAddress = encodeURIComponent(
      [museum.address, museum.city, museum.state, museum.country]
        .filter(Boolean)
        .join(', '),
    );

    if (Platform.OS === 'ios') {
      const hasCoords = latitude != null && longitude != null;
      const candidates = [
        {
          label: 'Apple Maps',
          scheme: 'maps:',
          url: hasCoords
            ? `maps:0,0?q=${encodedName}&ll=${latitude},${longitude}`
            : `maps:?q=${encodedAddress}`,
        },
        {
          label: 'Google Maps',
          scheme: 'comgooglemaps://',
          url: hasCoords
            ? `comgooglemaps://?q=${encodedName}&center=${latitude},${longitude}`
            : `comgooglemaps://?q=${encodedAddress}`,
        },
        ...(hasCoords
          ? [
              {
                label: 'Waze',
                scheme: 'waze://',
                url: `waze://?ll=${latitude},${longitude}&navigate=yes`,
              },
            ]
          : []),
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

      if (available.length === 0) {
        const webUrl = hasCoords
          ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
          : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        Linking.openURL(webUrl).catch(() => {});
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
      const url = `geo:${latitude ?? 0},${longitude ?? 0}?q=${encodedAddress}`;
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleOpenWebsite = () => {
    if (museum?.websiteUrl) {
      Linking.openURL(museum.websiteUrl).catch(() => {});
    }
  };

  const handleCall = () => {
    if (museum?.phone) {
      Linking.openURL(`tel:${museum.phone}`).catch(() => {});
    }
  };

  // ── Helpers ──
  const getTodayHours = (): string | null => {
    if (!museum?.openingHours) return null;
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const today = days[new Date().getDay()];
    return (museum.openingHours as Record<string, string>)[today] ?? null;
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  // ── Error ──
  if (error || !museum) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center px-8">
        <Text className="font-serif text-2xl font-semibold text-stone-900 mb-2 text-center">
          Museum not found
        </Text>
        <Text className="text-stone-400 text-center mb-6">
          We couldn't load this museum.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-stone-900 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const todayHours = getTodayHours();
  const locationText = [museum.city, museum.state, museum.country]
    .filter(Boolean)
    .join(', ');

  return (
    <View className="flex-1 bg-stone-50">
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
        className="bg-stone-50 border-b border-stone-200"
      >
        <View className="flex-1 flex-row items-center justify-center px-16">
          <Text
            className="font-serif text-base font-semibold text-stone-900"
            numberOfLines={1}
          >
            {museum.name}
          </Text>
        </View>
      </Animated.View>

      {/* ── Nav buttons ── */}
      <View
        style={{ paddingTop: insets.top + 4 }}
        className="absolute top-0 left-0 right-0 z-60 flex-row justify-between items-center px-5"
      >
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 bg-black/30 rounded-full items-center justify-center"
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>
        <Pressable
          onPress={handleShare}
          className="w-11 h-11 bg-black/30 rounded-full items-center justify-center"
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
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {/* Hero image */}
        <View style={{ height: HERO_HEIGHT, overflow: 'hidden' }}>
          <Animated.View style={[heroStyle, { height: HERO_HEIGHT + 60 }]}>
            {museum.imageUrl ? (
              <Image
                source={{ uri: museum.imageUrl }}
                className="w-full h-full"
                contentFit="cover"
                transition={400}
              />
            ) : (
              <View className="flex-1 bg-stone-200 items-center justify-center">
                <MapPin size={32} color="#a8a29e" />
              </View>
            )}
          </Animated.View>
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
          {/* Bottom fade into content */}
          <LinearGradient
            colors={['transparent', 'rgba(250,250,249,0.6)', '#fafaf9']}
            locations={[0, 0.6, 1]}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
            }}
          />
        </View>

        {/* Content card */}
        <Motion.View
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          className="px-6 -mt-4"
        >
          {/* Tags */}
          <View className="flex-row gap-2 mb-4">
            {museum.admissionInfo && (
              <View className="px-3 py-1.5 bg-stone-200/50 border border-stone-200 rounded-lg">
                <Text className="text-xs font-medium text-stone-800">
                  {museum.admissionInfo}
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className="font-serif text-[28px] leading-8.5 font-medium text-stone-900 mb-4">
            {museum.name}
          </Text>

          {/* Rating & Location row */}
          <View className="flex-row flex-wrap gap-4 mb-8">
            {/* We don't have rating on the Museum type, but show location */}
            {locationText ? (
              <View className="flex-row items-center gap-1.5">
                <MapPin size={16} color="#a8a29e" />
                <Text className="text-sm text-stone-600 font-medium">
                  {locationText}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {museum.description ? (
            <Text className="text-stone-600 leading-relaxed text-[15px] mb-8">
              {museum.description}
            </Text>
          ) : null}

          {/* Info Cards Grid */}
          <View className="flex-row gap-4 mb-4">
            {todayHours && (
              <InfoCard
                icon={<Clock size={20} color="#a8a29e" />}
                title="Today's Hours"
                subtitle={todayHours}
              />
            )}
            {museum.websiteUrl && (
              <InfoCard
                icon={<Globe size={20} color="#a8a29e" />}
                title="Website"
                subtitle="Visit website"
                onPress={handleOpenWebsite}
              />
            )}
          </View>

          <View className="flex-row gap-4 mb-10">
            {museum.phone && (
              <InfoCard
                icon={<Phone size={20} color="#a8a29e" />}
                title="Phone"
                subtitle={museum.phone}
                onPress={handleCall}
              />
            )}
            {museum.address && (
              <InfoCard
                icon={<MapPin size={20} color="#a8a29e" />}
                title="Directions"
                subtitle={museum.address}
                onPress={handleOpenMaps}
              />
            )}
          </View>
        </Motion.View>
      </Animated.ScrollView>
    </View>
  );
}
