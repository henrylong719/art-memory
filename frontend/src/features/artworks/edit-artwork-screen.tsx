/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Motion, AnimatePresence } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, RefreshCw, Sparkles } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Input, ScrollView, Text, View } from '@/components/ui';
import { GeneratingSkeleton } from '@/components/ui/generating-skeleton';
import Toast from '@/components/ui/toast';
import { ConfirmModal } from '@/features/artworks/components/confirm-modal';
import {
  useArtwork,
  useUpdateArtwork,
  useGenerateStory,
  useToast,
} from '@/lib/hooks';
import type { StoryLimitError } from '@/lib/hooks/use-artwork';

// ─── Cooldown hook ───────────────────────────────────────
function useCooldown() {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remaining]);

  const start = useCallback((seconds: number) => setRemaining(seconds), []);

  return { remaining, isActive: remaining > 0, start };
}

// ─── Main Screen ─────────────────────────────────────────
export function EditArtworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: artwork, isLoading } = useArtwork(id);
  const updateArtwork = useUpdateArtwork();
  const generateStory = useGenerateStory();

  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [medium, setMedium] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Initial values for dirty tracking
  const [initialValues, setInitialValues] = useState({
    title: '',
    artist: '',
    year: '',
    medium: '',
    description: '',
    notes: '',
  });

  // UI state
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const { toast, showToast } = useToast();

  const [aboutState, setAboutState] = useState<
    'available' | 'missing' | 'generating' | 'generated'
  >('missing');

  // Cooldown & limit state
  const cooldown = useCooldown();
  const [limitInfo, setLimitInfo] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);

  const isAtLimit = limitInfo !== null && limitInfo.remaining <= 0;
  const isLowConfidence =
    artwork != null &&
    !artwork.verified &&
    (artwork.source === 'MANUAL' ||
      (artwork.scanConfidence != null && artwork.scanConfidence < 0.5));
  const generateDisabled =
    generateStory.isPending || cooldown.isActive || isAtLimit || isLowConfidence;

  // Hydrate form from API (only on initial load)
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (artwork && !hasHydrated.current) {
      hasHydrated.current = true;
      const vals = {
        title: artwork.title ?? '',
        artist: artwork.artist?.name ?? '',
        year: artwork.year ? String(artwork.year) : '',
        medium: artwork.medium ?? '',
        description: artwork.description ?? '',
        notes: '',
      };
      setTitle(vals.title);
      setArtist(vals.artist);
      setYear(vals.year);
      setMedium(vals.medium);
      setDescription(vals.description);
      setNotes(vals.notes);
      setInitialValues(vals);
      setAboutState(artwork.description ? 'available' : 'missing');
    }
  }, [artwork]);

  // Track whether the description was changed by AI generation
  const [descriptionDirtyFromAI, setDescriptionDirtyFromAI] = useState(false);

  const hasChanges =
    descriptionDirtyFromAI ||
    title !== initialValues.title ||
    artist !== initialValues.artist ||
    year !== initialValues.year ||
    medium !== initialValues.medium ||
    description !== initialValues.description ||
    notes !== initialValues.notes;

  // ── Handlers ──
  const handleGenerate = () => {
    if (generateDisabled) return;

    setAboutState('generating');
    generateStory.mutate(id, {
      onSuccess: (result) => {
        if (result?.description) {
          setDescription(result.description);
          setDescriptionDirtyFromAI(true);
        }
        setAboutState('generated');

        const meta = (result as any)?._storyMeta;
        if (meta) {
          setLimitInfo({
            used: meta.used,
            limit: meta.limit,
            remaining: meta.remaining,
          });
          cooldown.start(meta.cooldownSeconds);
        } else {
          cooldown.start(60);
        }
      },
      onError: (error: any) => {
        setAboutState(description ? 'available' : 'missing');

        const limitError = error as StoryLimitError;
        if (limitError?.type === 'cooldown') {
          cooldown.start(limitError.cooldownRemaining ?? 60);
          showToast(limitError.message, 'error');
        } else if (limitError?.type === 'daily_limit') {
          setLimitInfo({
            used: limitError.used ?? 0,
            limit: limitError.limit ?? 0,
            remaining: 0,
          });
          showToast(limitError.message, 'error');
        } else {
          showToast('Failed to generate story.', 'error');
        }
      },
    });
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowUnsavedModal(true);
    } else {
      router.back();
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }
    setErrors({});

    const yearNum = year.trim() ? parseInt(year.trim(), 10) : null;

    updateArtwork.mutate(
      {
        id,
        title: title.trim(),
        year: yearNum && !isNaN(yearNum) ? yearNum : null,
        medium: medium.trim() || null,
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          setDescriptionDirtyFromAI(false);
          showToast('Changes saved', 'success');
          setTimeout(() => router.back(), 800);
        },
        onError: (
          error: Error & { response?: { data?: { message?: string } } },
        ) => {
          const message =
            error.response?.data?.message || 'Failed to save changes.';
          showToast(message, 'error');
        },
      },
    );
  };

  const getGenerateLabel = () => {
    if (isLowConfidence) return 'Not available';
    if (cooldown.isActive) return `Wait ${cooldown.remaining}s`;
    if (isAtLimit) return 'Daily limit reached';
    return 'Generate Story';
  };

  const getRegenerateLabel = () => {
    if (isLowConfidence) return 'Not available';
    if (cooldown.isActive) return `${cooldown.remaining}s`;
    if (isAtLimit) return 'Limit reached';
    return 'Regenerate';
  };

  if (isLoading || !artwork) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-neutral-50/95 px-6 pb-4 flex-row items-center justify-between border-b border-neutral-200/50 z-40"
      >
        <Pressable onPress={handleCancel} className="py-2" hitSlop={8}>
          <Text className="text-[15px] font-medium text-charcoal-400">
            Cancel
          </Text>
        </Pressable>

        <Text className="font-serif text-lg font-semibold text-charcoal-900">
          Edit Details
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || updateArtwork.isPending}
          className="py-2"
          hitSlop={8}
        >
          {updateArtwork.isPending ? (
            <ActivityIndicator size="small" color="#1c1917" />
          ) : (
            <Text
              className={`text-[15px] font-semibold ${
                hasChanges ? 'text-charcoal-900' : 'text-charcoal-200'
              }`}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 120 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            className="gap-10"
          >
            {/* Image Section */}
            <View className="items-center gap-4 mb-2">
              <View
                className="w-32 h-32 rounded-2xl overflow-hidden bg-neutral-200"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                {artwork.imageUrl ? (
                  <View className="relative w-full h-full">
                    <Image
                      source={artwork.imageUrl}
                      className="w-full h-full"
                      contentFit="cover"
                      transition={200}
                    />
                    <View className="absolute inset-0 bg-black/20 items-center justify-center">
                      <View className="w-10 h-10 bg-white/30 rounded-full items-center justify-center">
                        <Camera size={20} color="#fff" />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Camera size={24} color="#a8a29e" />
                  </View>
                )}
              </View>
              <Pressable className="active:opacity-60">
                <Text className="text-[13px] font-medium text-charcoal-400">
                  Replace Photo
                </Text>
              </Pressable>
            </View>

            {/* Artwork Details Section */}
            <View className="gap-6">
              <Text className="font-serif text-xl font-semibold text-charcoal-900 mb-1">
                Artwork Details
              </Text>

              <View className="gap-5">
                <Input
                  label="Title"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (errors.title) setErrors({});
                  }}
                  placeholder="Artwork title"
                  error={errors.title}
                />

                {/* Artist & Year Row */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Input
                      label="Artist"
                      value={artist}
                      onChangeText={setArtist}
                      placeholder="Unknown"
                    />
                  </View>
                  <View className="w-[100px]">
                    <Input
                      label="Year"
                      value={year}
                      onChangeText={setYear}
                      placeholder="YYYY"
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                </View>

                <Input
                  label="Medium"
                  value={medium}
                  onChangeText={setMedium}
                  placeholder="e.g. Oil on canvas"
                />
              </View>
            </View>

            {/* Divider */}
            {/* <View className="h-px bg-neutral-200/60 w-full" /> */}

            {/* About Section */}
            <View className="gap-4">
              <Text className="font-serif text-xl font-semibold text-charcoal-900">
                About
              </Text>

              {aboutState === 'missing' && (
                <View className="bg-charcoal-50 border border-neutral-200 rounded-2xl p-6 items-center">
                  <View
                    className="w-12 h-12 bg-white rounded-full items-center justify-center mb-3"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <Sparkles size={20} color="#a8a29e" />
                  </View>
                  <Text className="text-charcoal-900 font-medium mb-1">
                    No story available yet
                  </Text>
                  <Text className="text-charcoal-400 text-sm text-center mb-5 max-w-[200px] leading-5">
                    {isLowConfidence
                      ? 'AI generation is not available for unidentified artworks. You can type your own description below.'
                      : 'Use AI to generate a short story and context for this artwork'}
                  </Text>

                  {isLowConfidence ? (
                    <Pressable
                      onPress={() => setAboutState('available')}
                      className="px-5 py-2.5 rounded-xl bg-charcoal-900 active:bg-charcoal-800"
                    >
                      <Text className="text-sm font-medium text-white">
                        Write Manually
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        onPress={handleGenerate}
                        disabled={generateDisabled}
                        className={`px-5 py-2.5 rounded-xl ${
                          generateDisabled
                            ? 'bg-charcoal-200'
                            : 'bg-charcoal-900 active:bg-charcoal-800'
                        }`}
                        style={
                          !generateDisabled
                            ? {
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 1,
                              }
                            : undefined
                        }
                      >
                        <Text
                          className={`text-sm font-medium ${
                            generateDisabled ? 'text-charcoal-400' : 'text-white'
                          }`}
                        >
                          {getGenerateLabel()}
                        </Text>
                      </Pressable>

                      {limitInfo && !isAtLimit && (
                        <Text className="text-charcoal-300 text-[11px] mt-2.5">
                          {limitInfo.remaining} of {limitInfo.limit} generations
                          left today
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}

              {aboutState === 'generating' && <GeneratingSkeleton />}

              {(aboutState === 'available' || aboutState === 'generated') && (
                <View
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <RNTextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Artwork context or story..."
                    placeholderTextColor="#d6d3d1"
                    multiline
                    textAlignVertical="top"
                    className="min-h-[300px] text-[15px] leading-6 text-charcoal-900 p-4"
                  />
                  <View className="bg-charcoal-50 border-t border-neutral-100 px-4 py-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Sparkles size={12} color="#a8a29e" />
                      <Text className="text-[11px] font-semibold tracking-wider uppercase text-charcoal-400">
                        {aboutState === 'generated'
                          ? 'AI Generated'
                          : 'Story Text'}
                        {limitInfo
                          ? ` · ${limitInfo.remaining}/${limitInfo.limit} left`
                          : ''}
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleGenerate}
                      disabled={generateDisabled}
                      className={`flex-row items-center gap-1.5 ${
                        generateDisabled ? 'opacity-40' : 'active:opacity-60'
                      }`}
                    >
                      <RefreshCw size={12} color="#78716c" />
                      <Text className="text-[12px] font-medium text-charcoal-400">
                        {getRegenerateLabel()}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Divider */}
            {/* <View className="h-px bg-neutral-200/60 w-full" /> */}

            {/* Personal Memory Section */}
            <View className="gap-4">
              <View className="gap-1">
                <Text className="font-serif text-xl font-semibold text-charcoal-900">
                  Personal Memory
                </Text>
                <Text className="text-[14px] text-charcoal-400">
                  Your private notes or thoughts about this piece.
                </Text>
              </View>

              <Input
                label=""
                value={notes}
                onChangeText={setNotes}
                placeholder="Add your memories..."
                multiline
                style={{ minHeight: 140 }}
              />
            </View>
          </Motion.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Unsaved Changes Modal */}
      <ConfirmModal
        visible={showUnsavedModal}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to leave without saving?"
        confirmLabel="Discard Changes"
        onConfirm={() => {
          setShowUnsavedModal(false);
          router.back();
        }}
        onCancel={() => setShowUnsavedModal(false)}
      />
    </View>
  );
}
