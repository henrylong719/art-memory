/* eslint-disable better-tailwindcss/no-unknown-classes */
import { AlertCircle } from 'lucide-react-native';
import { TextInput, type TextInputProps } from 'react-native';

import { Text, View } from '@/components/ui';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  maxLength?: number;
  className?: string;
  minHeight?: number;
};

const inputShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 4,
  elevation: 1,
} as const;

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  keyboardType,
  maxLength,
  className: containerClassName,
  minHeight,
}: FormFieldProps) {
  return (
    <View className={containerClassName ?? 'gap-2'}>
      <Text className="text-[12px] font-semibold tracking-widest uppercase text-charcoal-400 ml-1">
        {label}
      </Text>
      <View
        className={`bg-white rounded-2xl border px-4 py-3.5 ${
          error ? 'border-red-300 bg-red-50/30' : 'border-neutral-200'
        }`}
        style={[inputShadow, minHeight ? { minHeight } : undefined]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#d6d3d1"
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : undefined}
          keyboardType={keyboardType}
          maxLength={maxLength}
          className={`text-[15px] text-charcoal-900 ${multiline ? 'leading-6' : ''} ${
            label === 'Title' ? 'font-medium' : ''
          }`}
        />
      </View>
      {error && (
        <View className="flex-row items-center gap-1.5 ml-1 mt-0.5">
          <AlertCircle size={12} color="#7f1d1d" strokeWidth={2.5} />
          <Text className="text-[12px] font-medium text-red-900/70">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
