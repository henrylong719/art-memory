/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Motion } from '@legendapp/motion';
import { ScrollView, Text, View } from '@/components/ui';
import { useLogin } from '@/lib/hooks/use-auth';

export function SignInScreen() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [focused, setFocused] = React.useState<'email' | 'password' | null>(
    null,
  );

  const axiosError = login.error as AxiosError<{ message: string }> | null;
  const errorMessage =
    axiosError?.response?.data?.message ?? axiosError?.message ?? null;

  const handleSubmit = () => {
    if (!email.trim() || !password) return;
    login.mutate(
      { email: email.trim().toLowerCase(), password },
      { onSuccess: () => router.replace('/(app)') },
    );
  };

  const isDisabled = !email.trim() || !password || login.isPending;

  return (
    <SafeAreaView className="flex flex-col h-full bg-stone-50">
      {/* Fixed back button header */}
      <View className="px-4 pt-12 pb-4">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full active:bg-stone-900/6"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#1c1917" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-8 pt-8 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 300 }}
            className="mb-10"
          >
            <Text className="font-serif text-[32px] font-medium leading-[38px] text-stone-900 mb-3">
              Welcome back
            </Text>
            <Text className="text-[15px] leading-[22px] text-stone-500">
              Sign in to access your saved art.
            </Text>
          </Motion.View>

          {/* Fields */}
          <View className="gap-5 mb-6">
            <View>
              <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                EMAIL
              </Text>
              <TextInput
                className={`bg-white border rounded-2xl py-[15px] px-4 text-[15px] text-stone-900 ${
                  focused === 'email' ? 'border-stone-400' : 'border-stone-200'
                }`}
                placeholder="name@example.com"
                placeholderTextColor="#a8a29e"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View>
              <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                PASSWORD
              </Text>
              <TextInput
                className={`bg-white border rounded-2xl py-[15px] px-4 text-[15px] text-stone-900 ${
                  focused === 'password'
                    ? 'border-stone-400'
                    : 'border-stone-200'
                }`}
                placeholder="••••••••"
                placeholderTextColor="#a8a29e"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          {/* Forgot password */}
          <View className="items-end mb-8">
            <Pressable hitSlop={8}>
              <Text className="text-[13px] font-medium text-stone-500">
                Forgot password?
              </Text>
            </Pressable>
          </View>

          {/* Error */}
          {errorMessage ? (
            <View className="bg-red-50 rounded-xl p-3.5 mb-4 border border-red-200">
              <Text className="text-red-600 text-[13px] leading-5">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Spacer */}
          <View className="flex-1 min-h-[20px]" />

          {/* CTA */}
          <View className="gap-6 pb-2">
            <Pressable
              className={`rounded-full py-[15px] items-center shadow-lg ${
                isDisabled
                  ? 'bg-stone-300 shadow-none'
                  : 'bg-stone-900 active:bg-stone-800'
              }`}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {login.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  className={`text-[15px] font-semibold tracking-wide ${
                    isDisabled ? 'text-stone-400' : 'text-white'
                  }`}
                >
                  Sign In
                </Text>
              )}
            </Pressable>

            <View className="pt-1">
              <Text className="text-center text-sm text-stone-500 leading-[22px]">
                Don't have an account?{' '}
                <Text
                  className="font-semibold text-stone-900 hover:text-stone-600 transition-colors"
                  onPress={() => router.push('/sign-up')}
                >
                  Sign up
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
