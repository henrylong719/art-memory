/* eslint-disable better-tailwindcss/no-unknown-classes */
import { forwardRef, useRef, useState, type RefObject } from 'react';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, LibraryBig } from 'lucide-react-native';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { renderBackdrop } from '@/components/ui/modal';
import { useCollections, useCreateCollection } from '@/lib/hooks';

// ─── Collection Card ─────────────────────────────────────
function CollectionCard({
  collection,
  index,
  onPress,
}: {
  collection: {
    id: string;
    name: string;
    coverUrl: string | null;
    _count: { savedArtworks: number };
    savedArtworks?: Array<{
      artwork: { imageUrl: string | null } | null;
      userPhotoUrl: string | null;
    }>;
  };
  index: number;
  onPress: () => void;
}) {
  const coverImage =
    collection.coverUrl ??
    collection.savedArtworks?.[0]?.artwork?.imageUrl ??
    null;

  return (
    <Motion.View
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center bg-white rounded-3xl p-4 gap-5 border border-stone-100 active:bg-stone-50"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 12,
          elevation: 1,
        }}
      >
        {/* Cover Image */}
        <View className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100">
          {coverImage ? (
            <Image
              source={{ uri: coverImage }}
              className="w-full h-full"
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-stone-200">
              <LibraryBig size={24} color="#a8a29e" />
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text
            className="font-serif text-[19px] font-medium text-stone-900 mb-1 leading-snug"
            numberOfLines={1}
          >
            {collection.name}
          </Text>
          <Text className="text-stone-500 text-sm font-medium">
            {collection._count.savedArtworks} artwork
            {collection._count.savedArtworks === 1 ? '' : 's'}
          </Text>
        </View>

        {/* Trailing Icon */}
        <View className="pr-2">
          <View className="w-8 h-8 rounded-full bg-stone-50 items-center justify-center">
            <LibraryBig size={16} color="#a8a29e" />
          </View>
        </View>
      </Pressable>
    </Motion.View>
  );
}

// ─── Create Collection Sheet ─────────────────────────────
const CreateCollectionSheet = forwardRef<
  BottomSheetModal,
  { onCreated?: () => void }
>(({ onCreated }, ref) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createCollection = useCreateCollection();

  const handleCreate = () => {
    if (!name.trim()) return;
    createCollection.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          (ref as RefObject<BottomSheetModal>)?.current?.dismiss();
          onCreated?.();
        },
      },
    );
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={['50%']}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      handleComponent={() => (
        <View className="items-center pt-3 pb-2">
          <View className="w-10 h-1 bg-stone-200 rounded-full" />
        </View>
      )}
    >
      <BottomSheetView className="flex-1 px-6 pb-8">
        <Text className="font-serif text-2xl font-medium text-stone-900 mb-6">
          New Collection
        </Text>

        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-stone-700 mb-2 ml-1">
              Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Paris 2025 Trip"
              placeholderTextColor="#a8a29e"
              className="bg-white border border-stone-200 rounded-2xl px-5 py-4 text-stone-900 text-base"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-stone-700 mb-2 ml-1">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              placeholderTextColor="#a8a29e"
              multiline
              className="bg-white border border-stone-200 rounded-2xl px-5 py-4 text-stone-900 text-base"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={!name.trim() || createCollection.isPending}
            className={`py-4 rounded-2xl items-center justify-center mt-2 ${
              name.trim() ? 'bg-stone-900 active:bg-stone-800' : 'bg-stone-300'
            }`}
            style={{
              shadowColor: '#1c1917',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: name.trim() ? 0.2 : 0,
              shadowRadius: 12,
              elevation: name.trim() ? 4 : 0,
            }}
          >
            {createCollection.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className={`font-medium text-lg ${
                  name.trim() ? 'text-white' : 'text-stone-500'
                }`}
              >
                Create Collection
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

// ─── Main Screen ─────────────────────────────────────────
export function CollectionsScreen({
  fromProfile = false,
}: {
  fromProfile?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: collections, isLoading, refetch } = useCollections();
  const sheetRef = useRef<BottomSheetModal>(null);

  if (isLoading) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-16 pb-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <View className="flex-row items-center gap-3">
              {fromProfile && (
                <Pressable
                  onPress={() => router.back()}
                  className="p-2 -ml-2 rounded-full active:bg-stone-200/50"
                  hitSlop={8}
                >
                  <ChevronLeft size={24} color="#1c1917" />
                </Pressable>
              )}
              <Text className="font-serif text-3xl font-medium text-stone-900">
                Collections
              </Text>
            </View>
            <Pressable
              onPress={() => sheetRef.current?.present()}
              className="p-2.5 bg-stone-900 rounded-full active:bg-stone-800"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Plus size={24} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Collection Cards */}
          <View className="gap-6">
            {collections?.map((collection, index) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                index={index}
                onPress={() => router.push(`/collections/${collection.id}`)}
              />
            ))}
          </View>

          {/* Empty / Create New CTA */}
          <Motion.View
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'timing',
              duration: 500,
              delay: (collections?.length ?? 0) * 100,
            }}
          >
            <Pressable
              onPress={() => sheetRef.current?.present()}
              className="mt-6 border-2 border-dashed border-stone-200 rounded-3xl p-6 items-center justify-center gap-3 active:bg-stone-100/50"
            >
              <View className="p-3 bg-stone-100 rounded-full">
                <Plus size={24} color="#57534e" />
              </View>
              <Text className="font-medium text-[15px] text-stone-500">
                Create New Collection
              </Text>
            </Pressable>
          </Motion.View>
        </View>
      </ScrollView>

      <CreateCollectionSheet ref={sheetRef} onCreated={() => refetch()} />
    </SafeAreaView>
  );
}
