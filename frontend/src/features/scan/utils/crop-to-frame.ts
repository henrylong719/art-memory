import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { PhysicalOrientation } from '@/features/scan/types';

export const BAR_HEIGHT_PORTRAIT = 144; // h-36
export const BAR_HEIGHT_LANDSCAPE = 96; // h-24

/**
 * Crops a photo to match the on-screen viewfinder frame, then rotates
 * if the device was held in landscape orientation.
 */
export async function cropToFrame(
  uri: string,
  rawW: number,
  rawH: number,
  screenW: number,
  screenH: number,
  frameWidthFraction: number,
  frameAspectWH: number,
  physicalOrientation: PhysicalOrientation,
): Promise<{ uri: string; isLandscape: boolean }> {
  const photoW = rawW;
  const photoH = rawH;

  const screenIsPortrait = screenH > screenW;
  const bottomBarH = screenIsPortrait
    ? BAR_HEIGHT_PORTRAIT
    : BAR_HEIGHT_LANDSCAPE;

  const frameScreenW = screenW * frameWidthFraction;
  const frameScreenH = frameScreenW / frameAspectWH;

  const FRAME_OFFSET_Y = 40;
  const viewfinderH = screenH - bottomBarH;
  const frameScreenX = (screenW - frameScreenW) / 2;
  const frameScreenY = (viewfinderH - frameScreenH) / 2 + FRAME_OFFSET_Y / 2;

  // Camera preview uses "cover"
  const scale = Math.max(screenW / photoW, screenH / photoH);
  const scaledPhotoW = photoW * scale;
  const scaledPhotoH = photoH * scale;
  const offsetX = (scaledPhotoW - screenW) / 2;
  const offsetY = (scaledPhotoH - screenH) / 2;

  const originX = Math.max(0, Math.round((frameScreenX + offsetX) / scale));
  const originY = Math.max(0, Math.round((frameScreenY + offsetY) / scale));
  const width = Math.min(Math.round(frameScreenW / scale), photoW - originX);
  const height = Math.min(Math.round(frameScreenH / scale), photoH - originY);

  // 1) Crop first
  const croppedRef = await ImageManipulator.manipulate(uri)
    .crop({ originX, originY, width, height })
    .renderAsync();

  const croppedSaved = await croppedRef.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.85,
  });

  // Expo camera already processes orientation, but after our crop math,
  // the final cropped image still needs a device-side correction.
  let rotation = 0;

  if (physicalOrientation === 'landscape-left') {
    rotation = -90;
  } else if (physicalOrientation === 'landscape-right') {
    rotation = 90;
  }

  // 2) Rotate after crop
  if (rotation !== 0) {
    const rotatedRef = await ImageManipulator.manipulate(croppedSaved.uri)
      .rotate(rotation)
      .renderAsync();

    const rotatedSaved = await rotatedRef.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.85,
    });

    return {
      uri: rotatedSaved.uri,
      isLandscape: rotatedRef.width > rotatedRef.height,
    };
  }

  return {
    uri: croppedSaved.uri,
    isLandscape: croppedRef.width > croppedRef.height,
  };
}
