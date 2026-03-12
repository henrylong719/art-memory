/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useState } from 'react';
import { Check, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

import { Image, Text, View } from '@/components/ui';

import type { Scan } from '@/lib/api/types';

type AddArtworksModalProps = {
  visible: boolean;
  availableScans: Scan[];
  bottomInset: number;
  onAdd: (artworkIds: Set<string>) => Promise<void>;
  onClose: () => void;
};

export function AddArtworksModal({
  visible,
  availableScans,
  bottomInset,
  onAdd,
  onClose,
}: AddArtworksModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const toggleSelection = (artworkId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(artworkId)) {
        next.delete(artworkId);
      } else {
        next.add(artworkId);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    try {
      await onAdd(selectedIds);
      setSelectedIds(new Set());
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
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
              Add Artworks
            </Text>
            {availableScans.length > 0 && (
              <Text className="text-stone-400 text-xs mt-1">
                Select artworks from your scan history
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

        {availableScans.length === 0 ? (
          <View className="py-12 items-center px-6">
            <Text className="text-stone-400 font-medium text-[15px] text-center mb-1">
              No artworks to add
            </Text>
            <Text className="text-stone-400 text-sm text-center leading-5 max-w-56">
              Scan new artworks and they'll appear here
            </Text>
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} className="px-6">
              <View className="gap-2 pb-4">
                {availableScans.map((scan) => {
                  const artworkId = scan.artwork?.id;
                  if (!artworkId) return null;
                  const isSelected = selectedIds.has(artworkId);
                  const title =
                    scan.userCorrectedTitle ??
                    scan.artwork?.title ??
                    'Unknown Artwork';
                  const artist =
                    scan.userCorrectedArtist ??
                    scan.artwork?.artist?.name ??
                    'Unknown Artist';
                  const imageUrl = scan.artwork?.imageUrl ?? scan.imageUrl;

                  return (
                    <Pressable
                      key={scan.id}
                      onPress={() => toggleSelection(artworkId)}
                      className={`flex-row items-center p-3 rounded-2xl border ${
                        isSelected
                          ? 'bg-stone-50 border-stone-300'
                          : 'border-transparent'
                      }`}
                    >
                      <View className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 mr-3">
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
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
                          {title}
                        </Text>
                        <Text className="text-stone-500 text-xs mt-1">
                          {artist}
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
                onPress={handleAdd}
                disabled={selectedIds.size === 0 || isSaving}
                className={`py-4 rounded-2xl items-center ${
                  selectedIds.size > 0
                    ? 'bg-stone-900 active:bg-stone-800'
                    : 'bg-stone-200'
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    className={`font-semibold text-[15px] ${
                      selectedIds.size > 0 ? 'text-white' : 'text-stone-400'
                    }`}
                  >
                    {selectedIds.size === 0
                      ? 'Select artworks'
                      : selectedIds.size === 1
                        ? 'Add 1 artwork'
                        : `Add ${selectedIds.size} artworks`}
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
