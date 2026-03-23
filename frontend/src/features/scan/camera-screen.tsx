import type { StyleProp, ViewStyle } from 'react-native';
import type { ScanType } from '@/features/scan/types';
import { AnimatePresence } from '@legendapp/motion';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { Camera, ScanText, X, Zap, ZapOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/ui';
import Toast from '@/components/ui/toast';
import { CameraControls } from '@/features/scan/components/camera-controls';
import { PermissionScreen } from '@/features/scan/components/permission-screen';
import { ProcessingOverlay } from '@/features/scan/components/processing-overlay';
import { ViewfinderOverlay } from '@/features/scan/components/viewfinder-overlay';
import { useCameraZoom } from '@/features/scan/hooks/use-camera-zoom';
import { usePhysicalOrientation } from '@/features/scan/hooks/use-physical-orientation';
import {
  useFrameAnimations,
  useOrientationBounce,
  useProcessingAnimations,
} from '@/features/scan/hooks/use-scan-animations';
import { useScanFlow } from '@/features/scan/hooks/use-scan-flow';
import { useToast } from '@/lib/hooks';

const AnimatedCameraView = Animated.createAnimatedComponent(CameraView);

type CameraTopControlsProps = {
  flash: boolean;
  isArtworkStep: boolean;
  onBack: () => void;
  onToggleFlash: () => void;
  topInset: number;
};

type CameraZoomIndicatorProps = {
  style?: StyleProp<ViewStyle>;
  topInset: number;
  zoomFactor: number;
};

type CameraPermissionFallbackProps = {
  canAskAgain: boolean | undefined;
  hideToast: () => void;
  onPermissionDenied: () => void;
  onRequestPermission: () => void;
  toast: ReturnType<typeof useToast>['toast'];
};

type CameraScreenContentProps = {
  animatedCameraProps: object;
  artworkIsLandscape: boolean;
  artworkUri: string | null;
  bottomInset: number;
  cameraGesture: ReturnType<typeof useCameraZoom>['cameraGesture'];
  cameraRef: ReturnType<typeof useScanFlow>['cameraRef'];
  flash: boolean;
  frameStyle: ReturnType<typeof useFrameAnimations>['frameStyle'];
  handleBack: () => void;
  handleCapture: () => void;
  handlePickImage: () => void;
  insetsTop: number;
  isArtworkStep: boolean;
  isCombined: boolean;
  isLandscape: boolean;
  physicalOrientation: ReturnType<typeof usePhysicalOrientation>;
  processing: boolean;
  processingUri: string | null;
  pulseStyle: ReturnType<typeof useProcessingAnimations>['pulseStyle'];
  resetToArtworkStep: () => void;
  scanLineStyle: ReturnType<typeof useProcessingAnimations>['scanLineStyle'];
  setFlash: React.Dispatch<React.SetStateAction<boolean>>;
  textBounceStyle: ReturnType<typeof useFrameAnimations>['textBounceStyle'];
  zoomFactor: number;
  zoomIndicatorStyle: StyleProp<ViewStyle>;
};

function CameraTopControls({
  flash,
  isArtworkStep,
  onBack,
  onToggleFlash,
  topInset,
}: CameraTopControlsProps) {
  return (
    <View
      className="absolute inset-x-0 top-0 z-50 flex-row items-center justify-between px-5"
      style={{ paddingTop: topInset + 8 }}
    >
      <Pressable
        onPress={onBack}
        className="size-11 items-center justify-center rounded-full bg-white/15"
        hitSlop={8}
      >
        <X size={22} color="#fff" />
      </Pressable>

      <View className="flex-row items-center gap-2 rounded-full bg-white/15 px-4 py-2">
        {
          isArtworkStep
            ? <Camera size={14} color="#fff" />
            : <ScanText size={14} color="#fff" />
        }
        <Text className="text-xs font-semibold tracking-wider text-white">
          {isArtworkStep ? 'Scan Artwork' : 'Capture Details'}
        </Text>
      </View>

      <Pressable
        onPress={onToggleFlash}
        className="size-11 items-center justify-center rounded-full bg-white/15"
        hitSlop={8}
      >
        {
          flash
            ? <Zap size={20} color="#FBBF24" fill="#FBBF24" />
            : <ZapOff size={20} color="#fff" />
        }
      </Pressable>
    </View>
  );
}

function CameraZoomIndicator({
  style,
  topInset,
  zoomFactor,
}: CameraZoomIndicatorProps) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          alignSelf: 'center',
          top: topInset + 52,
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        style,
      ]}
    >
      <Text className="text-xs font-semibold text-white">
        {`${zoomFactor.toFixed(1)}x`}
      </Text>
    </Animated.View>
  );
}

function CameraPermissionFallback({
  canAskAgain,
  hideToast,
  onPermissionDenied,
  onRequestPermission,
  toast,
}: CameraPermissionFallbackProps) {
  return (
    <>
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>
      <PermissionScreen
        canAskAgain={canAskAgain}
        onDismissMessage={hideToast}
        onPermissionDenied={onPermissionDenied}
        onRequestPermission={onRequestPermission}
      />
    </>
  );
}

function CameraScreenContent({
  animatedCameraProps,
  artworkIsLandscape,
  artworkUri,
  bottomInset,
  cameraGesture,
  cameraRef,
  flash,
  frameStyle,
  handleBack,
  handleCapture,
  handlePickImage,
  insetsTop,
  isArtworkStep,
  isCombined,
  isLandscape,
  physicalOrientation,
  processing,
  processingUri,
  pulseStyle,
  resetToArtworkStep,
  scanLineStyle,
  setFlash,
  textBounceStyle,
  zoomFactor,
  zoomIndicatorStyle,
}: CameraScreenContentProps) {
  return (
    <View className="flex-1 bg-black">
      {/* Camera feed with pinch-to-zoom */}
      <GestureDetector gesture={cameraGesture}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <AnimatedCameraView
            ref={cameraRef}
            animatedProps={animatedCameraProps}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            flash={flash ? 'on' : 'off'}
          />
        </Animated.View>
      </GestureDetector>

      <CameraZoomIndicator
        topInset={insetsTop}
        zoomFactor={zoomFactor}
        style={zoomIndicatorStyle}
      />

      <CameraTopControls
        flash={flash}
        isArtworkStep={isArtworkStep}
        onBack={handleBack}
        onToggleFlash={() => setFlash(value => !value)}
        topInset={insetsTop}
      />

      <ViewfinderOverlay
        isLandscape={isLandscape}
        isArtworkStep={isArtworkStep}
        isCombined={isCombined}
        physicalOrientation={physicalOrientation}
        topInset={insetsTop}
        frameStyle={frameStyle}
        textBounceStyle={textBounceStyle}
      />

      <CameraControls
        isLandscape={isLandscape}
        isArtworkStep={isArtworkStep}
        isCombined={isCombined}
        artworkUri={artworkUri}
        processing={processing}
        bottomInset={bottomInset}
        onCapture={handleCapture}
        onPickImage={handlePickImage}
        onResetArtwork={resetToArtworkStep}
      />

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

export function CameraScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const scanType: ScanType
    = params.type === 'artwork_only' ? 'artwork_only' : 'combined';
  const isLandscape = screenWidth > screenHeight;

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { animatedCameraProps, cameraGesture, zoomFactor, zoomIndicatorStyle } = useCameraZoom();

  const physicalOrientation = usePhysicalOrientation();

  const { cameraRef, step, artworkUri, artworkIsLandscape, processing, processingUri, errorMessage, isArtworkStep, isCombined, handleCapture, handlePickImage, handleBack, resetToArtworkStep, clearError } = useScanFlow(scanType);

  const { frameStyle, textBounceStyle, frameScale } = useFrameAnimations(step);
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
      <CameraPermissionFallback
        canAskAgain={permission?.canAskAgain}
        hideToast={hideToast}
        onPermissionDenied={() => {
          showToast('Camera permission is required to continue.', 'error');
        }}
        onRequestPermission={requestPermission}
        toast={toast}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {toast.visible && <Toast text={toast.text} variant={toast.variant} />}
      </AnimatePresence>
      <CameraScreenContent
        animatedCameraProps={animatedCameraProps}
        artworkIsLandscape={artworkIsLandscape}
        artworkUri={artworkUri}
        bottomInset={insets.bottom}
        cameraGesture={cameraGesture}
        cameraRef={cameraRef}
        flash={flash}
        frameStyle={frameStyle}
        handleBack={handleBack}
        handleCapture={() => {
          handleCapture(
            screenWidth,
            screenHeight,
            isLandscape,
            physicalOrientation,
          );
        }}
        handlePickImage={handlePickImage}
        insetsTop={insets.top}
        isArtworkStep={isArtworkStep}
        isCombined={isCombined}
        isLandscape={isLandscape}
        physicalOrientation={physicalOrientation}
        processing={processing}
        processingUri={processingUri}
        pulseStyle={pulseStyle}
        resetToArtworkStep={resetToArtworkStep}
        scanLineStyle={scanLineStyle}
        setFlash={setFlash}
        textBounceStyle={textBounceStyle}
        zoomFactor={zoomFactor}
        zoomIndicatorStyle={zoomIndicatorStyle}
      />
    </>
  );
}
