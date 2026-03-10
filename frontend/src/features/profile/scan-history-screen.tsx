/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import { useScanHistory } from '@/lib/hooks';

import type { Scan } from '@/lib/api/types';

// ─── Helpers ─────────────────────────────────────────────
function formatScanDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// ─── Scan Card ───────────────────────────────────────────
function ScanCard({
  scan,
  index,
  onPress,
}: {
  scan: Scan;
  index: number;
  onPress: () => void;
}) {
  const title =
    scan.userCorrectedTitle ?? scan.artwork?.title ?? 'Unknown Artwork';
  const artist =
    scan.userCorrectedArtist ?? scan.artwork?.artist?.name ?? 'Unknown Artist';
  const imageUrl = scan.artwork?.imageUrl ?? scan.imageUrl;
  const hasImage = !!imageUrl && imageUrl.length > 0;
  const dateLabel = formatScanDate(scan.createdAt);

  return (
    <Motion.View
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: Math.min(index * 50, 400),
      }}
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
        {/* Thumbnail */}
        <View className="w-20 h-24 rounded-2xl overflow-hidden bg-stone-200">
          {hasImage ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full"
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-stone-400 text-[10px]">No image</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1 py-1 pr-2 justify-center">
          <View className="flex-row justify-between items-start mb-1">
            <Text
              className="font-serif text-[16px] font-medium text-stone-900 leading-snug flex-1 mr-2"
              numberOfLines={1}
            >
              {title}
            </Text>
            <View className="bg-stone-100 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-medium text-stone-400">
                {dateLabel}
              </Text>
            </View>
          </View>
          <Text
            className="text-stone-600 text-[13px] font-medium mb-1"
            numberOfLines={1}
          >
            {artist}
          </Text>
          {scan.confidence != null && (
            <Text className="text-stone-400 text-[11px]">
              {Math.round(scan.confidence * 100)}% match
              {scan.scanType === 'COMBINED' ? ' · Artwork + Label' : ''}
            </Text>
          )}
        </View>
      </Pressable>
    </Motion.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export function ScanHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: scans, isLoading } = useScanHistory();

  return (
    <View className="flex-1 bg-stone-50">
      {/* Sticky Header */}
      <View className="bg-stone-50/90 px-6 pb-4 flex-row items-center gap-4 border-b border-stone-200/50 mt-16">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-stone-200/50"
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#1c1917" />
        </Pressable>
        <Text className="font-serif text-2xl font-medium text-stone-900">
          Scan History
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1c1917" />
        </View>
      ) : (
        <FlatList
          data={scans ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 100 + insets.bottom,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="font-serif text-xl font-medium text-stone-900 mb-2">
                No scans yet
              </Text>
              <Text className="text-stone-500 text-sm text-center max-w-60">
                Head to the Scan tab to identify your first artwork
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ScanCard
              scan={item}
              index={index}
              onPress={() =>
                item.artwork?.id
                  ? router.push(`/artworks/${item.artwork.id}`)
                  : undefined
              }
            />
          )}
        />
      )}
    </View>
  );
}
