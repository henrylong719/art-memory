/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion, AnimatePresence } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { Camera, ChevronLeft, Lock } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Input, ScrollView, Text, View } from '@/components/ui';
import { useMe, useUpdateMe } from '@/lib/hooks';
import { useEffect, useState } from 'react';
import Toast from '../../components/ui/toast';
import { useToast } from '@/lib/hooks';
import { getErrorMessage } from '@/lib/utils';

export function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const updateMe = useUpdateMe();
  const { toast, showToast } = useToast();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Track initial values to detect dirty state
  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
  });

  // Save flow states
  const [isSaving, setIsSaving] = useState(false);
  // Hydrate from API
  useEffect(() => {
    if (me) {
      const fn = me.firstName ?? '';
      const ln = me.lastName ?? '';
      setFirstName(fn);
      setLastName(ln);
      setInitialValues({ firstName: fn, lastName: ln });
    }
  }, [me]);

  const isDirty =
    firstName !== initialValues.firstName ||
    lastName !== initialValues.lastName;

  const avatarUrl = me?.avatarUrl;
  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    '?';

  const handleSave = () => {
    if (!isDirty || isSaving) return;

    setIsSaving(true);

    updateMe.mutate(
      {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsSaving(false);
          showToast('Profile updated.', 'success');
          // Update initial values so form is no longer dirty
          setInitialValues({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          });
        },
        onError: (error) => {
          setIsSaving(false);
          showToast(
            getErrorMessage(error, "We couldn't save your profile."),
            'error',
          );
        },
      },
    );
  };

  // Button style based on state
  const getButtonStyle = () => {
    if (isSaving) return 'bg-stone-800';
    if (isDirty) return 'bg-stone-900 active:bg-stone-800';
    return 'bg-stone-200';
  };

  const getButtonTextColor = () => {
    if (isSaving || isDirty) return 'text-white';
    return 'text-stone-400';
  };

  return (
    <View className="flex-1 bg-stone-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-stone-50 px-6 pb-4 flex-row items-center gap-4 border-b border-stone-200/50 z-10"
      >
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-stone-200/50"
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#1c1917" />
        </Pressable>
        <Text className="font-serif text-2xl font-medium text-stone-900">
          Edit Profile
        </Text>
      </View>

      {/* Success Toast */}
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 80 + insets.bottom,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <Motion.View
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mb-8 mt-2"
        >
          <View className="relative">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-28 h-28 rounded-full"
                contentFit="cover"
                style={{ borderWidth: 4, borderColor: '#fff' }}
              />
            ) : (
              <View
                className="w-28 h-28 rounded-full bg-stone-100 items-center justify-center"
                style={{ borderWidth: 4, borderColor: '#fff' }}
              >
                <Text className="font-serif text-3xl font-medium text-stone-500">
                  {initials}
                </Text>
              </View>
            )}
            <Pressable
              className="absolute bottom-0 right-0 w-9 h-9 bg-stone-900 rounded-full items-center justify-center active:bg-stone-800"
              style={{ borderWidth: 2, borderColor: '#fff' }}
            >
              <Camera size={16} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>
        </Motion.View>

        {/* Form */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          className="w-full gap-5"
        >
          {/* First Name */}
          <Input
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
          />

          {/* Last Name */}
          <Input
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
          />

          {/* Email (read-only) */}
          <Input
            label="Email"
            value={me?.email ?? ''}
            disabled
            editable={false}
            rightIcon={<Lock size={12} color="#a8a29e" />}
          />
        </Motion.View>

        {/* Save Button */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 200 }}
          className="w-full mt-10"
        >
          <Pressable
            onPress={handleSave}
            disabled={!isDirty || isSaving}
            className={`w-full rounded-full py-4 flex-row items-center justify-center gap-2 ${getButtonStyle()}`}
            style={
              isDirty && !isSaving
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : undefined
            }
          >
            {isSaving ? <ActivityIndicator color="#fff" size="small" /> : null}
            <Text className={`font-medium text-[16px] ${getButtonTextColor()}`}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </Pressable>
        </Motion.View>
      </ScrollView>
    </View>
  );
}
