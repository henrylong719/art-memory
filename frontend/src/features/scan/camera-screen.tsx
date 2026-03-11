/* eslint-disable better-tailwindcss/no-unknown-classes */

import { Motion, AnimatePresence } from '@legendapp/motion';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ScanText, X, Zap, ZapOff } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image as RNImage,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import { useScanArtwork, useScanCombined } from '@/lib/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────
type ScanType = 'combined' | 'artwork_only';
type Step = 'artwork' | 'details';

// ─── Corner Marker ───────────────────────────────────────
function CornerMarker({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const positionClasses = {
    tl: '-top-px -left-px border-t-4 border-l-4 rounded-tl-sm',
    tr: '-top-px -right-px border-t-4 border-r-4 rounded-tr-sm',
    bl: '-bottom-px -left-px border-b-4 border-l-4 rounded-bl-sm',
    br: '-bottom-px -right-px border-b-4 border-r-4 rounded-br-sm',
  };

  return (
    <View
      className={`absolute w-6 h-6 border-white ${positionClasses[position]}`}
    />
  );
}

// ─── Crop photo to viewfinder frame ──────────────────────
const BAR_HEIGHT_PORTRAIT = 144; // h-36
const BAR_HEIGHT_LANDSCAPE = 96; // h-24

async function cropToFrame(
  uri: string,
  _rawW: number,
  _rawH: number,
  screenW: number,
  screenH: number,
  frameWidthFraction: number,
  frameAspectWH: number,
): Promise<{ uri: string; isLandscape: boolean }> {
  // First pass: force EXIF orientation normalization by applying a no-op
  // rotation. rotate(0) forces the image through the pipeline, baking
  // EXIF rotation into pixels.
  const normalizedRef = await ImageManipulator.manipulate(uri)
    .rotate(0)
    .renderAsync();
  const normalized = await normalizedRef.saveAsync({
    format: SaveFormat.JPEG,
    compress: 1,
  });
  const photoW = normalizedRef.width;
  const photoH = normalizedRef.height;

  const screenIsPortrait = screenH > screenW;
  const bottomBarH = screenIsPortrait
    ? BAR_HEIGHT_PORTRAIT
    : BAR_HEIGHT_LANDSCAPE;

  // Frame size on screen
  const frameScreenW = screenW * frameWidthFraction;
  const frameScreenH = frameScreenW / frameAspectWH;

  // Frame position – centred in the viewfinder area (screen minus bottom bar),
  // shifted down by 40px (paddingTop on the overlay container)
  const FRAME_OFFSET_Y = 40;
  const viewfinderH = screenH - bottomBarH;
  const frameScreenX = (screenW - frameScreenW) / 2;
  const frameScreenY = (viewfinderH - frameScreenH) / 2 + FRAME_OFFSET_Y / 2;

  // Camera preview uses "cover" scaling
  const scale = Math.max(screenW / photoW, screenH / photoH);
  const offsetX = (photoW * scale - screenW) / 2;
  const offsetY = (photoH * scale - screenH) / 2;

  // Map frame screen rect → photo pixel rect
  const originX = Math.max(0, Math.round((frameScreenX + offsetX) / scale));
  const originY = Math.max(0, Math.round((frameScreenY + offsetY) / scale));
  const width = Math.min(Math.round(frameScreenW / scale), photoW - originX);
  const height = Math.min(Math.round(frameScreenH / scale), photoH - originY);

  // Second pass: crop the EXIF-normalized image
  const croppedRef = await ImageManipulator.manipulate(normalized.uri)
    .crop({ originX, originY, width, height })
    .renderAsync();
  const result = await croppedRef.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.85,
  });

  return { uri: result.uri, isLandscape: croppedRef.width > croppedRef.height };
}

// ─── Main Screen ─────────────────────────────────────────
export function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string; step?: string }>();

  const scanType: ScanType =
    params.type === 'artwork_only' ? 'artwork_only' : 'combined';
  const [step, setStep] = useState<Step>((params.step as Step) || 'artwork');

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isLandscape = screenWidth > screenHeight;

  // Detect physical device tilt via accelerometer (app is portrait-locked).
  // 'portrait' | 'landscape-left' | 'landscape-right'
  type PhysicalOrientation = 'portrait' | 'landscape-left' | 'landscape-right';
  const [physicalOrientation, setPhysicalOrientation] =
    useState<PhysicalOrientation>('portrait');
  useEffect(() => {
    Accelerometer.setUpdateInterval(300);
    const subscription = Accelerometer.addListener(({ x, y }) => {
      if (Math.abs(x) > Math.abs(y) + 0.15) {
        // Phone tilted sideways
        setPhysicalOrientation(x > 0 ? 'landscape-right' : 'landscape-left');
      } else {
        setPhysicalOrientation('portrait');
      }
    });
    return () => subscription.remove();
  }, []);

  // Captured URIs
  const [artworkUri, setArtworkUri] = useState<string | null>(null);
  const [artworkIsLandscape, setArtworkIsLandscape] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingUri, setProcessingUri] = useState<string | null>(null);

  // Frame bounce animation
  const frameScale = useSharedValue(0.75);
  const frameOpacity = useSharedValue(0);
  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: frameScale.value }],
    opacity: frameOpacity.value,
  }));

  // Instruction text bounce animation
  const textTranslateY = useSharedValue(18);
  const textOpacity = useSharedValue(0);
  const textBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const isFirstMount = useRef(true);

  useEffect(() => {
    // Delay on first mount so animation plays after screen transition
    const delay = isFirstMount.current ? 400 : 0;
    isFirstMount.current = false;

    // Text bounces up first, then the frame follows
    textTranslateY.value = 18;
    textOpacity.value = 0;
    textTranslateY.value = withDelay(
      delay,
      withSpring(0, { damping: 16, stiffness: 120, mass: 0.8 }),
    );
    textOpacity.value = withDelay(delay, withTiming(1, { duration: 250 }));

    frameScale.value = 0.55;
    frameOpacity.value = 0;
    frameScale.value = withDelay(
      delay + 200,
      withSpring(1, { damping: 10, stiffness: 120, mass: 1 }),
    );
    frameOpacity.value = withDelay(
      delay + 200,
      withTiming(1, { duration: 200 }),
    );
  }, [step, frameScale, frameOpacity, textTranslateY, textOpacity]);

  // Bounce the frame when physical orientation changes
  const prevOrientation = useRef(physicalOrientation);
  useEffect(() => {
    if (prevOrientation.current === physicalOrientation) return;
    prevOrientation.current = physicalOrientation;

    frameScale.value = 0.82;
    frameScale.value = withSpring(1, {
      damping: 10,
      stiffness: 130,
      mass: 0.8,
    });
  }, [physicalOrientation, frameScale]);

  // Scan line animation (replaces @legendapp/motion keyframe array)
  const scanLineY = useSharedValue(0);
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));
  const pulseOpacity = useSharedValue(0.5);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const scanLineDistance = artworkIsLandscape ? 200 : 320;

  useEffect(() => {
    if (processing) {
      scanLineY.value = 0;
      scanLineY.value = withRepeat(
        withSequence(
          withTiming(scanLineDistance, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 750 }),
          withTiming(0.5, { duration: 750 }),
        ),
        -1,
        false,
      );
    }
  }, [processing, scanLineY, pulseOpacity, scanLineDistance]);

  // Scan mutations
  const scanArtwork = useScanArtwork();
  const scanCombined = useScanCombined();

  const isArtworkStep = step === 'artwork';
  const isCombined = scanType === 'combined';

  // ── Permissions ──
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // ── Location (best effort) ──
  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return undefined;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
      return undefined;
    }
  }, []);

  // ── Build file object for FormData ──
  const toFilePayload = (uri: string) => ({
    uri,
    type: 'image/jpeg',
    name: `scan-${Date.now()}.jpg`,
  });

  // ── Process scan (hit API) ──
  const processScan = useCallback(
    async (artUri: string, labelUri?: string) => {
      setProcessingUri(artUri);
      setProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const location = await getLocation();

      try {
        let scanResult;

        if (isCombined && labelUri) {
          scanResult = await scanCombined.mutateAsync({
            artworkFile: toFilePayload(artUri),
            labelFile: toFilePayload(labelUri),
            location,
          });
        } else {
          scanResult = await scanArtwork.mutateAsync({
            imageFile: toFilePayload(artUri),
            location,
          });
        }

        if (scanResult.artworkId) {
          router.replace({
            pathname: '/scan/result',
            params: { id: scanResult.artworkId },
          });
        } else {
          router.replace({
            pathname: '/scan/fallback',
            params: {
              imageUri: artUri,
              scanImageUrl: scanResult.imageUrl,
              scanId: scanResult.id,
            },
          });
        }
      } catch {
        router.replace({
          pathname: '/scan/fallback',
          params: { imageUri: artUri },
        });
      }
    },
    [isCombined, scanCombined, scanArtwork, getLocation, router],
  );

  // ── Capture photo ──
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || processing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      skipProcessing: true,
    });

    if (!photo?.uri) return;

    // Crop to the viewfinder frame area.
    // In landscape the frame flips to a wide aspect ratio (4:3) sized by
    // height percentage, so we need to compute the equivalent width fraction.
    let frameWidthFraction: number;
    let frameAspect: number;

    if (isLandscape) {
      const bottomBarH = 96; // h-24 in landscape
      const viewfinderH = screenHeight - bottomBarH;
      const heightPct = 0.85;
      const frameH = viewfinderH * heightPct;
      const frameW = frameH * (4 / 3);
      frameWidthFraction = frameW / screenWidth;
      frameAspect = 4 / 3;
    } else {
      frameWidthFraction = isArtworkStep ? 0.85 : 0.9;
      frameAspect = isArtworkStep ? 3 / 4 : 4 / 5;
    }

    let croppedUri: string;
    let photoIsLandscape = false;
    try {
      const cropped = await cropToFrame(
        photo.uri,
        photo.width,
        photo.height,
        screenWidth,
        screenHeight,
        frameWidthFraction,
        frameAspect,
      );
      croppedUri = cropped.uri;
      photoIsLandscape = cropped.isLandscape;
    } catch {
      croppedUri = photo.uri;
      photoIsLandscape = (photo.width ?? 0) > (photo.height ?? 0);
    }

    if (isCombined && isArtworkStep) {
      setArtworkUri(croppedUri);
      setArtworkIsLandscape(photoIsLandscape);
      setStep('details');
    } else if (isCombined && !isArtworkStep && artworkUri) {
      await processScan(artworkUri, croppedUri);
    } else {
      setArtworkIsLandscape(photoIsLandscape);
      await processScan(croppedUri);
    }
  }, [
    processing,
    isCombined,
    isArtworkStep,
    artworkUri,
    processScan,
    screenWidth,
    screenHeight,
  ]);

  // ── Back ──
  const handleBack = () => {
    if (isCombined && !isArtworkStep) {
      setStep('artwork');
      setArtworkUri(null);
      setArtworkIsLandscape(false);
    } else {
      router.back();
    }
  };

  // ── Permission not granted ──
  if (!permission?.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Text className="font-serif text-2xl font-semibold text-white text-center mb-3">
          Camera Access Required
        </Text>
        <Text className="text-white/60 text-center text-sm mb-8 leading-5">
          ArtMemory needs camera access to scan and identify artworks.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-white px-8 py-3.5 rounded-2xl"
        >
          <Text className="font-semibold text-charcoal-900">Grant Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* ── Camera feed ── */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        flash={flash ? 'on' : 'off'}
      />

      {/* ── Top controls ── */}
      <View
        className="absolute top-0 left-0 right-0 z-50 flex-row justify-between items-center px-5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={handleBack}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          hitSlop={8}
        >
          <X size={22} color="#fff" />
        </Pressable>

        {/* Mode badge */}
        <View
          className="px-4 py-2 rounded-full flex-row items-center gap-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          {isArtworkStep ? (
            <Camera size={14} color="#fff" />
          ) : (
            <ScanText size={14} color="#fff" />
          )}
          <Text className="text-white text-xs font-semibold tracking-wider">
            {isArtworkStep ? 'Scan Artwork' : 'Capture Details'}
          </Text>
        </View>

        <Pressable
          onPress={() => setFlash((f) => !f)}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          hitSlop={8}
        >
          {flash ? (
            <Zap size={20} color="#FBBF24" fill="#FBBF24" />
          ) : (
            <ZapOff size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      {/* ── Viewfinder overlay ── */}
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: 40 }}
        pointerEvents="none"
      >
        {/* Dimmed area around frame */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Dimmed area around frame */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Frame cutout */}
        <Animated.View
          className={`relative border-2 rounded-xl ${
            isLandscape
              ? isArtworkStep
                ? 'h-[85%] aspect-4/3'
                : 'h-[85%] aspect-4/3'
              : isArtworkStep
                ? 'w-[85%] aspect-3/4'
                : 'w-[90%] aspect-4/5'
          }`}
          style={[frameStyle, { borderColor: 'rgba(255,255,255,0.45)' }]}
        >
          <CornerMarker position="tl" />
          <CornerMarker position="tr" />
          <CornerMarker position="bl" />
          <CornerMarker position="br" />

          {/* Instruction text – always at the visual bottom of the frame.
               Portrait: text sits at the bottom edge, centered horizontally.
               Landscape-left/right: text moves to the side edge that is the
               "visual bottom" and rotates so it reads correctly. */}
          <View
            style={
              physicalOrientation === 'portrait'
                ? styles.instructionPortrait
                : physicalOrientation === 'landscape-left'
                  ? styles.instructionLandscapeLeft
                  : styles.instructionLandscapeRight
            }
          >
            <View
              style={
                physicalOrientation === 'portrait'
                  ? undefined
                  : physicalOrientation === 'landscape-left'
                    ? styles.rotateCW
                    : styles.rotateCCW
              }
            >
              <Animated.View
                style={[
                  textBounceStyle,
                  {
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 9999,
                  },
                ]}
              >
                <Text className="text-white text-sm font-semibold tracking-wide text-center">
                  {isArtworkStep
                    ? 'Center the artwork in the frame'
                    : 'Capture the label or wall text clearly'}
                </Text>
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* Step indicator for combined mode */}
        {isCombined && (
          <View
            className="absolute items-center"
            style={{ top: insets.top + 64 }}
          >
            <View className="flex-row gap-2">
              <View
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isArtworkStep
                    ? '#fff'
                    : 'rgba(255,255,255,0.3)',
                }}
              />
              <View
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: !isArtworkStep
                    ? '#fff'
                    : 'rgba(255,255,255,0.3)',
                }}
              />
            </View>
          </View>
        )}
      </View>

      {/* ── Bottom controls ── */}
      <View
        className={`${isLandscape ? 'h-24' : 'h-36'} bg-black items-center justify-center border-t border-white/10`}
        style={{ paddingBottom: insets.bottom }}
      >
        {/* Artwork preview thumbnail (shows during details step) */}
        {!isArtworkStep && artworkUri && (
          <Animated.View
            entering={ZoomIn.duration(250)}
            className="absolute left-6 top-0 bottom-0 justify-center"
          >
            <View className="relative">
              <View
                className="w-14 h-14 rounded-xl overflow-hidden border-2"
                style={{ borderColor: 'rgba(255,255,255,0.3)' }}
              >
                <Image
                  source={artworkUri}
                  className="w-full h-full"
                  contentFit="cover"
                />
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setArtworkUri(null);
                  setArtworkIsLandscape(false);
                  setStep('artwork');
                }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                hitSlop={6}
              >
                <X size={12} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Shutter button */}
        <Pressable
          onPress={handleCapture}
          disabled={processing}
          className={`w-20 h-20 rounded-full items-center justify-center p-[3px] border-[3px] ${
            !isArtworkStep && isCombined
              ? 'border-warning-400'
              : 'border-neutral-300'
          }`}
        >
          <View className="w-full h-full bg-white rounded-full" />
        </Pressable>
      </View>

      {/* ── Processing overlay ── */}
      <AnimatePresence>
        {processing && (
          <Motion.View
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 250 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              backgroundColor: '#2E2E2E',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Blurred image card */}
            <View
              style={{
                width: artworkIsLandscape ? 300 : 260,
                aspectRatio: artworkIsLandscape ? 4 / 3 : 3 / 4,
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 28,
              }}
            >
              {processingUri && (
                <RNImage
                  source={{ uri: processingUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  blurRadius={20}
                />
              )}
              {/* Scrim */}
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                }}
              />
              {/* Scan line */}
              <Animated.View
                style={[
                  scanLineStyle,
                  {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    shadowColor: '#fff',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                  },
                ]}
              />
              {/* Spinner */}
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator size="large" color="#fff" />
              </View>
            </View>

            <Animated.View style={pulseStyle}>
              <Text className="font-serif text-xl text-white tracking-wide">
                {isCombined
                  ? 'Analyzing artwork & details...'
                  : 'Identifying artwork...'}
              </Text>
            </Animated.View>
          </Motion.View>
        )}
      </AnimatePresence>
    </View>
  );
}

// ─── Instruction text position styles ─────────────────────
const styles = StyleSheet.create({
  // Portrait: centered at the bottom of the frame
  instructionPortrait: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Landscape-left (top of phone points left): visual bottom = portrait left edge
  instructionLandscapeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 16,
    justifyContent: 'center',
  },
  // Landscape-right (top of phone points right): visual bottom = portrait right edge
  instructionLandscapeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 16,
    justifyContent: 'center',
  },
  // Rotation wrappers so text reads correctly when sideways
  rotateCW: { transform: [{ rotate: '90deg' }] },
  rotateCCW: { transform: [{ rotate: '-90deg' }] },
});
