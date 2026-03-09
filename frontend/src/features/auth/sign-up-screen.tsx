/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView, Text, View } from '@/components/ui';
import { useRegister } from '@/lib/hooks/use-auth';

import { ChevronLeft } from 'lucide-react-native';

export function SignUpScreen() {
  const router = useRouter();
  const register = useRegister();

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [focused, setFocused] = React.useState<string | null>(null);

  const axiosError = register.error as AxiosError<{ message: string }> | null;
  const errorMessage = axiosError?.response?.data?.message ?? axiosError?.message ?? null;

  const handleSubmit = () => {
    if (!email.trim() || !password) return;
    register.mutate(
      {
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      },
      { onSuccess: () => router.replace('/(app)') },
    );
  };

  const isDisabled = !email.trim() || !password || register.isPending;
  const inputCls = (name: string) =>
    `bg-white border rounded-2xl py-[15px] px-4 text-[15px] text-stone-900 ${
      focused === name ? 'border-stone-400' : 'border-stone-200'
    }`;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="px-4 pb-4">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full active:bg-stone-900/6"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#1c1917" />
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-8 pt-8 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View className="mb-10">
            <Text className="font-serif text-[32px] font-medium leading-[38px] text-stone-900 mb-3">
              Create Account
            </Text>
            <Text className="text-[15px] leading-[22px] text-stone-500">
              Join to start saving and discovering art.
            </Text>
          </View>

          {/* Fields */}
          <View className="gap-5 mb-6">
            {/* Name row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2 pl-1">
                  FIRST NAME
                </Text>
                <TextInput
                  className={inputCls('firstName')}
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFocused('firstName')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  placeholderTextColor="#a8a29e"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2 pl-1">
                  LAST NAME
                </Text>
                <TextInput
                  className={inputCls('lastName')}
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setFocused('lastName')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  placeholderTextColor="#a8a29e"
                />
              </View>
            </View>

            <View>
              <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2 pl-1">
                EMAIL
              </Text>
              <TextInput
                className={inputCls('email')}
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
              <Text className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2 pl-1">
                PASSWORD
              </Text>
              <TextInput
                className={inputCls('password')}
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
              <Text className="text-[11px] text-stone-400 mt-1.5 pl-1">
                Minimum 6 characters
              </Text>
            </View>
          </View>

          {/* Error */}
          {errorMessage ? (
            <View className="bg-red-50 rounded-xl p-3.5 mb-4 border border-red-200">
              <Text className="text-red-600 text-[13px] leading-5">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Spacer */}
          <View className="flex-1 min-h-[20px]" />

          {/* CTA */}
          <View className="gap-6 pb-2">
            <Pressable
              className={`rounded-full py-[15px] items-center shadow-lg ${
                isDisabled ? 'bg-stone-300 shadow-none' : 'bg-stone-900 active:bg-stone-800'
              }`}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {register.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  className={`text-[15px] font-semibold tracking-wide ${
                    isDisabled ? 'text-stone-400' : 'text-white'
                  }`}
                >
                  Create Account
                </Text>
              )}
            </Pressable>

            <View className="pt-1">
              <Text className="text-center text-sm text-stone-500 leading-[22px]">
                Already have an account?{' '}
                <Text
                  className="font-semibold text-stone-900"
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
