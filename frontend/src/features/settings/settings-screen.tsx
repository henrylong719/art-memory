/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  ScanLine,
  Shield,
  ShieldAlert,
  User,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollView, Text, View } from '@/components/ui';
import { signOut } from '@/features/auth/use-auth-store';
import { useMe, useUpdateMe } from '@/lib/hooks';

// ─── Section ─────────────────────────────────────────────
function Section({
  title,
  delay,
  children,
}: {
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Motion.View
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'timing', duration: 450, delay: delay * 1000 }}
    >
      <Text className="text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-3 px-2">
        {title}
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
        {children}
      </View>
    </Motion.View>
  );
}

// ─── Action Row ──────────────────────────────────────────
function ActionRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-5 active:bg-stone-50"
    >
      <View className="flex-row items-center gap-4">
        <View>{icon}</View>
        <Text className="font-medium text-[15px] tracking-tight text-stone-700">
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value ? (
          <Text className="text-[14px] text-stone-400 font-medium">
            {value}
          </Text>
        ) : null}
        <ChevronRight size={18} color="#d6d3d1" />
      </View>
    </Pressable>
  );
}

// ─── Toggle Row ──────────────────────────────────────────
function ToggleRow({
  icon,
  label,
  subtitle,
  value,
  onToggle,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between py-4 px-5 bg-white"
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      <View className="flex-row items-center gap-4 flex-1">
        <View>{icon}</View>
        <View className="flex-row items-center gap-2">
          <Text
            className={`font-medium text-[15px] tracking-tight ${
              disabled ? 'text-stone-400' : 'text-stone-700'
            }`}
          >
            {label}
          </Text>
          {subtitle ? (
            <View className="bg-stone-100 px-2 py-0.5 rounded-full">
              <Text className="text-[11px] font-semibold tracking-wider uppercase text-stone-500">
                {subtitle}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={(v) => {
          if (!disabled) onToggle(v);
        }}
        disabled={disabled}
        trackColor={{ false: '#e7e5e4', true: '#1c1917' }}
        thumbColor="#ffffff"
        ios_backgroundColor="#e7e5e4"
      />
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────
function Divider() {
  return <View className="h-px bg-stone-100 ml-[52px]" />;
}

// ─── Main Screen ─────────────────────────────────────────
export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const updateMe = useUpdateMe();

  const [notifications, setNotifications] = React.useState(
    me?.notificationsOn ?? true,
  );

  // Sync when user data loads
  React.useEffect(() => {
    if (me?.notificationsOn != null) {
      setNotifications(me.notificationsOn);
    }
  }, [me?.notificationsOn]);

  const handleToggleNotifications = (val: boolean) => {
    setNotifications(val);
    updateMe.mutate({ notificationsOn: val });
  };

  const handleLogout = () => {
    signOut();
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
          Settings
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
          {/* Account */}
          <Section title="Account" delay={0}>
            <ActionRow
              icon={<User size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Edit Profile"
              onPress={() => {}}
            />
            <Divider />
            <ActionRow
              icon={<Mail size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Email"
              value={me?.email ?? ''}
            />
            <Divider />
            <ActionRow
              icon={<Shield size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Password & Security"
              onPress={() => {}}
            />
          </Section>

          {/* Preferences */}
          <Section title="Preferences" delay={0.1}>
            <ToggleRow
              icon={<Bell size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Notifications"
              value={notifications}
              onToggle={handleToggleNotifications}
            />
            <Divider />
            <ToggleRow
              icon={<Moon size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Dark Mode"
              subtitle="Coming soon"
              value={false}
              onToggle={() => {}}
              disabled
            />
            <Divider />
            <ActionRow
              icon={<Globe size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Language"
              value={
                me?.preferredLanguage === 'en'
                  ? 'English'
                  : (me?.preferredLanguage ?? 'English')
              }
            />
          </Section>

          {/* Artwork Experience */}
          <Section title="Artwork Experience" delay={0.2}>
            <ActionRow
              icon={<LayoutGrid size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Default View"
              value="Grid"
            />
            <Divider />
            <ActionRow
              icon={<ScanLine size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Scan Preferences"
              onPress={() => {}}
            />
            <Divider />
            <ToggleRow
              icon={<MapPin size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Museum Recommendations"
              value={true}
              onToggle={() => {}}
            />
          </Section>

          {/* Support */}
          <Section title="Support" delay={0.3}>
            <ActionRow
              icon={<HelpCircle size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Help Center"
              onPress={() => router.push('/profile/help')}
            />
            <Divider />
            <ActionRow
              icon={
                <MessageSquare size={20} color="#a8a29e" strokeWidth={1.5} />
              }
              label="Contact Support"
              onPress={() => {}}
            />
            <Divider />
            <ActionRow
              icon={<ShieldAlert size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Privacy Policy"
              onPress={() => {}}
            />
            <Divider />
            <ActionRow
              icon={<FileText size={20} color="#a8a29e" strokeWidth={1.5} />}
              label="Terms of Service"
              onPress={() => {}}
            />
          </Section>

          {/* Logout */}
          <Motion.View
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 }}
            className="mt-2"
          >
            <Pressable
              onPress={handleLogout}
              className="bg-white rounded-3xl py-[18px] px-5 flex-row items-center justify-center gap-2 border border-stone-100 active:bg-red-50 active:border-red-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <LogOut size={20} color="#dc2626" strokeWidth={2} />
              <Text className="text-red-600 font-semibold text-[15px] tracking-tight">
                Log Out
              </Text>
            </Pressable>
          </Motion.View>

          {/* Footer */}
          <Motion.View
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 500 }}
            className="items-center justify-center pb-8 pt-4 gap-1"
          >
            <Text className="font-serif text-stone-900 font-medium tracking-wide">
              Art Memory
            </Text>
            <Text className="text-stone-400 text-xs font-medium">
              Version 1.0.0
            </Text>
          </Motion.View>
        </View>
      </ScrollView>
    </View>
  );
}
