import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserStore } from '@/features/auth/use-user-store';
import { useArtworks, useNearbyMuseums, useScanHistory } from '@/lib/hooks';
import type { Artwork, NearbyMuseum, Scan } from '@/lib/api/types';

// ─── Helpers ────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function formatDistance(meters?: number): string {
  if (meters == null) return '';
  return meters < 1000
    ? `${Math.round(meters)} m away`
    : `${(meters / 1000).toFixed(1)} km away`;
}

// ─── Sub-components ─────────────────────────────────────

function SkeletonRow({ count = 3, width = 128, height = 160 }: { count?: number; width?: number; height?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 24 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ width, height, borderRadius: 12, backgroundColor: '#e7e5e4' }}
        />
      ))}
    </View>
  );
}

function SectionHeader({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {linkLabel && (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={styles.sectionLink}>{linkLabel} ›</Text>
        </Pressable>
      )}
    </View>
  );
}

function ScanCard({ scan, onPress }: { scan: Scan; onPress: () => void }) {
  return (
    <Pressable style={styles.scanCard} onPress={onPress}>
      <View style={styles.scanCardImage}>
        {scan.artwork?.imageUrl ? (
          <Image
            source={{ uri: scan.artwork.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#d6d3d1' }]} />
        )}
      </View>
      <Text style={styles.scanCardTitle} numberOfLines={1}>
        {scan.artwork?.title ?? 'Unknown artwork'}
      </Text>
      <Text style={styles.scanCardArtist} numberOfLines={1}>
        {scan.artwork?.artist?.name ?? '—'}
      </Text>
    </Pressable>
  );
}

function ArtworkCard({ artwork, onPress }: { artwork: Artwork; onPress: () => void }) {
  return (
    <Pressable style={styles.artworkCard} onPress={onPress}>
      <View style={styles.artworkCardImage}>
        {artwork.imageUrl ? (
          <Image
            source={{ uri: artwork.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#d6d3d1' }]} />
        )}
      </View>
      <Text style={styles.artworkCardTitle} numberOfLines={2}>
        {artwork.title}
      </Text>
      <Text style={styles.artworkCardArtist} numberOfLines={1}>
        {artwork.artist?.name ?? '—'}
      </Text>
    </Pressable>
  );
}

function MuseumCard({ museum, onPress }: { museum: NearbyMuseum; onPress: () => void }) {
  const dist = formatDistance(museum.distance);

  return (
    <Pressable style={styles.museumCard} onPress={onPress}>
      <View style={styles.museumCardImage}>
        {museum.photoUrl ? (
          <Image
            source={{ uri: museum.photoUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#d6d3d1' }]} />
        )}
        {museum.openNow != null && (
          <View style={styles.openBadge}>
            <View style={[styles.openDot, { backgroundColor: museum.openNow ? '#22c55e' : '#a8a29e' }]} />
            <Text style={styles.openBadgeText}>{museum.openNow ? 'Open' : 'Closed'}</Text>
          </View>
        )}
      </View>
      <View style={styles.museumCardBody}>
        <Text style={styles.museumCardName} numberOfLines={1}>
          {museum.name}
        </Text>
        <Text style={styles.museumCardMeta} numberOfLines={1}>
          {[museum.address, dist].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────

export function HomeScreen() {
  const router = useRouter();
  const user = useUserStore.use.user();

  const scans = useScanHistory();
  const artworks = useArtworks();
  const nearby = useNearbyMuseums();

  const recentScans = scans.data?.slice(0, 6) ?? [];
  const featuredArtworks = artworks.data?.slice(0, 8) ?? [];
  const nearbyMuseum = nearby.data?.[0] ?? null;

  const greeting = getGreeting();
  const firstName = user?.firstName ?? user?.email?.split('@')[0] ?? 'there';
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingLabel}>{greeting}</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/profile')} hitSlop={8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Scan CTAs ────────────────────────────────── */}
        <View style={styles.scanRow}>
          <Pressable
            style={({ pressed }) => [styles.scanCtaDark, pressed && styles.scanCtaDarkPressed]}
            onPress={() =>
              router.push({
                pathname: '/scan/camera',
                params: { type: 'combined', step: 'artwork' },
              })
            }
          >
            <View style={styles.scanCtaIconDark}>
              <Text style={styles.scanCtaIconText}>⊞</Text>
            </View>
            <Text style={styles.scanCtaTitleDark}>Artwork + Details</Text>
            <Text style={styles.scanCtaSubDark}>
              Scan artwork and museum label for richer results
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.scanCtaLight, pressed && styles.scanCtaLightPressed]}
            onPress={() =>
              router.push({
                pathname: '/scan/camera',
                params: { type: 'artwork_only', step: 'artwork' },
              })
            }
          >
            <View style={styles.scanCtaIconLight}>
              <Text style={styles.scanCtaIconTextDark}>⊡</Text>
            </View>
            <Text style={styles.scanCtaTitleLight}>Artwork Only</Text>
            <Text style={styles.scanCtaSubLight}>
              Quickly identify without scanning the label
            </Text>
          </Pressable>
        </View>

        {/* ── Recent Scans ─────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title="Recent Scans"
            linkLabel="View all"
            onPress={() => router.push('/profile/history')}
          />
          {scans.isLoading ? (
            <SkeletonRow count={3} width={128} height={160} />
          ) : recentScans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No scans yet. Go scan your first artwork!</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {recentScans.map(scan => (
                <ScanCard
                  key={scan.id}
                  scan={scan}
                  onPress={() =>
                    scan.artwork
                      ? router.push(`/artworks/${scan.artwork.id}`)
                      : undefined
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Nearby Museums ───────────────────────────── */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <SectionHeader
            title="Nearby Museums"
            linkLabel="Explore"
            onPress={() => router.push('/discover')}
          />

          {nearby.locationStatus === 'requesting' || nearby.isLoading ? (
            <View style={[styles.emptyState, { marginHorizontal: 24 }]}>
              <ActivityIndicator size="small" color="#a8a29e" />
              <Text style={[styles.emptyText, { marginTop: 8 }]}>
                Discovering nearby museums…
              </Text>
            </View>
          ) : nearby.locationStatus === 'denied' ? (
            <Pressable
              style={styles.locationNudge}
              onPress={() => router.push('/discover')}
            >
              <Text style={styles.locationNudgeText}>
                Enable location to see museums near you
              </Text>
              <Text style={styles.locationNudgeLink}>Browse manually →</Text>
            </Pressable>
          ) : nearbyMuseum ? (
            <View style={{ paddingHorizontal: 24 }}>
              <MuseumCard
                museum={nearbyMuseum}
                onPress={() =>
                  nearbyMuseum.museumId
                    ? router.push(`/discover/${nearbyMuseum.museumId}`)
                    : router.push('/discover')
                }
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No museums found nearby.</Text>
            </View>
          )}
        </View>

        {/* ── Featured Artworks ────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title="Featured Artworks"
            linkLabel="View all"
            onPress={() => router.push('/(app)/artworks')}
          />
          {artworks.isLoading ? (
            <SkeletonRow count={3} width={140} height={180} />
          ) : featuredArtworks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No artworks in the database yet.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {featuredArtworks.map(artwork => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  onPress={() => router.push(`/artworks/${artwork.id}`)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greetingName: {
    fontFamily: SERIF,
    fontSize: 32,
    fontWeight: '600',
    color: '#1c1917',
    lineHeight: 38,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e7e5e4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#57534e',
  },

  // Scan CTAs
  scanRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  scanCtaDark: {
    flex: 1,
    backgroundColor: '#1c1917',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  scanCtaDarkPressed: {
    backgroundColor: '#292524',
  },
  scanCtaLight: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  scanCtaLightPressed: {
    backgroundColor: '#fafaf9',
  },
  scanCtaIconDark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCtaIconLight: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f4f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCtaIconText: {
    fontSize: 22,
    color: '#ffffff',
  },
  scanCtaIconTextDark: {
    fontSize: 22,
    color: '#44403c',
  },
  scanCtaTitleDark: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 20,
  },
  scanCtaTitleLight: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1917',
    lineHeight: 20,
  },
  scanCtaSubDark: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 17,
  },
  scanCtaSubLight: {
    fontSize: 12,
    color: '#78716c',
    lineHeight: 17,
  },

  // Section
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    fontWeight: '500',
    color: '#1c1917',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '500',
    color: '#78716c',
  },
  horizontalList: {
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyState: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#a8a29e',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Scan cards
  scanCard: {
    width: 128,
  },
  scanCardImage: {
    width: 128,
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e7e5e4',
    marginBottom: 10,
  },
  scanCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1917',
    lineHeight: 18,
  },
  scanCardArtist: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
  },

  // Artwork cards
  artworkCard: {
    width: 140,
  },
  artworkCardImage: {
    width: 140,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e7e5e4',
    marginBottom: 10,
  },
  artworkCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1917',
    lineHeight: 18,
  },
  artworkCardArtist: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
  },

  // Museum card
  museumCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0efee',
  },
  museumCardImage: {
    height: 160,
    backgroundColor: '#e7e5e4',
    position: 'relative',
  },
  openBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1c1917',
  },
  museumCardBody: {
    padding: 14,
  },
  museumCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1917',
    marginBottom: 4,
  },
  museumCardMeta: {
    fontSize: 12,
    color: '#78716c',
  },

  // Location nudge
  locationNudge: {
    marginHorizontal: 24,
    backgroundColor: '#f5f4f2',
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  locationNudgeText: {
    fontSize: 14,
    color: '#57534e',
    lineHeight: 20,
  },
  locationNudgeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1917',
  },
});
