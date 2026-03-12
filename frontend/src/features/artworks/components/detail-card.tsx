/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { ReactNode } from 'react';

import { Text, View } from '@/components/ui';

export function DetailCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="w-[48%] rounded-2xl border border-neutral-200 bg-white px-4 py-3.5">
      <View className="mb-1.5 flex-row items-center gap-1.5">
        {icon}
        <Text className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
          {label}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-charcoal-800">{value}</Text>
    </View>
  );
}
