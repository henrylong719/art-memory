/* eslint-disable better-tailwindcss/no-unknown-classes */
import { ActivityIndicator, Modal, Pressable } from 'react-native';

import { Text, View } from '@/components/ui';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  description,
  confirmLabel,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center justify-center bg-charcoal-900/40 px-6"
      >
        <Pressable
          onPress={() => {}}
          className="w-full max-w-[320px] items-center rounded-4xl bg-white p-7"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <Text className="mb-3 text-center font-serif text-2xl font-medium text-charcoal-900">
            {title}
          </Text>
          <Text className="mb-8 text-center text-[15px] leading-6 text-charcoal-400">
            {description}
          </Text>
          <View className="w-full gap-3">
            <Pressable
              onPress={onConfirm}
              disabled={isPending}
              className="w-full items-center rounded-2xl bg-red-50 py-4 active:bg-red-100"
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text className="text-[15px] font-semibold text-red-600">
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={onCancel}
              className="w-full items-center rounded-2xl bg-charcoal-50 py-4 active:bg-charcoal-100"
            >
              <Text className="text-[15px] font-semibold text-charcoal-700">
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
