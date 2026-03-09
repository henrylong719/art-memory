import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1570569977384-be17f90f1a10?auto=format&fit=crop&q=80&w=1080';

export function SplashScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background artwork image */}
      <Image
        source={{ uri: HERO_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={1000}
      />

      {/* Dark overlay — top half slightly lighter to show artwork */}
      <View style={[StyleSheet.absoluteFill, styles.overlayTop]} />
      {/* Dark overlay — bottom half solid for readability */}
      <View style={styles.overlayBottom} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <View style={styles.logoDot} />
          </View>
          <Text style={styles.title}>Art Memory</Text>
          <Text style={styles.tagline}>
            Discover and remember{'\n'}the art that moves you.
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryPressed,
            ]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.secondaryPressed,
            ]}
            onPress={() => router.push('/sign-up')}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1917',
  },
  overlayTop: {
    backgroundColor: 'rgba(28,25,23,0.52)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
  },
  logoRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  title: {
    fontFamily: SERIF,
    fontSize: 46,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#d6d3d1',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryPressed: {
    backgroundColor: '#f5f5f4',
  },
  primaryBtnText: {
    color: '#1c1917',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  secondaryPressed: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
