import { useEffect, useState } from 'react';
import { Image as RNImage } from 'react-native';

export type ImageOrientation = 'portrait' | 'landscape' | 'square';

function getImageOrientation(width: number, height: number): ImageOrientation {
  if (width > height) return 'landscape';
  if (height > width) return 'portrait';
  return 'square';
}

/**
 * Resolves the orientation of a remote image by loading its dimensions.
 * Defaults to 'portrait' on failure.
 */
export function useImageOrientation(imageUrl: string | undefined | null) {
  const [orientation, setOrientation] = useState<ImageOrientation | null>(null);

  useEffect(() => {
    if (!imageUrl || typeof imageUrl !== 'string') return;

    RNImage.getSize(
      imageUrl,
      (width, height) => setOrientation(getImageOrientation(width, height)),
      () => setOrientation('portrait'),
    );
  }, [imageUrl]);

  return orientation;
}
