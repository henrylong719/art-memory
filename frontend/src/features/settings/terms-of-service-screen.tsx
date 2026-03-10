/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import * as React from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollView, Text, View } from '@/components/ui';

export function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-stone-50 mt-16">
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
          Terms of Service
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 80 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450 }}
        >
          <View
            className="bg-white rounded-3xl p-6 border border-stone-100"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <Text className="text-[13px] text-stone-400 font-medium mb-6">
              Last Updated: March 10, 2026
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              1. Acceptance of Terms
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed mb-6">
              By accessing or using the Art Memory mobile application, you agree
              to be bound by these Terms of Service and all applicable laws and
              regulations. If you do not agree with any of these terms, you are
              prohibited from using or accessing this app.
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              2. User Accounts
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed mb-6">
              You are responsible for safeguarding the password that you use to
              access the service and for any activities or actions under your
              password. You agree not to disclose your password to any third
              party.
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              3. Content and Copyright
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed mb-6">
              The artwork recognition feature provides informational data based
              on visual analysis. Art Memory does not claim ownership over the
              artworks scanned. Users are responsible for ensuring their use of
              the app complies with local museum and gallery photography
              policies.
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              4. App License
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed mb-6">
              We grant you a personal, worldwide, royalty-free, non-assignable,
              nonexclusive, revocable, and non-sublicensable license to access
              and use our Services. This license is for the sole purpose of
              letting you use and enjoy the Services' benefits.
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              5. Modifications
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed">
              We reserve the right to modify or replace these Terms at any time.
              We will try to provide at least 30 days notice prior to any new
              terms taking effect.
            </Text>
          </View>
        </Motion.View>
      </ScrollView>
    </View>
  );
}
