import { Redirect, SplashScreen, Tabs } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

import { BookOpen, Home as HomeIcon, Palette, ScanLine, User } from 'lucide-react-native';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { setUser } from '@/features/auth/use-user-store';
import { useMe } from '@/lib/hooks';

export default function TabLayout() {
  const status = useAuth.use.status();

  // Re-hydrate user profile on every app start (token persists but user store doesn't)
  const { data: me } = useMe();
  useEffect(() => {
    if (me) {
      setUser({ id: me.id, email: me.email, firstName: me.firstName, lastName: me.lastName, plan: me.plan });
    }
  }, [me]);

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => {
        hideSplash();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hideSplash, status]);

  if (status === 'signOut') {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1c1917',
        tabBarInactiveTintColor: '#a8a29e',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e7e5e4',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon size={22} color={color} />,
          tabBarButtonTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <ScanIcon color={color} />,
          tabBarButtonTestID: 'scan-tab',
        }}
      />
      <Tabs.Screen
        name="artworks"
        options={{
          title: 'Artworks',
          tabBarIcon: ({ color }) => <Palette size={22} color={color} />,
          tabBarButtonTestID: 'artworks-tab',
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => <CollectionsIcon color={color} />,
          tabBarButtonTestID: 'collections-tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
          tabBarButtonTestID: 'profile-tab',
        }}
      />
    </Tabs>
  );
}
