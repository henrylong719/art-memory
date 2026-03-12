/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AnimatePresence, Motion } from '@legendapp/motion';

import { Input, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { SocialLoginButtons } from '@/features/auth/components/social-login-buttons';
import { useRegister } from '@/lib/hooks/use-auth';
import Toast from '@/components/ui/toast';
import { useToast } from '@/lib/hooks';
import { getErrorMessage } from '@/lib/utils';

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
          showToast(getErrorMessage(error, 'Failed to create account.'), 'error');
        },
      },
    );
  };

  const isDisabled = !email.trim() || !password || register.isPending;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>

      <View className="px-4 pb-2">
        <Pressable
          className="p-2 -ml-2 bg-transparent active:bg-stone-100 rounded-full"
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
            <View className="flex-row mb-5 gap-3">
              <View className="flex-1">
                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  placeholderTextColor="#B0B0B0"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>

            <View className="mb-5">
              <Input
                label="Email"
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
              <Input
                label="Password"
                hint="Minimum 6 characters"
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

          {/* Social login */}
          <SocialLoginButtons />

          {/* CTA */}
          <View className="space-y-6 pb-2">
            <Pressable
              className={`rounded-2xl py-4 items-center mb-5 ${isDisabled ? 'bg-stone-200' : 'bg-stone-900 active:bg-stone-800'}`}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {register.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  className={`text-[15px] font-semibold tracking-wide ${isDisabled ? 'text-stone-400' : 'text-white'}`}
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
