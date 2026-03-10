import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { useThemeConfig } from '@/components/ui/use-theme-config';
import { hydrateAuth } from '@/features/auth/use-auth-store';
import { APIProvider } from '@/lib/api';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import '../global.css';
import { useEffect, type ReactNode } from 'react';

export { ErrorBoundary } from 'expo-router';

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: '(app)',
};

hydrateAuth();
loadSelectedTheme();
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 500, fade: true });

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Providers>
      <Stack>
        {/* Authenticated tab group */}
        <Stack.Screen name="(app)" options={{ headerShown: false }} />

        {/* Auth screens */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />

        {/* Artwork detail (shown above tabs) */}
        <Stack.Screen
          name="artworks/[id]"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />

        {/* Collection detail (shown above tabs) */}
        <Stack.Screen
          name="collections/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* Discover flow (accessed from Home) */}
        <Stack.Screen
          name="discover/index"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="discover/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* Scan flow (full-screen, no tab bar) */}
        <Stack.Screen
          name="scan/camera"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="scan/result"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="scan/fallback"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="scan/manual-entry"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* Profile sub-screens */}
        <Stack.Screen
          name="profile/history"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView style={styles.container}>
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <APIProvider>
            <BottomSheetModalProvider>
              {children}
              <FlashMessage position="top" />
            </BottomSheetModalProvider>
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
