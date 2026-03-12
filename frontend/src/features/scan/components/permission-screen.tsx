import { Linking, Pressable } from 'react-native';

import { Text, View } from '@/components/ui';

type PermissionScreenProps = {
  onRequestPermission: () => Promise<{ granted?: boolean } | undefined> | void;
  onPermissionDenied?: () => void;
  canAskAgain?: boolean;
  onDismissMessage?: () => void;
};

export function PermissionScreen({
  onRequestPermission,
  onPermissionDenied,
  canAskAgain = true,
  onDismissMessage,
}: PermissionScreenProps) {
  const handlePress = async () => {
    onDismissMessage?.();
    if (canAskAgain) {
      const result = await onRequestPermission();
      if (!result?.granted) {
        onPermissionDenied?.();
      }
      return;
    }

    try {
      await Linking.openSettings();
    } catch {
      onPermissionDenied?.();
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-black px-8">
      <Text className="mb-3 text-center font-serif text-2xl font-semibold text-white">
        Camera Access Required
      </Text>
      <Text className="mb-8 text-center text-sm leading-5 text-white/60">
        {canAskAgain
          ? 'ArtMemory needs camera access to scan and identify artworks.'
          : 'Camera permission is turned off. Enable it in Settings to scan and identify artworks.'}
      </Text>
      <Pressable
        onPress={handlePress}
        className="rounded-2xl bg-white px-8 py-3.5 active:bg-stone-100"
      >
        <Text className="font-semibold text-charcoal-900">
          {canAskAgain ? 'Grant Access' : 'Open Settings'}
        </Text>
      </Pressable>
    </View>
  );
}
