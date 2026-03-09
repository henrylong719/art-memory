import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { Pressable, Text, View } from '@/components/ui';
import { ChevronRight } from 'lucide-react-native';

type ItemProps = {
  text: TxKeyPath;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export function SettingsItem({ text, value, icon, onPress }: ItemProps) {
  const isPressable = onPress !== undefined;
  return (
    <Pressable
      onPress={onPress}
      pointerEvents={isPressable ? 'auto' : 'none'}
      className="flex-1 flex-row items-center justify-between px-4 py-2"
    >
      <View className="flex-row items-center">
        {icon && <View className="pr-2">{icon}</View>}
        <Text tx={text} />
      </View>
      <View className="flex-row items-center">
        <Text className="text-neutral-600 dark:text-white">{value}</Text>
        {isPressable && (
          <View className="pl-2">
            <ChevronRight size={16} color="#a8a29e" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
