/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useEffect, useRef, useState } from 'react';
import { Motion } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
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
import { uploadApi } from '@/lib/api/services';
import { useCorrectScan, useCreateArtwork } from '@/lib/hooks';

function toFilePayload(uri: string) {
  const name = uri.split('/').pop() ?? 'photo.jpg';
  const ext = name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';
  return { uri, type, name };
}

export function ManualEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { imageUri, scanImageUrl, scanId } = useLocalSearchParams<{
    imageUri?: string;
    scanImageUrl?: string;
    scanId?: string;
  }>();
  const createArtwork = useCreateArtwork();
  const correctScan = useCorrectScan();

  // Capture location silently on mount
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        locationRef.current = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch {
        // Location is optional — fail silently
      }
    })();
  }, []);

  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    year: '',
    medium: '',
  });

  const canSubmit =
    formData.title.trim().length > 0 &&
    formData.artist.trim().length > 0 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      let photoUrl = scanImageUrl;

      if (!photoUrl && imageUri) {
        const { data } = await uploadApi.image(toFilePayload(imageUri));
        photoUrl = data.responseObject.url;
      }

      const artwork = await createArtwork.mutateAsync({
        title: formData.title.trim(),
        artistName: formData.artist.trim(),
        year: formData.year ? Number(formData.year) : undefined,
        medium: formData.medium.trim() || undefined,
        imageUrl: photoUrl || undefined,
        source: 'MANUAL',
        latitude: locationRef.current?.latitude,
        longitude: locationRef.current?.longitude,
      });

      if (scanId) {
        correctScan.mutate({
          id: scanId,
          data: {
            userCorrectedTitle: formData.title.trim(),
            userCorrectedArtist: formData.artist.trim(),
            artworkId: artwork.id,
          },
        });
      }

      setSuccess(true);
      setTimeout(() => {
        // Dismiss the entire scan stack (fallback + manual-entry)
        // so pressing back on the result page goes to the home screen
        router.dismissAll();
        router.push({
          pathname: '/scan/result',
          params: { id: artwork.id },
        });
      }, 1500);
    } catch {
      setSubmitting(false);
    }
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
            Artwork Created
          </Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(300)}>
          <Text
            className="text-stone-500 text-[15px] text-center"
            style={{ lineHeight: 22 }}
          >
            Taking you to the details…
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
            {imageUri ? (
              <Image
                source={imageUri}
                className="w-20 h-20 rounded-xl"
                contentFit="cover"
              />
            ) : (
              <View className="w-20 h-20 rounded-xl bg-charcoal-100 items-center justify-center">
                <Text className="text-charcoal-400 text-xs">No image</Text>
              </View>
            )}
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
              <View className="flex-2">
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
            {submitting ? (
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
