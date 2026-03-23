import { useCallback, useRef, useState } from 'react';
import type { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';

import type {
  PhysicalOrientation,
  ScanType,
  Step,
} from '@/features/scan/types';
import { cropToFrame } from '@/features/scan/utils/crop-to-frame';
import { useScanArtwork, useScanCombined } from '@/lib/hooks';
import { getErrorMessage } from '@/lib/utils';

type FilePayload = { uri: string; type: string; name: string };

function toFilePayload(uri: string): FilePayload {
  return { uri, type: 'image/jpeg', name: `scan-${Date.now()}.jpg` };
}

async function getLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return undefined;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    return undefined;
  }
}

export function useScanFlow(scanType: ScanType) {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<Step>('artwork');
  const [artworkUri, setArtworkUri] = useState<string | null>(null);
  const [artworkIsLandscape, setArtworkIsLandscape] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingUri, setProcessingUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scanArtwork = useScanArtwork();
  const scanCombined = useScanCombined();

  const isArtworkStep = step === 'artwork';
  const isCombined = scanType === 'combined';

  const processScan = useCallback(
    async (artUri: string, labelUri?: string) => {
      setProcessingUri(artUri);
      setProcessing(true);
      setErrorMessage(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Let the processing overlay render before starting heavy work
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

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
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Couldn't scan the artwork. Please try again.",
          ),
        );
        setProcessing(false);
        setProcessingUri(null);
      }
    },
    [isCombined, router, scanArtwork, scanCombined],
  );

  const handleCapture = useCallback(
    async (
      screenWidth: number,
      screenHeight: number,
      isLandscape: boolean,
      physicalOrientation: PhysicalOrientation,
    ) => {
      if (!cameraRef.current || processing) return;
      setErrorMessage(null);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      let photo;
      try {
        photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Couldn't capture the photo. Please try again.",
          ),
        );
        return;
      }
      if (!photo?.uri) {
        setErrorMessage("Couldn't capture the photo. Please try again.");
        return;
      }

      // Save original photo to camera roll
      MediaLibrary.requestPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          MediaLibrary.saveToLibraryAsync(photo.uri);
        }
      });

      let frameWidthFraction: number;
      let frameAspect: number;

      if (isLandscape) {
        const bottomBarH = 96;
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
          physicalOrientation,
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
    },
    [artworkUri, isArtworkStep, isCombined, processScan, processing],
  );

  const handlePickImage = useCallback(async () => {
    if (processing) return;
    setErrorMessage(null);

    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Couldn't open your photo library. Please try again.",
        ),
      );
      return;
    }

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const pickedIsLandscape = (asset.width ?? 0) > (asset.height ?? 0);

    if (isCombined && isArtworkStep) {
      setArtworkUri(uri);
      setArtworkIsLandscape(pickedIsLandscape);
      setStep('details');
    } else if (isCombined && !isArtworkStep && artworkUri) {
      await processScan(artworkUri, uri);
    } else {
      setArtworkIsLandscape(pickedIsLandscape);
      await processScan(uri);
    }
  }, [artworkUri, isArtworkStep, isCombined, processScan, processing]);

  const handleBack = useCallback(() => {
    if (isCombined && !isArtworkStep) {
      setStep('artwork');
      setArtworkUri(null);
      setArtworkIsLandscape(false);
    } else {
      router.back();
    }
  }, [isCombined, isArtworkStep, router]);

  const resetToArtworkStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setArtworkUri(null);
    setArtworkIsLandscape(false);
    setStep('artwork');
  }, []);

  return {
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
    clearError: () => setErrorMessage(null),
  };
}
