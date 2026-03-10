/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Motion } from '@legendapp/motion';
import { SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { useLogin } from '@/lib/hooks/use-auth';

export function SignInScreen() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    <SafeAreaView style={{ flex: 1 }} className="bg-stone-50">
      {/* Back button */}
      <View className="px-4 pb-2 mt-16">
        <Pressable
          style={{ backgroundColor: 'transparent' }}
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2 -ml-2"
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
            <Text className="text-[32px] leading-tight font-medium text-stone-900 mb-3">
              Welcome back
            </Text>
            <Text className="text-stone-500 text-[15px] leading-relaxed">
              Sign in to access your saved art.
            </Text>
          </Motion.View>

          {/* Fields */}
          <View className="mb-4">
            <View className="mb-5">
              <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2 pl-1">
                Email
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#e7e5e4',
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  fontSize: 15,
                  color: '#1c1917',
                }}
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
              <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2 pl-1">
                Password
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#e7e5e4',
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  fontSize: 15,
                  color: '#1c1917',
                }}
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
          <View style={{ flex: 1, minHeight: 20 }} />

          {/* CTA */}
          <View className="pb-2">
            <Pressable
              style={{
                backgroundColor: isDisabled ? '#e7e5e4' : '#1c1917',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 20,
              }}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {login.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{
                    color: isDisabled ? '#a8a29e' : '#ffffff',
                    fontSize: 15,
                    fontWeight: '600',
                    letterSpacing: 0.3,
                  }}
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
