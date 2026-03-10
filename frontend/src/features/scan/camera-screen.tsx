/* eslint-disable better-tailwindcss/no-unknown-classes */

import { Motion, AnimatePresence } from '@legendapp/motion';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ScanText, X, Zap, ZapOff } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image, Text, View } from '@/components/ui';
import { useScanArtwork, useScanCombined } from '@/lib/hooks';

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

// ─── Main Screen ─────────────────────────────────────────
export function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string; step?: string }>();

  const scanType: ScanType =
    params.type === 'artwork_only' ? 'artwork_only' : 'combined';
  const [step, setStep] = React.useState<Step>(
    (params.step as Step) || 'artwork',
  );

  const cameraRef = React.useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = React.useState(false);

  // Captured URIs
  const [artworkUri, setArtworkUri] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  // Scan mutations
  const scanArtwork = useScanArtwork();
  const scanCombined = useScanCombined();

  const isArtworkStep = step === 'artwork';
  const isCombined = scanType === 'combined';

  // ── Permissions ──
  React.useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // ── Location (best effort) ──
  const getLocation = React.useCallback(async () => {
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
  const processScan = React.useCallback(
    async (artUri: string, labelUri?: string) => {
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
          router.replace('/scan/fallback');
        }
      } catch {
        router.replace('/scan/fallback');
      }
    },
    [isCombined, scanCombined, scanArtwork, getLocation, router],
  );

  // ── Capture photo ──
  const handleCapture = React.useCallback(async () => {
    if (!cameraRef.current || processing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      skipProcessing: false,
    });

    if (!photo?.uri) return;

    if (isCombined && isArtworkStep) {
      setArtworkUri(photo.uri);
      setStep('details');
    } else if (isCombined && !isArtworkStep && artworkUri) {
      await processScan(artworkUri, photo.uri);
    } else {
      await processScan(photo.uri);
    }
  }, [processing, isCombined, isArtworkStep, artworkUri, processScan]);

  // ── Back ──
  const handleBack = () => {
    if (isCombined && !isArtworkStep) {
      setStep('artwork');
      setArtworkUri(null);
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
        className="absolute inset-0"
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
          className="w-11 h-11 bg-white/15 rounded-full items-center justify-center"
          hitSlop={8}
        >
          <X size={22} color="#fff" />
        </Pressable>

        {/* Mode badge */}
        <View className="bg-white/15 px-4 py-2 rounded-full flex-row items-center gap-2">
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
          className="w-11 h-11 bg-white/15 rounded-full items-center justify-center"
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
      <View className="flex-1 items-center justify-center" pointerEvents="none">
        {/* Dimmed area around frame */}
        <View className="absolute inset-0 bg-black/40" />

        {/* Frame cutout */}
        <Motion.View
          key={step}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className={`relative border-2 border-white/45 rounded-xl ${
            isArtworkStep ? 'w-[75%] aspect-[3/4]' : 'w-[85%] aspect-[4/5]'
          }`}
        >
          <CornerMarker position="tl" />
          <CornerMarker position="tr" />
          <CornerMarker position="bl" />
          <CornerMarker position="br" />
        </Motion.View>

        {/* Step indicator for combined mode */}
        {isCombined && (
          <View
            className="absolute items-center"
            style={{ top: insets.top + 64 }}
          >
            <View className="flex-row gap-2">
              <View
                className={`w-2 h-2 rounded-full ${
                  isArtworkStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
              <View
                className={`w-2 h-2 rounded-full ${
                  !isArtworkStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            </View>
          </View>
        )}

        {/* Instruction prompt */}
        <View className="absolute bottom-36 left-0 right-0 items-center px-8">
          <Motion.View
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            className="bg-black/55 px-5 py-2.5 rounded-full"
          >
            <Text className="text-white text-sm font-semibold tracking-wide text-center">
              {isArtworkStep
                ? 'Center the artwork in the frame'
                : 'Capture the label or wall text clearly'}
            </Text>
          </Motion.View>
        </View>
      </View>

      {/* ── Bottom controls ── */}
      <View
        className="h-36 bg-black items-center justify-center border-t border-white/10"
        style={{ paddingBottom: insets.bottom }}
      >
        {/* Artwork preview thumbnail (shows during details step) */}
        {!isArtworkStep && artworkUri && (
          <Animated.View
            entering={ZoomIn.duration(250)}
            className="absolute left-6 top-0 bottom-0 justify-center"
          >
            <View className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/30">
              <Image
                source={artworkUri}
                className="w-full h-full"
                contentFit="cover"
              />
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
            className="absolute inset-0 z-[100] bg-charcoal-950 items-center justify-center"
          >
            {/* Preview image */}
            <View className="w-64 aspect-[3/4] rounded-2xl overflow-hidden mb-8">
              {artworkUri && (
                <Image
                  source={artworkUri}
                  className="w-full h-full opacity-70"
                  contentFit="cover"
                />
              )}
              <View className="absolute inset-0 bg-charcoal-900/40" />
              {/* Scan line animation */}
              <Motion.View
                animate={{ y: [0, 320, 0] }}
                transition={{
                  type: 'timing',
                  duration: 2000,
                  loop: true,
                }}
                className="absolute top-0 left-0 right-0 h-0.5 bg-white"
                style={{
                  shadowColor: '#fff',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 15,
                }}
              />
              {/* Spinner */}
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="large" color="#fff" />
              </View>
            </View>

            <Motion.View
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ type: 'timing', duration: 1500, loop: true }}
            >
              <Text className="font-serif text-xl text-white tracking-wide">
                {isCombined
                  ? 'Analyzing artwork & details...'
                  : 'Identifying artwork...'}
              </Text>
            </Motion.View>
          </Motion.View>
        )}
      </AnimatePresence>
    </View>
  );
}
