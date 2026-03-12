import type { ReactNode } from 'react';

import { Text, View } from '@/components/ui';

export function TagPill({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2">
      {icon}
      <Text className="text-sm font-semibold text-charcoal-700">{label}</Text>
    </View>
  );
}
