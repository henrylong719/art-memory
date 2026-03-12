/* eslint-disable better-tailwindcss/no-unknown-classes */
import { forwardRef, useMemo, type RefObject } from 'react';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Bookmark, Plus, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';

import { Image, Text, View } from '@/components/ui';
import { renderBackdrop } from '@/components/ui/modal';
import { useCollections } from '@/lib/hooks';

export const CollectionSheet = forwardRef<
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
