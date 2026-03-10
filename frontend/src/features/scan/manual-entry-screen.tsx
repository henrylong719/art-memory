/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useState } from 'react';
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, ScrollView, Text, View } from '@/components/ui';
import { useSaveArtwork } from '@/lib/hooks';

export function ManualEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saveArtwork = useSaveArtwork();

  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    year: '',
    medium: '',
  });

  const canSubmit =
    formData.title.trim().length > 0 &&
    formData.artist.trim().length > 0 &&
    !saveArtwork.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    saveArtwork.mutate(
      {
        customTitle: formData.title.trim(),
        customArtist: formData.artist.trim(),
        customYear: formData.year ? Number(formData.year) : undefined,
        customMedium: formData.medium.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => router.replace('/(app)/collections'), 1500);
        },
      },
    );
  };

  // ── Success state ──
  if (success) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center p-6">
        <Animated.View
          entering={ZoomIn.springify().stiffness(200).damping(20)}
          className="w-20 h-20 bg-stone-900 rounded-full items-center justify-center mb-8"
          style={{
            shadowColor: '#1c1917',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
          }}
        >
          <Check size={36} color="#fff" strokeWidth={2} />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(200)}>
          <Text className="font-serif text-[32px] font-medium text-stone-900 text-center mb-3">
            Artwork Saved
          </Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(300)}>
          <Text className="text-stone-500 text-[15px] text-center" style={{ lineHeight: 22 }}>
            Added to your collection
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Top bar */}
      <View
        className="flex-row justify-between items-center px-5 bg-white/80 border-b border-neutral-200"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 bg-charcoal-50 rounded-full items-center justify-center"
          hitSlop={8}
        >
          <X size={22} color="#1E1E1E" />
        </Pressable>
        <Text className="font-serif text-xl font-semibold text-charcoal-900">
          Enter Details
        </Text>
        <View className="w-11" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-36"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image preview card */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 350 }}
            className="flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-200 mb-8"
          >
            <Image
              source="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=400&auto=format&fit=crop"
              className="w-20 h-20 rounded-xl"
              contentFit="cover"
            />
            <View>
              <Text className="text-sm font-semibold text-charcoal-900">
                Custom Entry
              </Text>
              <Text className="text-xs text-charcoal-400 mt-1">
                From your recent scan
              </Text>
            </View>
          </Motion.View>

          {/* Form fields */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 350, delay: 80 }}
            className="gap-5"
          >
            <FormField
              label="Artwork Title"
              required
              placeholder="e.g. Starry Night"
              value={formData.title}
              onChangeText={(v) =>
                setFormData((prev) => ({ ...prev, title: v }))
              }
              autoFocus
            />

            <FormField
              label="Artist"
              required
              placeholder="e.g. Vincent van Gogh"
              value={formData.artist}
              onChangeText={(v) =>
                setFormData((prev) => ({ ...prev, artist: v }))
              }
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <FormField
                  label="Year"
                  placeholder="e.g. 1889"
                  value={formData.year}
                  onChangeText={(v) =>
                    setFormData((prev) => ({ ...prev, year: v }))
                  }
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-[2]">
                <FormField
                  label="Medium"
                  placeholder="e.g. Oil on canvas"
                  value={formData.medium}
                  onChangeText={(v) =>
                    setFormData((prev) => ({ ...prev, medium: v }))
                  }
                />
              </View>
            </View>
          </Motion.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="bg-neutral-50 pt-3">
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
              canSubmit
                ? 'bg-charcoal-900 active:bg-charcoal-800'
                : 'bg-charcoal-200'
            }`}
            style={
              canSubmit
                ? {
                    shadowColor: '#1E1E1E',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 16,
                    elevation: 8,
                  }
                : undefined
            }
          >
            {saveArtwork.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                className={`font-semibold text-lg ${
                  canSubmit ? 'text-white' : 'text-charcoal-400'
                }`}
              >
                Save Artwork
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Form Field ──────────────────────────────────────────
function FormField({
  label,
  required,
  placeholder,
  value,
  onChangeText,
  autoFocus,
  keyboardType,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text className="text-sm font-semibold text-charcoal-600 mb-2 ml-1">
        {label}
        {required && <Text className="text-danger-500"> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A3A3A3"
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`bg-white border rounded-2xl px-5 py-4 text-lg text-charcoal-900 ${
          focused ? 'border-charcoal-400' : 'border-neutral-200'
        }`}
      />
    </View>
  );
}
