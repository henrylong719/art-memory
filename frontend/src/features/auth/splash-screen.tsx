/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { Image as NImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, Text } from '@/components/ui';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1570569977384-be17f90f1a10?auto=format&fit=crop&q=80&w=1080';

export function SplashScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-stone-900">
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <NImage
        source={{ uri: HERO_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View className="absolute inset-0 bg-stone-900/55" />

      {/* Content */}
      <SafeAreaView className="flex-1 px-6">
        {/* Title — centered in upper half */}
        <View className="flex-1 items-center justify-center">
          <Motion.View
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 700 }}
            className="items-center w-full"
          >
            <View className="w-11 h-11 border border-white/40 rounded-full mb-6 items-center justify-center">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
            <Text className="text-[46px] font-medium tracking-wide mb-4 text-white text-center">
              Art Memory
            </Text>
            <Text className="text-white/70 text-base font-medium leading-relaxed text-center px-8">
              Discover and remember the art{'\n'}that moves you.
            </Text>
          </Motion.View>
        </View>

        {/* Buttons — pinned to bottom */}
        <Motion.View
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 200 }}
          className="w-full gap-3 pb-8 px-5"
        >
          <Pressable
            className="rounded-2xl py-4 items-center bg-white active:bg-stone-100"
            onPress={() => router.push('/login')}
          >
            <Text className="text-stone-900 text-[15px] font-semibold">
              Sign In
            </Text>
          </Pressable>
          <Pressable
            className="rounded-2xl py-4 items-center bg-white/15 active:bg-white/25"
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
