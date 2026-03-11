/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import * as React from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollView, Text, View } from '@/components/ui';

export function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-stone-50">
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
          Privacy Policy
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
              1. Information We Collect
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed mb-6">
              When you use Art Memory, we collect information you provide
              directly to us, such as your name, email address, and profile
              details. We also securely store the artwork data and collections
              you create within the app.
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              2. How We Use Your Information
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed mb-6">
              We use the information we collect to provide, maintain, and
              improve our services, including to personalize your museum
              recommendations and help you organize your art collections
              effectively.
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              3. Data Security
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed mb-6">
              We take reasonable measures to help protect information about you
              from loss, theft, misuse and unauthorized access, disclosure,
              alteration and destruction. Your scanned artworks remain private
              unless you choose to share them.
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              4. Camera and Photo Access
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed mb-6">
              Art Memory requires access to your device's camera and photo
              library to scan and identify artworks. Images processed by our
              identification engine are not permanently stored on our servers
              unless you save them to your collections.
            </Text>

            <Text className="font-serif text-xl text-stone-900 font-medium mb-2">
              5. Contact Us
            </Text>
            <Text className="text-stone-600 text-[15px] leading-relaxed">
              If you have any questions about this Privacy Policy, please
              contact us at privacy@artmemory.app.
            </Text>
          </View>
        </Motion.View>
      </ScrollView>
    </View>
  );
}
