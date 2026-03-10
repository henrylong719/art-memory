/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { Camera, Check, ChevronLeft } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, ScrollView, Text, View } from '@/components/ui';
import { useMe, useUpdateMe } from '@/lib/hooks';

export function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const updateMe = useUpdateMe();

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  React.useEffect(() => {
    if (me) {
      setFirstName(me.firstName ?? '');
      setLastName(me.lastName ?? '');
    }
  }, [me]);

  const avatarUrl = me?.avatarUrl;
  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    '?';

  const handleSave = () => {
    updateMe.mutate(
      {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View className="flex-1 bg-stone-50 mt-16">
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
          Edit Profile
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 80 + insets.bottom,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <Motion.View
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mb-8 mt-2"
        >
          <View className="relative">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-28 h-28 rounded-full"
                contentFit="cover"
                style={{ borderWidth: 4, borderColor: '#fff' }}
              />
            ) : (
              <View
                className="w-28 h-28 rounded-full bg-stone-100 items-center justify-center"
                style={{ borderWidth: 4, borderColor: '#fff' }}
              >
                <Text className="font-serif text-3xl font-medium text-stone-500">
                  {initials}
                </Text>
              </View>
            )}
            <Pressable
              className="absolute bottom-0 right-0 w-9 h-9 bg-stone-900 rounded-full items-center justify-center active:bg-stone-800"
              style={{ borderWidth: 2, borderColor: '#fff' }}
            >
              <Camera size={16} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>
        </Motion.View>

        {/* Form */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          className="w-full gap-5"
        >
          <View className="gap-1.5">
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 ml-1">
              First Name
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor="#a8a29e"
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-[15px] text-stone-900"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 ml-1">
              Last Name
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor="#a8a29e"
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-[15px] text-stone-900"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 ml-1">
              Email
            </Text>
            <View className="w-full bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3.5">
              <Text className="text-[15px] text-stone-400">
                {me?.email ?? ''}
              </Text>
            </View>
          </View>
        </Motion.View>

        {/* Save Button */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 200 }}
          className="w-full mt-10"
        >
          <Pressable
            onPress={handleSave}
            disabled={updateMe.isPending}
            className="w-full bg-stone-900 rounded-full py-4 flex-row items-center justify-center gap-2 active:bg-stone-800"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {updateMe.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" strokeWidth={2} />
                <Text className="text-white font-medium text-[16px]">
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>
        </Motion.View>
      </ScrollView>
    </View>
  );
}
