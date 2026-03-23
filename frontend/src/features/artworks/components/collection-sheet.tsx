/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useMemo, useState } from 'react';
import { Bookmark, Check, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

import { Image, Text, View } from '@/components/ui';
import { useCollections } from '@/lib/hooks';

type CollectionSheetProps = {
  bottomInset: number;
  isPending: boolean;
  selectedCollectionIds?: string[];
  onSave: (collectionIds: Set<string>) => Promise<void>;
  onClose: () => void;
};

function areSetsEqual(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) return false;

  for (const value of left) {
    if (!right.has(value)) return false;
  }

  return true;
}

export function CollectionSheet({
  bottomInset,
  isPending,
  selectedCollectionIds = [],
  onSave,
  onClose,
}: CollectionSheetProps) {
  const { data: collections, isLoading } = useCollections();
  const [draftSelection, setDraftSelection] = useState<Set<string>>(
    () => new Set(selectedCollectionIds),
  );

  const initialSelection = useMemo(
    () => new Set(selectedCollectionIds),
    [selectedCollectionIds],
  );

  const hasChanges = !areSetsEqual(draftSelection, initialSelection);

  const toggleSelection = (collectionId: string) => {
    setDraftSelection((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleClose = () => {
    if (isPending) return;
    setDraftSelection(new Set(selectedCollectionIds));
    onClose();
  };

  const handleSave = async () => {
    if (!hasChanges || isPending) return;
    await onSave(new Set(draftSelection));
  };

  const getSubmitLabel = () => {
    if (!hasChanges) return 'No changes';
    if (draftSelection.size === 0) return 'Remove from collections';
    if (draftSelection.size === 1) return 'Save to 1 collection';
    return `Save to ${draftSelection.size} collections`;
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
      <View
        className="rounded-t-4xl bg-white pt-3"
        style={{
          maxHeight: '70%',
          paddingBottom: bottomInset + 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <View className="items-center pb-2">
          <View className="h-1.5 w-12 rounded-full bg-stone-200" />
        </View>

        <View className="mb-5 flex-row items-center justify-between px-6">
          <View>
            <Text className="font-serif text-2xl font-medium text-stone-900">
              Save to Collections
            </Text>
            {!!collections?.length && (
              <Text className="mt-1 text-xs text-stone-400">
                Choose which collections should contain this artwork
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleClose}
            className="rounded-full bg-stone-100 p-2"
            hitSlop={8}
          >
            <X size={20} color="#1c1917" />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#1c1917" className="mt-4" />
        ) : !collections?.length ? (
          <View className="items-center px-6 py-12">
            <Text className="mb-1 text-center text-[15px] font-medium text-stone-400">
              No collections yet
            </Text>
            <Text className="max-w-56 text-center text-sm leading-5 text-stone-400">
              Create a collection first, then you can save this artwork there
            </Text>
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} className="px-6">
              <View className="gap-2 pb-4">
                {collections.map((collection) => {
                  const coverImage =
                    collection.coverUrl ??
                    collection.savedArtworks?.[0]?.artwork?.imageUrl ??
                    null;
                  const isSelected = draftSelection.has(collection.id);

                  return (
                    <Pressable
                      key={collection.id}
                      onPress={() => toggleSelection(collection.id)}
                      disabled={isPending}
                      className={`flex-row items-center rounded-2xl border p-3 ${
                        isSelected
                          ? 'border-stone-300 bg-stone-50'
                          : 'border-transparent'
                      }`}
                    >
                      <View className="mr-3 h-14 w-14 overflow-hidden rounded-xl bg-stone-100">
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
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full ${
                          isSelected
                            ? 'bg-stone-900'
                            : 'border border-stone-300'
                        }`}
                      >
                        {isSelected ? (
                          <Check size={14} color="#fff" strokeWidth={3} />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View className="border-t border-stone-100 px-6 pt-3">
              <Pressable
                onPress={handleSave}
                disabled={!hasChanges || isPending}
                className={`items-center rounded-2xl py-4 ${
                  hasChanges
                    ? 'bg-stone-900 active:bg-stone-800'
                    : 'bg-stone-200'
                }`}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    className={`text-[15px] font-semibold ${
                      hasChanges ? 'text-white' : 'text-stone-400'
                    }`}
                  >
                    {getSubmitLabel()}
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
