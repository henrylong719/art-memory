/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, Send } from 'lucide-react-native';
import * as React from 'react';
import { Linking, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollView, Text, View } from '@/components/ui';

export function ContactSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSend = () => {
    const mailto = `mailto:support@artmemory.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    Linking.openURL(mailto).catch(() => {});
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
          Contact Support
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
        {/* Intro */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450 }}
          className="mb-8"
        >
          <Text className="font-serif text-3xl font-medium text-stone-900 mb-2">
            Get in touch
          </Text>
          <Text className="text-stone-500 text-[15px] leading-relaxed">
            Have a question, feedback, or need assistance? Send us a message and
            our team will get back to you shortly.
          </Text>
        </Motion.View>

        {/* Form */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          className="gap-5 mb-8"
        >
          <View className="gap-1.5">
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 ml-1">
              Subject
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="What is this regarding?"
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
              Message
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="How can we help you?"
              placeholderTextColor="#a8a29e"
              multiline
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-[15px] text-stone-900"
              style={{
                minHeight: 160,
                textAlignVertical: 'top',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}
            />
          </View>
        </Motion.View>

        {/* Send Button */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 200 }}
        >
          <Pressable
            onPress={handleSend}
            className="w-full bg-stone-900 rounded-full py-4 flex-row items-center justify-center gap-2 mb-8 active:bg-stone-800"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Send size={18} color="#fff" strokeWidth={2} />
            <Text className="text-white font-medium text-[16px]">
              Send Message
            </Text>
          </Pressable>
        </Motion.View>

        {/* Email fallback */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 300 }}
        >
          <View
            className="bg-white rounded-3xl p-5 flex-row items-center gap-4 border border-stone-100"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <View className="w-10 h-10 rounded-full bg-stone-50 items-center justify-center">
              <Mail size={20} color="#78716c" strokeWidth={1.5} />
            </View>
            <View>
              <Text className="font-medium text-[15px] text-stone-900 mb-0.5">
                Prefer email?
              </Text>
              <Text className="text-[14px] text-stone-500">
                support@artmemory.app
              </Text>
            </View>
          </View>
        </Motion.View>
      </ScrollView>
    </View>
  );
}
