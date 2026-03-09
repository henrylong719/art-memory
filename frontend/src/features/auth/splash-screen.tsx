/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { Image as NImage } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';

// Warm autumnal painting — matches Figma moodboard
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1570569977384-be17f90f1a10?auto=format&fit=crop&q=80&w=1080';

export function SplashScreen() {
  const router = useRouter();

  return (
    <View className="flex flex-col h-full bg-stone-900 text-white relative overflow-hidden">
      <StatusBar barStyle="light-content" />

      <View className="absolute inset-0 z-0">
        <Motion.View
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="w-full h-full object-cover opacity-60"
        >
          <NImage
            source={{ uri: HERO_IMAGE }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={1000}
          />

          <View className="absolute inset-0 bg-linear-to-b from-stone-900/60 via-stone-900/40 to-stone-900" />
        </Motion.View>
      </View>

      <SafeAreaView className="flex-1 px-6 pb-6 pt-[18%]">
        <View className="relative z-10 flex-1 flex flex-col justify-between px-8 pt-24 pb-12">
          <Motion.View
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center w-full"
          >
            <View className="w-11 h-11 border border-white/40 rounded-full mx-auto mb-6 flex items-center justify-center">
              <View className="w-1.75 h-1.75 bg-white rounded-full" />
            </View>
            <Text className="font-serif text-[46px] font-medium tracking-wide mb-4 text-white drop-shadow-md text-center">
              Art Memory
            </Text>
            <Text className="text-white/70 text-base font-medium max-w-65 mx-auto leading-relaxed drop-shadow-sm text-center">
              Discover and remember the art{'\n'}that moves you.
            </Text>
          </Motion.View>
        </View>

        <Motion.View
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full flex flex-col gap-4 mt-auto px-6 pb-15"
        >
          <Pressable
            className="rounded-2xl py-4.5 items-center bg-white"
            onPress={() => router.push('/login')}
          >
            <Text className="text-stone-900 text-[15px] font-semibold">
              Sign In
            </Text>
          </Pressable>
          <Pressable
            className="rounded-2xl py-4.5 items-center bg-[rgba(71,71,71,0.85)]"
            onPress={() => router.push('/sign-up')}
          >
            <Text className="text-white text-[15px] font-medium">
              Create Account
            </Text>
          </Pressable>
        </Motion.View>
      </SafeAreaView>
    </View>
  );
}
