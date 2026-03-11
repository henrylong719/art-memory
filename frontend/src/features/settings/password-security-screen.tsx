/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollView, Text, View } from '@/components/ui';
import { useLogoutAll } from '@/lib/hooks';

export function PasswordSecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logoutAll = useLogoutAll();

  const handleLogoutAll = () => {
    Alert.alert(
      'Log Out of All Devices',
      'This will end all active sessions including this one. You will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All',
          style: 'destructive',
          onPress: () => logoutAll.mutate(),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-stone-50">
      {/* Header */}
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
          Password & Security
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
        <View className="gap-8">
          {/* Login Credentials */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450 }}
          >
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-3 px-2">
              Login Credentials
            </Text>
            <View
              className="bg-white rounded-3xl overflow-hidden border border-stone-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <Pressable
                onPress={() => router.push('/profile/change-password')}
                className="flex-row items-center justify-between py-4 px-5 active:bg-stone-50"
              >
                <View className="flex-row items-center gap-4">
                  <KeyRound size={20} color="#a8a29e" strokeWidth={1.5} />
                  <View>
                    <Text className="font-medium text-[15px] tracking-tight text-stone-700">
                      Change Password
                    </Text>
                    <Text className="text-[13px] text-stone-400 mt-0.5">
                      Updated 3 months ago
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#d6d3d1" />
              </Pressable>
            </View>
          </Motion.View>

          {/* Enhanced Security */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 100 }}
          >
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-3 px-2">
              Enhanced Security
            </Text>
            <View
              className="bg-white rounded-3xl overflow-hidden border border-stone-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View className="flex-row items-center justify-between py-4 px-5">
                <View className="flex-row items-center gap-4 flex-1">
                  <ShieldCheck size={20} color="#a8a29e" strokeWidth={1.5} />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-medium text-[15px] tracking-tight text-stone-700">
                        Two-Factor Auth
                      </Text>
                      <View className="bg-stone-100 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-semibold tracking-wider uppercase text-stone-500">
                          Coming Soon
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[13px] text-stone-400 mt-0.5 leading-snug max-w-55">
                      Add an extra layer of security to your account.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Motion.View>

          {/* Active Sessions */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 200 }}
          >
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-3 px-2">
              Active Sessions
            </Text>
            <View
              className="bg-white rounded-3xl overflow-hidden border border-stone-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View className="flex-row items-center justify-between py-4 px-5">
                <View className="flex-row items-center gap-4">
                  <Smartphone size={20} color="#1c1917" strokeWidth={1.5} />
                  <View>
                    <Text className="font-medium text-[15px] tracking-tight text-stone-900">
                      This Device
                    </Text>
                    <Text className="text-[13px] text-stone-500 mt-0.5">
                      Active now
                    </Text>
                  </View>
                </View>
              </View>
              <View className="h-px bg-stone-100 mx-5" />
              <Pressable
                onPress={handleLogoutAll}
                disabled={logoutAll.isPending}
                className="py-4 items-center active:bg-red-50"
              >
                {logoutAll.isPending ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Text className="text-[14px] font-medium text-red-600">
                    Log Out of All Devices
                  </Text>
                )}
              </Pressable>
            </View>
          </Motion.View>
        </View>
      </ScrollView>
    </View>
  );
}
