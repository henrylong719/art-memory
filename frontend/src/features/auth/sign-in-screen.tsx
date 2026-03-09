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
          className="p-2 -ml-2 rounded-full hover:bg-stone-200/50 transition-colors text-stone-900"
          style={{ backgroundColor: 'transparent' }}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#1E1E1E" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1 px-8 pt-8 pb-8 flex flex-col"
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="mb-10"
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
            <Text className="font-serif text-[32px] leading-tight font-medium text-stone-900 mb-3">
              Welcome back
            </Text>
            <Text className="text-stone-500 text-[15px] leading-relaxed">
              Sign in to access your saved art.
            </Text>
          </Motion.View>

          {/* Fields */}
          <View className="flex flex-col flex-1">
            <View className="space-y-5 mb-6">
              <View>
                <Text className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                  Email
                </Text>
                <TextInput
                  className="w-full bg-white border border-stone-200 rounded-2xl py-3.75 px-4 text-[15px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all placeholder:text-stone-400"
                  placeholder="name@example.com"
                  placeholderTextColor="#B0B0B0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View>
              <Text className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                Password
              </Text>
              <TextInput
                className="w-full bg-white border border-stone-200 rounded-2xl py-3.75 px-4 text-[15px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all placeholder:text-stone-400"
                placeholder="••••••••"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          {/* Forgot password */}
          <View className="items-end mb-8">
            <Pressable hitSlop={8}>
              <Text className="text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors">
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
          <View className="flex-1 min-h-5" />

          {/* CTA */}
          <View className="space-y-6 pb-2">
            <Pressable
              className={`rounded-2xl py-4.25 items-center ${
                isDisabled
                  ? 'bg-stone-200 shadow-none'
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
                    isDisabled ? 'text-stone-300' : 'text-white'
                  }`}
                >
                  Sign In
                </Text>
              )}
            </Pressable>

            <View className="pt-1">
              <Text className="text-center text-[14px] text-stone-500 leading-relaxed">
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
