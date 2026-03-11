/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion, AnimatePresence } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/ui';
import { useChangePassword, useToast } from '@/lib/hooks';
import Toast from '../../components/ui/toast';

export function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const changePassword = useChangePassword();

  const { toast, showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const handleSubmit = () => {
    if (!isValid || changePassword.isPending) return;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New passwords do not match.');
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          showToast('Your password has been changed.', 'success');

          setTimeout(() => {
            router.back();
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
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

  return (
    <View className="flex-1 bg-stone-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-stone-50 px-6 pb-4 flex-row items-center gap-4 border-b border-stone-200/50"
      >
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-stone-200/50"
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#1c1917" />
        </Pressable>
        <Text className="font-serif text-2xl font-medium text-stone-900">
          Change Password
        </Text>
      </View>

      {/* Success Toast */}
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 80 + insets.bottom,
        }}
      >
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450 }}
          className="gap-5"
        >
          {/* Current Password */}
          <View>
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-2 px-1">
              Current Password
            </Text>
            <View
              className="bg-white rounded-2xl border border-stone-100 flex-row items-center px-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                placeholder="Enter current password"
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                autoComplete="current-password"
                className="flex-1 py-4 text-[15px] text-stone-900"
              />
              <Pressable onPress={() => setShowCurrent((s) => !s)} hitSlop={8}>
                {showCurrent ? (
                  <EyeOff size={20} color="#a8a29e" />
                ) : (
                  <Eye size={20} color="#a8a29e" />
                )}
              </Pressable>
            </View>
          </View>

          {/* New Password */}
          <View>
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-2 px-1">
              New Password
            </Text>
            <View
              className="bg-white rounded-2xl border border-stone-100 flex-row items-center px-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholder="At least 8 characters"
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                autoComplete="new-password"
                className="flex-1 py-4 text-[15px] text-stone-900"
              />
              <Pressable onPress={() => setShowNew((s) => !s)} hitSlop={8}>
                {showNew ? (
                  <EyeOff size={20} color="#a8a29e" />
                ) : (
                  <Eye size={20} color="#a8a29e" />
                )}
              </Pressable>
            </View>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <Text className="text-[12px] text-red-500 mt-1.5 px-1">
                Must be at least 8 characters
              </Text>
            )}
          </View>

          {/* Confirm New Password */}
          <View>
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-2 px-1">
              Confirm New Password
            </Text>
            <View
              className="bg-white rounded-2xl border border-stone-100 flex-row items-center px-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="Re-enter new password"
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                autoComplete="new-password"
                className="flex-1 py-4 text-[15px] text-stone-900"
              />
              <Pressable onPress={() => setShowConfirm((s) => !s)} hitSlop={8}>
                {showConfirm ? (
                  <EyeOff size={20} color="#a8a29e" />
                ) : (
                  <Eye size={20} color="#a8a29e" />
                )}
              </Pressable>
            </View>
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <Text className="text-[12px] text-red-500 mt-1.5 px-1">
                Passwords do not match
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid || changePassword.isPending}
            className={`mt-4 py-4 rounded-2xl items-center ${
              isValid && !changePassword.isPending
                ? 'bg-stone-900 active:bg-stone-800'
                : 'bg-stone-300'
            }`}
          >
            {changePassword.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-[15px] tracking-wide">
                Update Password
              </Text>
            )}
          </Pressable>
        </Motion.View>
      </View>
    </View>
  );
}
