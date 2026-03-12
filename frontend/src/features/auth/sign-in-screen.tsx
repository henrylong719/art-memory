/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { AnimatePresence, Motion } from '@legendapp/motion';
import { SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import Toast from '@/components/ui/toast';
import { SocialLoginButtons } from '@/features/auth/components/social-login-buttons';
import { useLogin } from '@/lib/hooks/use-auth';
import { useToast } from '@/lib/hooks';
import { getErrorMessage } from '@/lib/utils';

export function SignInScreen() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { toast, showToast } = useToast();

  const handleSubmit = () => {
    if (!email.trim() || !password || login.isPending) return;

    login.mutate(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: () => {
          router.replace('/(app)');
        },
        onError: (error) => {
          showToast(getErrorMessage(error, 'Failed to sign in.'), 'error');
        },
      },
    );
  };

  const isDisabled = !email.trim() || !password || login.isPending;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>

      {/* Back button */}
      <View className="px-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2 -ml-2 bg-transparent active:bg-stone-100 rounded-full"
        >
          <ChevronLeft size={24} color="#1E1E1E" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            className="mb-8"
          >
            <Text className="font-serif text-[32px] leading-tight font-medium text-stone-900 mb-3">
              Welcome back
            </Text>
            <Text className="text-stone-500 text-[15px] leading-relaxed">
              Sign in to access your saved art.
            </Text>
          </Motion.View>

          {/* Fields */}
          <View className="mb-4">
            <View className="mb-5">
              <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                Email
              </Text>
              <TextInput
                className="bg-white border border-stone-200 rounded-2xl py-3.5 px-4 text-[15px] text-stone-900"
                placeholder="name@example.com"
                placeholderTextColor="#a8a29e"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View>
              <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                Password
              </Text>
              <TextInput
                className="bg-white border border-stone-200 rounded-2xl py-3.5 px-4 text-[15px] text-stone-900"
                placeholder="••••••••"
                placeholderTextColor="#a8a29e"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          {/* Forgot password */}
          <View className="items-end mb-6">
            <Pressable hitSlop={8}>
              <Text className="text-[13px] font-medium text-stone-500">
                Forgot password?
              </Text>
            </Pressable>
          </View>

          {/* Social login */}
          <SocialLoginButtons />

          {/* Spacer */}
          <View className="flex-1 min-h-5" />

          {/* CTA */}
          <View className="pb-2">
            <Pressable
              className={`rounded-2xl py-4 items-center mb-5 ${isDisabled ? 'bg-stone-200' : 'bg-stone-900 active:bg-stone-800'}`}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {login.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  className={`text-[15px] font-semibold tracking-wide ${isDisabled ? 'text-stone-400' : 'text-white'}`}
                >
                  Sign In
                </Text>
              )}
            </Pressable>

            <Text className="text-center text-[14px] text-stone-500 leading-relaxed">
              Don't have an account?{' '}
              <Text
                className="font-semibold text-stone-900"
                onPress={() => router.push('/sign-up')}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
