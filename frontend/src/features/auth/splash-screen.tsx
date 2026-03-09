/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1570569977384-be17f90f1a10?auto=format&fit=crop&q=80&w=1080';

export function SplashScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-stone-900">
      <StatusBar barStyle="light-content" />

      <Image
        source={{ uri: HERO_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={1000}
      />

      {/* Overlay */}
      <View className="absolute inset-0 bg-stone-900/50" />

      <SafeAreaView className="flex-1 justify-between px-8 pt-16 pb-8">
        {/* Header */}
        <View className="items-center">
          <View className="w-12 h-12 rounded-full border border-white/30 items-center justify-center mb-6">
            <View className="w-2 h-2 rounded-full bg-white" />
          </View>
          <Text className="font-serif text-[46px] font-semibold text-white tracking-wide mb-4 text-center">
            Art Memory
          </Text>
          <Text className="text-base text-stone-300 text-center leading-[26px]">
            Discover and remember{'\n'}the art that moves you.
          </Text>
        </View>

        {/* CTAs */}
        <View className="gap-3">
          <Pressable
            className="bg-white rounded-2xl py-[17px] items-center active:bg-stone-100"
            onPress={() => router.push('/login')}
          >
            <Text className="text-stone-900 text-[17px] font-semibold tracking-wide">
              Sign In
            </Text>
          </Pressable>
          <Pressable
            className="bg-white/10 rounded-2xl py-[17px] items-center border border-white/18 active:bg-white/18"
            onPress={() => router.push('/sign-up')}
          >
            <Text className="text-white text-[17px] font-medium tracking-wide">
              Create Account
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
