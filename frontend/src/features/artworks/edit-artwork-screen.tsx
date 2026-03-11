/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useEffect, useState } from 'react';
import { Motion, AnimatePresence } from '@legendapp/motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Camera, RefreshCw, Sparkles } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, ScrollView, Text, View } from '@/components/ui';
import Toast from '@/components/ui/toast';
import {
  useArtwork,
  useUpdateArtwork,
  useGenerateStory,
  useToast,
} from '@/lib/hooks';

export function EditArtworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: artwork, isLoading } = useArtwork(id);
  const updateArtwork = useUpdateArtwork();
  const generateStory = useGenerateStory();

  // ── Form state ──
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [medium, setMedium] = useState('');
  const [museum, setMuseum] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // ── Initial values for dirty tracking ──
  const [initialValues, setInitialValues] = useState({
    title: '',
    artist: '',
    year: '',
    medium: '',
    museum: '',
    description: '',
    notes: '',
  });

  // ── UI state ──
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const { toast, showToast } = useToast();

  const [aboutState, setAboutState] = useState<
    'available' | 'missing' | 'generating' | 'generated'
  >('missing');

  // ── Hydrate form from API ──
  useEffect(() => {
    if (artwork) {
      const vals = {
        title: artwork.title ?? '',
        artist: artwork.artist?.name ?? '',
        year: artwork.year ? String(artwork.year) : '',
        medium: artwork.medium ?? '',
        museum: artwork.museum?.name ?? '',
        description: artwork.description ?? '',
        notes: '', // personal notes come from SavedArtwork, not Artwork
      };
      setTitle(vals.title);
      setArtist(vals.artist);
      setYear(vals.year);
      setMedium(vals.medium);
      setMuseum(vals.museum);
      setDescription(vals.description);
      setNotes(vals.notes);
      setInitialValues(vals);
      setAboutState(artwork.description ? 'available' : 'missing');
    }
  }, [artwork]);

  // ── Dirty check ──
  const hasChanges =
    title !== initialValues.title ||
    artist !== initialValues.artist ||
    year !== initialValues.year ||
    medium !== initialValues.medium ||
    museum !== initialValues.museum ||
    description !== initialValues.description ||
    notes !== initialValues.notes;

  // ── Handlers ──
  const handleGenerate = () => {
    setAboutState('generating');
    generateStory.mutate(id, {
      onSuccess: (updatedArtwork) => {
        if (updatedArtwork?.description) {
          setDescription(updatedArtwork.description);
        }
        setAboutState('generated');
      },
      onError: () => {
        setAboutState(description ? 'available' : 'missing');
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
    // Validate
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
          showToast('Changes saved', 'success');
          setTimeout(() => {
            router.back();
          }, 800);
        },

        onError: (
          error: Error & { response?: { data?: { message?: string } } },
        ) => {
          const message =
            error.response?.data?.message || 'Failed to change password.';
          showToast(message, 'error');
        },
      },
    );
  };

  // ── Loading ──
  if (isLoading || !artwork) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* ── Header ── */}
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

      {/* ── Content ── */}
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
            {/* ── Image Section ── */}
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

            {/* ── Artwork Details Section ── */}
            <View className="gap-6">
              <Text className="font-serif text-xl font-semibold text-charcoal-900 mb-1">
                Artwork Details
              </Text>

              <View className="gap-5">
                {/* Title (Required) */}
                <View className="gap-2">
                  <Text className="text-[12px] font-semibold tracking-widest uppercase text-charcoal-400 ml-1">
                    Title
                  </Text>
                  <View
                    className={`bg-white rounded-2xl border px-4 py-3.5 ${
                      errors.title
                        ? 'border-red-300 bg-red-50/30'
                        : 'border-neutral-200'
                    }`}
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <TextInput
                      value={title}
                      onChangeText={(text) => {
                        setTitle(text);
                        if (errors.title) setErrors({});
                      }}
                      placeholder="Artwork title"
                      placeholderTextColor="#d6d3d1"
                      className="text-[15px] font-medium text-charcoal-900"
                    />
                  </View>
                  {errors.title && (
                    <View className="flex-row items-center gap-1.5 ml-1 mt-0.5">
                      <AlertCircle
                        size={12}
                        color="#7f1d1d"
                        strokeWidth={2.5}
                      />
                      <Text className="text-[12px] font-medium text-red-900/70">
                        {errors.title}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Artist & Year Row */}
                <View className="flex-row gap-4">
                  <View className="flex-1 gap-2">
                    <Text className="text-[12px] font-semibold tracking-widest uppercase text-charcoal-400 ml-1">
                      Artist
                    </Text>
                    <View
                      className="bg-white rounded-2xl border border-neutral-200 px-4 py-3.5"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.03,
                        shadowRadius: 4,
                        elevation: 1,
                      }}
                    >
                      <TextInput
                        value={artist}
                        onChangeText={setArtist}
                        placeholder="Unknown"
                        placeholderTextColor="#d6d3d1"
                        className="text-[15px] text-charcoal-900"
                      />
                    </View>
                  </View>

                  <View className="w-[100px] gap-2">
                    <Text className="text-[12px] font-semibold tracking-widest uppercase text-charcoal-400 ml-1">
                      Year
                    </Text>
                    <View
                      className="bg-white rounded-2xl border border-neutral-200 px-4 py-3.5"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.03,
                        shadowRadius: 4,
                        elevation: 1,
                      }}
                    >
                      <TextInput
                        value={year}
                        onChangeText={setYear}
                        placeholder="YYYY"
                        placeholderTextColor="#d6d3d1"
                        keyboardType="number-pad"
                        maxLength={4}
                        className="text-[15px] text-charcoal-900"
                      />
                    </View>
                  </View>
                </View>

                {/* Medium */}
                <View className="gap-2">
                  <Text className="text-[12px] font-semibold tracking-widest uppercase text-charcoal-400 ml-1">
                    Medium
                  </Text>
                  <View
                    className="bg-white rounded-2xl border border-neutral-200 px-4 py-3.5"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <TextInput
                      value={medium}
                      onChangeText={setMedium}
                      placeholder="e.g. Oil on canvas"
                      placeholderTextColor="#d6d3d1"
                      className="text-[15px] text-charcoal-900"
                    />
                  </View>
                </View>

                {/* Location / Museum */}
                <View className="gap-2">
                  <Text className="text-[12px] font-semibold tracking-widest uppercase text-charcoal-400 ml-1">
                    Location
                  </Text>
                  <View
                    className="bg-white rounded-2xl border border-neutral-200 px-4 py-3.5"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <TextInput
                      value={museum}
                      onChangeText={setMuseum}
                      placeholder="Museum or Gallery name"
                      placeholderTextColor="#d6d3d1"
                      className="text-[15px] text-charcoal-900"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-neutral-200/60 w-full" />

            {/* ── About Section ── */}
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
                    Use AI to generate a short story and context for this
                    artwork
                  </Text>
                  <Pressable
                    onPress={handleGenerate}
                    className="bg-charcoal-900 px-5 py-2.5 rounded-xl active:bg-charcoal-800"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text className="text-white text-sm font-medium">
                      Generate Story
                    </Text>
                  </Pressable>
                </View>
              )}

              {aboutState === 'generating' && (
                <View className="bg-charcoal-50 border border-neutral-200 rounded-2xl p-6 items-center">
                  <View
                    className="w-12 h-12 bg-white rounded-full items-center justify-center mb-4"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <ActivityIndicator size="small" color="#1c1917" />
                  </View>
                  <View className="w-full gap-3 mb-5 px-4 opacity-50">
                    <View className="h-2.5 bg-neutral-200 rounded-full w-full" />
                    <View className="h-2.5 bg-neutral-200 rounded-full w-[85%] self-center" />
                    <View className="h-2.5 bg-neutral-200 rounded-full w-[60%] self-center" />
                  </View>
                  <View className="bg-neutral-200 px-5 py-2.5 rounded-xl">
                    <Text className="text-sm font-medium text-charcoal-400">
                      Generating...
                    </Text>
                  </View>
                </View>
              )}

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
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Artwork context or story..."
                    placeholderTextColor="#d6d3d1"
                    multiline
                    textAlignVertical="top"
                    className="min-h-[160px] text-[15px] leading-6 text-charcoal-900 p-4"
                  />
                  <View className="bg-charcoal-50 border-t border-neutral-100 px-4 py-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Sparkles size={12} color="#a8a29e" />
                      <Text className="text-[11px] font-semibold tracking-wider uppercase text-charcoal-400">
                        {aboutState === 'generated'
                          ? 'AI Generated'
                          : 'Story Text'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleGenerate}
                      className="flex-row items-center gap-1.5 active:opacity-60"
                    >
                      <RefreshCw size={12} color="#78716c" />
                      <Text className="text-[12px] font-medium text-charcoal-400">
                        Regenerate
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Divider */}
            <View className="h-px bg-neutral-200/60 w-full" />

            {/* ── Personal Memory Section ── */}
            <View className="gap-4">
              <View className="gap-1">
                <Text className="font-serif text-xl font-semibold text-charcoal-900">
                  Personal Memory
                </Text>
                <Text className="text-[14px] text-charcoal-400">
                  Your private notes or thoughts about this piece.
                </Text>
              </View>

              <View
                className="bg-white rounded-2xl border border-neutral-200 px-4 py-3.5 min-h-[140px]"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add your memories..."
                  placeholderTextColor="#d6d3d1"
                  multiline
                  textAlignVertical="top"
                  className="min-h-[120px] text-[15px] leading-6 text-charcoal-900 pt-1"
                />
              </View>
            </View>
          </Motion.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Unsaved Changes Modal ── */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowUnsavedModal(false)}
      >
        <Pressable
          onPress={() => setShowUnsavedModal(false)}
          className="flex-1 bg-charcoal-900/40 items-center justify-center px-6"
        >
          <Pressable
            onPress={() => {}}
            className="w-full max-w-[320px] bg-white rounded-4xl p-7 items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <View className="w-12 h-12 bg-charcoal-50 rounded-full items-center justify-center mb-4">
              <AlertCircle size={24} color="#a8a29e" strokeWidth={2} />
            </View>

            <Text className="font-serif text-2xl font-medium text-charcoal-900 text-center mb-3">
              Discard changes?
            </Text>
            <Text className="text-[15px] text-charcoal-400 text-center leading-6 mb-8">
              You have unsaved changes. Are you sure you want to leave without
              saving?
            </Text>

            <View className="w-full gap-3">
              <Pressable
                onPress={() => {
                  setShowUnsavedModal(false);
                  router.back();
                }}
                className="w-full py-4 bg-red-50 rounded-2xl items-center active:bg-red-100"
              >
                <Text className="text-red-600 font-semibold text-[15px]">
                  Discard Changes
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowUnsavedModal(false)}
                className="w-full py-4 bg-charcoal-50 rounded-2xl items-center active:bg-charcoal-100"
              >
                <Text className="text-charcoal-700 font-semibold text-[15px]">
                  Keep Editing
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
