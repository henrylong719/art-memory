/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Image as NImage } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StatusBar, StyleSheet, View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from '@/components/ui';

// Warm autumnal painting — matches Figma moodboard
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1570569977384-be17f90f1a10?auto=format&fit=crop&q=80&w=1080';

export function SplashScreen() {
  const router = useRouter();

  return (
    <RNView className="flex flex-col h-full bg-stone-900 text-white relative overflow-hidden">
      <StatusBar barStyle="light-content" />

      {/* Hero image — use NImage directly to avoid withUniwind wrapper issues on web */}
      <NImage
        source={{ uri: HERO_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={1000}
      />

      {/* Dark overlay */}
      <RNView style={[StyleSheet.absoluteFill, styles.overlay]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Branding — sits in upper third, matching Figma */}
        <RNView style={styles.brandingBlock}>
          {/* Logo mark: thin circle with centered dot */}
          <RNView style={styles.logoCircle}>
            <RNView style={styles.logoDot} />
          </RNView>

          <RNView style={styles.textBlock}>
            <Text className="font-serif text-[52px] font-semibold text-white text-center leading-[58px]">
              Art Memory
            </Text>
            <Text
              className="text-[16px] text-center leading-[24px]"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Discover and remember the art{'\n'}that moves you.
            </Text>
          </RNView>
        </RNView>

        {/* Flexible spacer — pushes buttons to bottom */}
        <RNView style={{ flex: 1 }} />

        {/* CTA buttons — pill-shaped, flush to bottom */}
        <RNView style={styles.buttons}>
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => router.push('/login')}
          >
            <Text className="text-charcoal-900 text-[17px] font-semibold">
              Sign In
            </Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => router.push('/sign-up')}
          >
            <Text className="text-white text-[17px] font-medium">
              Create Account
            </Text>
          </Pressable>
        </RNView>
      </SafeAreaView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  overlay: {
    backgroundColor: 'rgba(30, 30, 30, 0.62)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    // Branding starts ~18% from top — matches Figma upper-third placement
    paddingTop: '18%',
  },
  brandingBlock: {
    alignItems: 'center',
    gap: 20,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  buttons: {
    gap: 12,
  },
  btn: {
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#ffffff',
  },
  btnSecondary: {
    backgroundColor: 'rgba(71, 71, 71, 0.85)',
  },
});
