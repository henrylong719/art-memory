/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import {
  Bookmark,
  ChevronRight,
  History,
  Library,
  LifeBuoy,
  LogOut,
  Settings,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { signOut } from '@/features/auth/use-auth-store';
import {
  useCollections,
  useMe,
  useSavedArtworks,
  useScanHistory,
} from '@/lib/hooks';

// ─── Menu Row ────────────────────────────────────────────
function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-5 active:bg-stone-50"
    >
      <View className="flex-row items-center gap-4">
        <View className="text-stone-400">{icon}</View>
        <Text className="font-medium text-[15px] text-stone-700 tracking-tight">
          {label}
        </Text>
      </View>
      <ChevronRight size={18} color="#d6d3d1" />
    </Pressable>
  );
}

// ─── Separator ───────────────────────────────────────────
function Divider() {
  return <View className="h-px bg-stone-100 ml-13" />;
}

function SectionBreak() {
  return (
    <View className="h-2 bg-stone-50/50 border-t border-b border-stone-100" />
  );
}

// ─── Stat Card ───────────────────────────────────────────
function StatCard({
  value,
  label,
  variant = 'light',
}: {
  value: number;
  label: string;
  variant?: 'dark' | 'light';
}) {
  const isDark = variant === 'dark';
  return (
    <View
      className={`flex-1 rounded-2xl p-5 items-center justify-center gap-1.5 ${
        isDark ? 'bg-stone-900' : 'bg-white border border-stone-200'
      }`}
      style={
        isDark
          ? {
              shadowColor: '#1c1917',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }
          : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 4,
              elevation: 1,
            }
      }
    >
      <Text
        className={`font-serif text-[28px] leading-none font-medium ${
          isDark ? 'text-white' : 'text-stone-900'
        }`}
      >
        {value}
      </Text>
      <Text
        className={`text-[11px] tracking-widest uppercase font-semibold ${
          isDark ? 'text-stone-400' : 'text-stone-500'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────
export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: me } = useMe();
  const { data: scans } = useScanHistory();
  const { data: saved } = useSavedArtworks();
  const { data: collections } = useCollections();

  const firstName = me?.firstName ?? '';
  const lastName = me?.lastName ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User';
  const email = me?.email ?? '';
  const avatarUrl = me?.avatarUrl;

  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    email?.[0]?.toUpperCase() ||
    '?';

  const scansCount = scans?.length ?? 0;
  const savedCount = saved?.length ?? 0;
  const collectionsCount = collections?.length ?? 0;

  // Plan label
  const planLabel =
    me?.plan === 'MONTHLY' || me?.plan === 'YEARLY'
      ? 'Patron Member'
      : 'Free Plan';
  const memberSince = me?.createdAt
    ? new Date(me.createdAt).getFullYear().toString()
    : '';

  const handleLogout = () => {
    signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4 pb-6 mt-16">
          {/* Title */}
          <Text className="font-serif text-[32px] leading-tight font-medium text-stone-900 mb-8 px-2">
            Profile
          </Text>

          {/* User Identity Card */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450 }}
          >
            <View
              className="bg-white rounded-3xl p-6 gap-5 mb-8 border border-stone-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View className="flex-row items-center gap-5">
                {/* Avatar */}
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    className="w-20 h-20 rounded-full"
                    contentFit="cover"
                    transition={300}
                    style={{
                      borderWidth: 1,
                      borderColor: '#f5f5f4',
                    }}
                  />
                ) : (
                  <View className="w-20 h-20 rounded-full bg-stone-100 items-center justify-center border border-stone-200">
                    <Text className="font-serif text-2xl font-medium text-stone-500">
                      {initials}
                    </Text>
                  </View>
                )}

                <View className="flex-1">
                  <Text className="font-serif text-2xl font-medium text-stone-900 leading-tight mb-1">
                    {fullName}
                  </Text>
                  <Text
                    className="text-stone-500 text-[15px]"
                    numberOfLines={1}
                  >
                    {email}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View className="h-px bg-stone-100" />

              {/* Plan row */}
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-400">
                  {planLabel}
                </Text>
                {memberSince ? (
                  <Text className="text-[13px] font-medium text-stone-400">
                    Since {memberSince}
                  </Text>
                ) : null}
              </View>
            </View>
          </Motion.View>

          {/* Stats Row */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 100 }}
          >
            <View className="flex-row gap-3 mb-8">
              <StatCard value={scansCount} label="Scans" variant="dark" />
              <StatCard value={savedCount} label="Saved" />
              <StatCard value={collectionsCount} label="Lists" />
            </View>
          </Motion.View>

          {/* Quick Actions */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 200 }}
          >
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-4 px-2">
              Account
            </Text>
            <View
              className="bg-white rounded-3xl overflow-hidden border border-stone-100 mb-8"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <MenuRow
                icon={<History size={20} color="#a8a29e" strokeWidth={1.5} />}
                label="Scan History"
                onPress={() => router.push('/profile/history')}
              />
              <Divider />
              <MenuRow
                icon={<Bookmark size={20} color="#a8a29e" strokeWidth={1.5} />}
                label="Saved Artworks"
                onPress={() => router.push('/(app)/artworks')}
              />
              <Divider />
              <MenuRow
                icon={<Library size={20} color="#a8a29e" strokeWidth={1.5} />}
                label="Collections"
                onPress={() => router.push('/(app)/collections')}
              />

              <SectionBreak />

              <MenuRow
                icon={<Settings size={20} color="#a8a29e" strokeWidth={1.5} />}
                label="Preferences"
                onPress={() => router.push('/profile/settings')}
              />
              <Divider />
              <MenuRow
                icon={<LifeBuoy size={20} color="#a8a29e" strokeWidth={1.5} />}
                label="Help & Support"
                onPress={() => router.push('/profile/help')}
              />
            </View>
          </Motion.View>

          {/* Logout */}
          <Motion.View
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
          >
            <Pressable
              onPress={handleLogout}
              className="flex-row items-center justify-center gap-2 py-4 active:opacity-70"
            >
              <LogOut size={18} color="#a8a29e" />
              <Text className="text-stone-400 font-medium">Log Out</Text>
            </Pressable>
          </Motion.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
