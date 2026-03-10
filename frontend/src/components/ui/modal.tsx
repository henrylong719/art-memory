/* eslint-disable react-refresh/only-export-components */
/**
 * Modal
 * Dependencies:
 * - @gorhom/bottom-sheet.
 *
 * Props:
 * - All `BottomSheetModalProps` props.
 * - `title` (string | undefined): Optional title for the modal header.
 *
 * Usage Example:
 * import { Modal, useModal } from '@gorhom/bottom-sheet';
 *
 * function DisplayModal() {
 *   const { ref, present, dismiss } = useModal();
 *
 *   return (
 *     <View>
 *       <Modal
 *         snapPoints={['60%']} // optional
 *         title="Modal Title"
 *         ref={ref}
 *       >
 *         Modal Content
 *       </Modal>
 *     </View>
 *   );
 * }
 *
 */

import { memo, useCallback, useImperativeHandle, useMemo, useRef, type ForwardedRef } from 'react';
import type {
  BottomSheetBackdropProps,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { BottomSheetModal, useBottomSheet } from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { Text } from './text';

type ModalProps = BottomSheetModalProps & {
  title?: string;
};

type ModalRef = ForwardedRef<BottomSheetModal>;

type ModalHeaderProps = {
  title?: string;
  dismiss: () => void;
};

export function useModal() {
  const ref = useRef<BottomSheetModal>(null);
  const present = useCallback((data?: any) => {
    ref.current?.present(data);
  }, []);
  const dismiss = useCallback(() => {
    ref.current?.dismiss();
  }, []);
  return { ref, present, dismiss };
}

export function Modal({ ref, snapPoints: _snapPoints = ['60%'] as (string | number)[], title, detached = false, ...props }: ModalProps & { ref?: ModalRef }) {
  const detachedProps = useMemo(
    () => getDetachedProps(detached),
    [detached],
  );
  const modal = useModal();
  const snapPoints = useMemo(() => _snapPoints, [_snapPoints]);

  useImperativeHandle(
    ref,
    () => (modal.ref.current as BottomSheetModal) || null,
  );

  const renderHandleComponent = useCallback(
    () => (
      <>
        <View className="mt-2 mb-8 h-1 w-12 self-center rounded-lg bg-gray-400 dark:bg-gray-700" />
        <ModalHeader title={title} dismiss={modal.dismiss} />
      </>
    ),
    [title, modal.dismiss],
  );

  return (
    <BottomSheetModal
      {...props}
      {...detachedProps}
      ref={modal.ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={props.backdropComponent || renderBackdrop}
      enableDynamicSizing={false}
      handleComponent={renderHandleComponent}
    />
  );
}

/**
 * Custom Backdrop
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CustomBackdrop({ style }: BottomSheetBackdropProps) {
  const { close } = useBottomSheet();
  return (
    <AnimatedPressable
      onPress={() => close()}
      entering={FadeIn.duration(50)}
      exiting={FadeOut.duration(20)}
      style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
    />
  );
}

export function renderBackdrop(props: BottomSheetBackdropProps) {
  return <CustomBackdrop {...props} />;
}

/**
 *
 * @param detached
 * @returns
 *
 * @description
 * In case the modal is detached, we need to add some extra props to the modal to make it look like a detached modal.
 */

function getDetachedProps(detached: boolean) {
  if (detached) {
    return {
      detached: true,
      bottomInset: 46,
      style: { marginHorizontal: 16, overflow: 'hidden' },
    } as Partial<BottomSheetModalProps>;
  }
  return {} as Partial<BottomSheetModalProps>;
}

/**
 * ModalHeader
 */

const ModalHeader = memo(({ title, dismiss }: ModalHeaderProps) => {
  return (
    <>
      {title && (
        <View className="flex-row px-2 py-4">
          <View className="size-6" />
          <View className="flex-1">
            <Text className="text-center text-[16px] font-bold text-[#26313D] dark:text-white">
              {title}
            </Text>
          </View>
        </View>
      )}
      <CloseButton close={dismiss} />
    </>
  );
});

function CloseButton({ close }: { close: () => void }) {
  const { theme } = useUniwind();
  const color = theme === 'dark' ? '#ffffff' : '#a8a29e';
  return (
    <Pressable
      onPress={close}
      className="absolute top-3 right-3 size-6 items-center justify-center"
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      accessibilityLabel="close modal"
      accessibilityRole="button"
      accessibilityHint="closes the modal"
    >
      <X size={20} color={color} />
    </Pressable>
  );
}
