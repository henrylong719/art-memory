import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';

import {
  ScanLine,
  Home,
  LibraryBig,
  LayoutGrid,
  User,
} from 'lucide-react-native';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { setUser } from '@/features/auth/use-user-store';
import { useMe } from '@/lib/hooks';

const tabs = [
  {
    name: 'index',
    title: 'Home',
    icon: Home,
    tabBarButtonTestID: 'home-tab',
  },
  // {
  //   name: 'scan',
  //   title: 'Scan',
  //   path: '/scan',
  //   icon: ScanLine,
  //   tabBarButtonTestID: 'scan-tab',
  // },
  {
    name: 'artworks',
    title: 'Artworks',
    icon: LayoutGrid,
    tabBarButtonTestID: 'artworks-tab',
  },
  {
    name: 'collections',
    title: 'Collections',
    icon: LibraryBig,
    tabBarButtonTestID: 'Collections-tab',
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: User,
    tabBarButtonTestID: 'profile-tab',
  },
] as const;

export default function TabLayout() {
  const status = useAuth.use.status();

  // Re-hydrate user profile on every app start (token persists but user store doesn't)
  const { data: me } = useMe();
  useEffect(() => {
    if (me) {
      setUser({
        id: me.id,
        email: me.email,
        firstName: me.firstName,
        lastName: me.lastName,
        plan: me.plan,
      });
    }
  }, [me]);

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
      {tabs.map((tab) => (
        <Tabs.Screen
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <tab.icon size={22} color={color} />,
            tabBarButtonTestID: tab.tabBarButtonTestID,
          }}
        />
      ))}
    </Tabs>
  );
}
