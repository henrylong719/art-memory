/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useEffect, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AnimatePresence, Motion } from '@legendapp/motion';

import { SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { SocialLoginButtons } from '@/features/auth/components/social-login-buttons';
import { useRegister } from '@/lib/hooks/use-auth';
import Toast from '@/components/ui/toast';
import { useToast } from '@/lib/hooks';

export function SignUpScreen() {
  const router = useRouter();
  const register = useRegister();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { toast, showToast } = useToast();

  const handleSubmit = () => {
    if (!email.trim() || !password || register.isPending) return;

    register.mutate(
      {
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      },
      {
        onSuccess: () => {
          router.replace('/(app)');
        },
        onError: (error) => {
          const axiosError = error as AxiosError<{ message?: string }>;
          const message =
            axiosError.response?.data?.message ||
            axiosError.message ||
            'Failed to create account.';
          showToast(message, 'error');
        },
      },
    );
  };

  const isDisabled = !email.trim() || !password || register.isPending;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-stone-50">
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>

      <View className="px-4 pb-2">
        <Pressable
          className="p-2 -ml-2"
          style={{ backgroundColor: 'transparent' }}
          onPress={() => router.back()}
          hitSlop={8}
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
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 8 }}
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
              Create Account
            </Text>
            <Text className="text-stone-500 text-[15px] leading-relaxed">
              Join to start saving and discovering art.
            </Text>
          </Motion.View>

          {/* Fields */}
          <View className="flex flex-col mb-10">
            <View className="space-y-5 flex-row" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                  First Name
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
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  placeholderTextColor="#B0B0B0"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                  Last Name
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
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>

            <View className="mb-5">
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
              <Text className="text-[11px] text-stone-300 mt-1.5 pl-1">
                Minimum 6 characters
              </Text>
            </View>
          </View>

          {/* Social login */}
          <SocialLoginButtons />

          {/* CTA */}
          <View className="space-y-6 pb-2">
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
              {register.isPending ? (
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
                  Create Account
                </Text>
              )}
            </Pressable>

            <View className="pt-1">
              <Text className="text-center text-[14px] text-stone-500 leading-relaxed">
                Already have an account?{' '}
                <Text
                  className="font-semibold text-stone-900 hover:text-stone-600 transition-colors"
                  onPress={() => router.push('/login')}
                >
                  Sign in
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
