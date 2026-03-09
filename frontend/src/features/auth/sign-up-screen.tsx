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
import { useRegister } from '@/lib/hooks/use-auth';

// TextInput is not wrapped with withUniwind so it doesn't support className.
// Input styles are kept as plain objects; everything else uses Tailwind.
const inputBase: object = {
  backgroundColor: '#F5F5F5',
  borderRadius: 14,
  paddingVertical: 15,
  paddingHorizontal: 16,
  fontSize: 15,
  color: '#1E1E1E',
  borderWidth: 1.5,
};
const inputBlurred = { borderColor: '#F5F5F5' };
const inputFocused = { borderColor: '#B0B0B0' };

export function SignUpScreen() {
  const router = useRouter();
  const register = useRegister();

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [focused, setFocused] = React.useState<string | null>(null);

  const axiosError = register.error as AxiosError<{ message: string }> | null;
  const errorMessage =
    axiosError?.response?.data?.message ?? axiosError?.message ?? null;

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

  return (
    <SafeAreaView className="flex flex-col h-full bg-stone-50 overflow-y-auto">
      <View className="px-4 pt-12 pb-4 sticky top-0 bg-stone-50/90 backdrop-blur-md z-10">
        <Pressable
          className="p-2 -ml-2 rounded-full hover:bg-stone-200/50 transition-colors text-stone-900"
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
          className="flex-1"
          contentContainerClassName="grow pb-8"
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
          <View className="flex flex-col flex-1">
            <View className="space-y-5 mb-6">
              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                    First Name
                  </Text>
                  <TextInput
                    className="w-full bg-white border border-stone-200 rounded-2xl py-3.75 px-4 text-[15px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all placeholder:text-stone-400"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    placeholderTextColor="#B0B0B0"
                  />
                </View>
                <View className="flex-1">
                  <Text className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2.5 pl-1">
                    Last Name
                  </Text>
                  <TextInput
                    className="w-full bg-white border border-stone-200 rounded-2xl py-3.75 px-4 text-[15px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all placeholder:text-stone-400"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    placeholderTextColor="#B0B0B0"
                  />
                </View>
              </View>

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
          </View>

          {/* Error */}
          {errorMessage ? (
            <View className="mx-6 mt-2 bg-danger-50 rounded-xl p-3.5 border border-danger-200">
              <Text className="text-danger-600 text-[13px] leading-5">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View className="flex-1 min-h-5" />

          {/* CTA */}
          <View className="space-y-6 pb-2">
            <Pressable
              className={`rounded-2xl py-4.25 items-center ${
                isDisabled ? 'bg-stone-200' : 'bg-stone-900 active:bg-stone-800'
              }`}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {register.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  className={`text-[16px] font-semibold ${
                    isDisabled ? 'text-stone-400' : 'text-white'
                  }`}
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
