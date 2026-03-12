import { Modal, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

import { Image, View } from '@/components/ui';

type FullscreenImageModalProps = {
  visible: boolean;
  imageUrl: string | null | undefined;
  topInset: number;
  onClose: () => void;
};

export function FullscreenImageModal({
  visible,
  imageUrl,
  topInset,
  onClose,
}: FullscreenImageModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black">
        {imageUrl && (
          <Image
            source={imageUrl}
            className="h-full w-full"
            contentFit="contain"
          />
        )}
        <Pressable
          onPress={onClose}
          className="absolute h-11 w-11 items-center justify-center rounded-full"
          style={{
            top: topInset + 8,
            right: 20,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
          hitSlop={8}
        >
          <X size={22} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}
