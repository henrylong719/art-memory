/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

import { Image, Text, View } from '@/components/ui';

export type CollectionArtworkOption = {
  id: string;
  title: string;
  artist: string;
  imageUrl: string | null;
  isInCollection: boolean;
  artworkId?: string | null;
  savedArtworkId?: string;
};

const areSetsEqual = (left: Set<string>, right: Set<string>) => {
  if (left.size !== right.size) return false;

  for (const value of left) {
    if (!right.has(value)) return false;
  }

  return true;
};

type AddArtworksModalProps = {
  visible: boolean;
  artworks: CollectionArtworkOption[];
  initialSelectedIds: string[];
  bottomInset: number;
  onSave: (selectedIds: Set<string>) => Promise<void>;
  onClose: () => void;
};

export function AddArtworksModal({
  visible,
  artworks,
  initialSelectedIds,
  bottomInset,
  onSave,
  onClose,
}: AddArtworksModalProps) {
  const initialSelection = useMemo(
    () => new Set(initialSelectedIds),
    [initialSelectedIds],
  );
  const wasVisibleRef = useRef(visible);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setSelectedIds(new Set(initialSelection));
    }

    wasVisibleRef.current = visible;
  }, [initialSelection, visible]);

  const hasChanges = !areSetsEqual(selectedIds, initialSelection);

  const toggleSelection = (selectionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(selectionId)) {
        next.delete(selectionId);
      } else {
        next.add(selectionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      await onSave(new Set(selectedIds));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set(initialSelection));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
      <View
        className="bg-white rounded-t-4xl pt-3"
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
        {/* Handle */}
        <View className="items-center pb-2">
          <View className="w-12 h-1.5 bg-stone-200 rounded-full" />
        </View>

        {/* Header */}
        <View className="flex-row justify-between items-center mb-5 px-6">
          <View>
            <Text className="font-serif text-2xl font-medium text-stone-900">
              Manage Artworks
            </Text>
            {artworks.length > 0 && (
              <Text className="text-stone-400 text-xs mt-1">
                Select the artworks you want to keep in this collection
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleClose}
            className="p-2 bg-stone-100 rounded-full"
            hitSlop={8}
          >
            <X size={20} color="#1c1917" />
          </Pressable>
        </View>

        {artworks.length === 0 ? (
          <View className="py-12 items-center px-6">
            <Text className="text-stone-400 font-medium text-[15px] text-center mb-1">
              No artworks yet
            </Text>
            <Text className="text-stone-400 text-sm text-center leading-5 max-w-56">
              Scan or save artworks and they&apos;ll appear here
            </Text>
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} className="px-6">
              <View className="gap-2 pb-4">
                {artworks.map((artwork) => {
                  const isSelected = selectedIds.has(artwork.id);
                  return (
                    <Pressable
                      key={artwork.id}
                      onPress={() => toggleSelection(artwork.id)}
                      className={`flex-row items-center p-3 rounded-2xl border ${
                        isSelected
                          ? 'bg-stone-50 border-stone-300'
                          : 'border-transparent'
                      }`}
                    >
                      <View className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 mr-3">
                        {artwork.imageUrl ? (
                          <Image
                            source={{ uri: artwork.imageUrl }}
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
                          {artwork.title}
                        </Text>
                        <Text className="text-stone-500 text-xs mt-1">
                          {artwork.artist}
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
                onPress={handleSave}
                disabled={!hasChanges || isSaving}
                className={`py-4 rounded-2xl items-center ${
                  hasChanges
                    ? 'bg-stone-900 active:bg-stone-800'
                    : 'bg-stone-200'
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    className={`font-semibold text-[15px] ${
                      hasChanges ? 'text-white' : 'text-stone-400'
                    }`}
                  >
                    {hasChanges ? 'Save changes' : 'No changes'}
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
