/* eslint-disable better-tailwindcss/no-unknown-classes */
import { AnimatePresence } from '@legendapp/motion';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { Camera, ScanText, X, Zap, ZapOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/ui';
import Toast from '@/components/ui/toast';
import { CameraControls } from '@/features/scan/components/camera-controls';
import { PermissionScreen } from '@/features/scan/components/permission-screen';
import { ProcessingOverlay } from '@/features/scan/components/processing-overlay';
import { ViewfinderOverlay } from '@/features/scan/components/viewfinder-overlay';
import { usePhysicalOrientation } from '@/features/scan/hooks/use-physical-orientation';
import {
  useFrameAnimations,
  useOrientationBounce,
  useProcessingAnimations,
} from '@/features/scan/hooks/use-scan-animations';
import { useScanFlow } from '@/features/scan/hooks/use-scan-flow';
import type { ScanType } from '@/features/scan/types';
import { useToast } from '@/lib/hooks';

export function CameraScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const scanType: ScanType =
    params.type === 'artwork_only' ? 'artwork_only' : 'combined';
  const isLandscape = screenWidth > screenHeight;

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const physicalOrientation = usePhysicalOrientation();

  const {
    cameraRef,
    step,
    artworkUri,
    artworkIsLandscape,
    processing,
    processingUri,
    errorMessage,
    isArtworkStep,
    isCombined,
    handleCapture,
    handlePickImage,
    handleBack,
    resetToArtworkStep,
    clearError,
  } = useScanFlow(scanType);

  const { frameStyle, textBounceStyle, frameScale } =
    useFrameAnimations(step);
  useOrientationBounce(physicalOrientation, frameScale);
  const { scanLineStyle, pulseStyle } = useProcessingAnimations(
    processing,
    artworkIsLandscape,
  );

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage, 'error');
      clearError();
    }
  }, [clearError, errorMessage, showToast]);

  if (!permission?.granted) {
    return (
      <>
        <AnimatePresence>
          {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
        </AnimatePresence>
        <PermissionScreen
          canAskAgain={permission?.canAskAgain}
          onDismissMessage={hideToast}
          onPermissionDenied={() =>
            showToast('Camera permission is required to continue.', 'error')
          }
          onRequestPermission={requestPermission}
        />
      </>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>

      {/* Camera feed */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        flash={flash ? 'on' : 'off'}
      />

      {/* Top controls */}
      <View
        className="absolute left-0 right-0 top-0 z-50 flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={handleBack}
          className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
          hitSlop={8}
        >
          <X size={22} color="#fff" />
        </Pressable>

        <View className="flex-row items-center gap-2 rounded-full px-4 py-2 bg-white/15">
          {isArtworkStep ? (
            <Camera size={14} color="#fff" />
          ) : (
            <ScanText size={14} color="#fff" />
          )}
          <Text className="text-xs font-semibold tracking-wider text-white">
            {isArtworkStep ? 'Scan Artwork' : 'Capture Details'}
          </Text>
        </View>

        <Pressable
          onPress={() => setFlash((f) => !f)}
          className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
          hitSlop={8}
        >
          {flash ? (
            <Zap size={20} color="#FBBF24" fill="#FBBF24" />
          ) : (
            <ZapOff size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      {/* Viewfinder */}
      <ViewfinderOverlay
        isLandscape={isLandscape}
        isArtworkStep={isArtworkStep}
        isCombined={isCombined}
        physicalOrientation={physicalOrientation}
        topInset={insets.top}
        frameStyle={frameStyle}
        textBounceStyle={textBounceStyle}
      />

      {/* Bottom controls */}
      <CameraControls
        isLandscape={isLandscape}
        isArtworkStep={isArtworkStep}
        isCombined={isCombined}
        artworkUri={artworkUri}
        processing={processing}
        bottomInset={insets.bottom}
        onCapture={() =>
          handleCapture(
            screenWidth,
            screenHeight,
            isLandscape,
            physicalOrientation,
          )
        }
        onPickImage={handlePickImage}
        onResetArtwork={resetToArtworkStep}
      />

      {/* Processing overlay */}
      <ProcessingOverlay
        visible={processing}
        imageUri={processingUri}
        isLandscape={artworkIsLandscape}
        isCombined={isCombined}
        scanLineStyle={scanLineStyle}
        pulseStyle={pulseStyle}
      />
    </View>
  );
}
