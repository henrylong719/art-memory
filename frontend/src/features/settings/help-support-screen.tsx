/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion, AnimatePresence } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  MessageSquare,
  ScanLine,
  Search,
  Shield,
  User,
} from 'lucide-react-native';
import * as React from 'react';
import { Dimensions, Linking, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input, ScrollView, Text, View } from '@/components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 24;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// ─── Topic Card ──────────────────────────────────────────
function TopicCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Pressable
      className="bg-white rounded-[20px] p-4 items-start gap-4 border border-stone-100 active:bg-stone-50"
      style={{
        width: CARD_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View className="bg-stone-50 p-2.5 rounded-full">{icon}</View>
      <Text className="font-medium text-[14px] tracking-tight text-stone-700 leading-snug">
        {title}
      </Text>
    </Pressable>
  );
}

// ─── Action Row ──────────────────────────────────────────
function ActionRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-5 active:bg-stone-50"
    >
      <View className="flex-row items-center gap-4">
        <View className="text-stone-400">{icon}</View>
        <Text className="font-medium text-[15px] tracking-tight text-stone-700">
          {label}
        </Text>
      </View>
      <ChevronRight size={18} color="#d6d3d1" />
    </Pressable>
  );
}

// ─── FAQ Item ────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const rotation = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: 200 });
  };

  return (
    <View>
      <Pressable
        onPress={handleToggle}
        className="flex-row items-start justify-between py-4 px-5 active:bg-stone-50"
      >
        <Text
          className={`font-medium text-[15px] tracking-tight pr-4 leading-snug flex-1 ${
            isOpen ? 'text-stone-900' : 'text-stone-700'
          }`}
        >
          {question}
        </Text>
        <Animated.View style={chevronStyle} className="mt-0.5">
          <ChevronDown size={18} color="#a8a29e" />
        </Animated.View>
      </Pressable>

      <AnimatePresence>
        {isOpen && (
          <Motion.View
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 200 }}
          >
            <View className="px-5 pb-5 pt-1 pr-8">
              <Text className="text-[14px] text-stone-500 leading-relaxed">
                {answer}
              </Text>
            </View>
          </Motion.View>
        )}
      </AnimatePresence>
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────
function Divider() {
  return <View className="h-px bg-stone-100 mx-5" />;
}

// ─── Main Screen ─────────────────────────────────────────
export function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleEmail = () => {
    Linking.openURL('mailto:support@artmemory.app').catch(() => {});
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
          Help & Support
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450 }}
          className="px-6 pt-6 pb-4"
        >
          <Text className="font-serif text-3xl font-medium text-stone-900 mb-2">
            How can we help?
          </Text>
          <Text className="text-stone-500 text-[15px] leading-relaxed">
            Find answers to your questions or get in touch with our team.
          </Text>
        </Motion.View>

        {/* Search */}
        <Motion.View
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          className="px-6 pb-8"
        >
          <Input
            variant="search"
            leftIcon={<Search size={20} color="#a8a29e" strokeWidth={1.5} />}
            placeholder="Search help articles..."
          />
        </Motion.View>

        <View className="px-6 gap-10">
          {/* Common Topics Grid */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 200 }}
          >
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-4 px-2">
              Common Topics
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <TopicCard
                icon={<ScanLine size={20} color="#57534e" strokeWidth={1.5} />}
                title="Scanning artworks"
              />
              <TopicCard
                icon={
                  <LayoutGrid size={20} color="#57534e" strokeWidth={1.5} />
                }
                title="Managing collections"
              />
              <TopicCard
                icon={<User size={20} color="#57534e" strokeWidth={1.5} />}
                title="Account & login"
              />
              <TopicCard
                icon={<ImageIcon size={20} color="#57534e" strokeWidth={1.5} />}
                title="Saving artworks"
              />
              <TopicCard
                icon={<Shield size={20} color="#57534e" strokeWidth={1.5} />}
                title="App privacy & data"
              />
              <TopicCard
                icon={<Bell size={20} color="#57534e" strokeWidth={1.5} />}
                title="Notifications"
              />
            </View>
          </Motion.View>

          {/* Get in touch */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 300 }}
          >
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-4 px-2">
              Get in touch
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
              <ActionRow
                icon={<Mail size={20} color="#a8a29e" strokeWidth={1.5} />}
                label="Contact Support"
                onPress={handleEmail}
              />
              <Divider />
              <ActionRow
                icon={
                  <MessageSquare size={20} color="#a8a29e" strokeWidth={1.5} />
                }
                label="Send Feedback"
                onPress={handleEmail}
              />
              <Divider />
              <ActionRow
                icon={
                  <AlertCircle size={20} color="#a8a29e" strokeWidth={1.5} />
                }
                label="Report a Problem"
                onPress={handleEmail}
              />
            </View>
          </Motion.View>

          {/* FAQs */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 400 }}
          >
            <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-4 px-2">
              Frequently Asked Questions
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
              <FAQItem
                question="Why couldn't my artwork be identified?"
                answer="Our scanner works best with clear, well-lit images of the artwork. Ensure there is minimal glare and that the entire piece is in frame. If scanning fails, you can always enter the details manually."
              />
              <Divider />
              <FAQItem
                question="How do I edit a collection?"
                answer="Navigate to your Collections tab, select the collection you wish to edit, and tap the options icon in the top right corner to access management options."
              />
              <Divider />
              <FAQItem
                question="How does scan history work?"
                answer="Every time you scan an artwork, it is automatically saved to your history. You can view all past scans in the Profile tab under 'Scan History'."
              />
              <Divider />
              <FAQItem
                question="How do I update my account details?"
                answer="Go to your Profile, tap on the Settings icon or the 'Edit Profile' button to update your name, email, and security preferences."
              />
            </View>
          </Motion.View>

          {/* Footer CTA */}
          <Motion.View
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 500 }}
            className="mt-6 mb-8 items-center px-4"
          >
            <Text className="font-serif text-[22px] text-stone-900 mb-1">
              Still need help?
            </Text>
            <Text className="text-[14px] text-stone-500 mb-6 max-w-60 text-center">
              We're here to support your art journey.
            </Text>
            <Pressable
              onPress={handleEmail}
              className="bg-stone-900 rounded-full px-8 py-3.5 active:bg-stone-800"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                minWidth: 200,
                alignItems: 'center',
              }}
            >
              <Text className="text-white font-medium text-[15px]">
                Email Us
              </Text>
            </Pressable>
          </Motion.View>
        </View>
      </ScrollView>
    </View>
  );
}
