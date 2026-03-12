import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

import { env } from '@/common/utils/envConfig';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

type NormalizedUpload = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

async function normalizeImageForUpload(
  fileBuffer: Buffer,
  originalName: string,
  contentType: string,
): Promise<NormalizedUpload> {
  const lowerName = originalName.toLowerCase();
  const isImage =
    contentType.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(lowerName);

  if (!isImage) {
    return {
      buffer: fileBuffer,
      contentType,
      extension: path.extname(originalName) || '.jpg',
    };
  }

  try {
    const pipeline = sharp(fileBuffer, {
      failOn: 'warning',
      sequentialRead: true,
    }).rotate(); // auto-orient from EXIF, then strip orientation tag

    if (contentType === 'image/png' || lowerName.endsWith('.png')) {
      const buffer = await pipeline.png().toBuffer();
      return {
        buffer,
        contentType: 'image/png',
        extension: '.png',
      };
    }

    if (contentType === 'image/webp' || lowerName.endsWith('.webp')) {
      const buffer = await pipeline.webp({ quality: 90 }).toBuffer();
      return {
        buffer,
        contentType: 'image/webp',
        extension: '.webp',
      };
    }

    // Normalize everything else to JPEG for consistent display
    const buffer = await pipeline.jpeg({ quality: 90 }).toBuffer();
    return {
      buffer,
      contentType: 'image/jpeg',
      extension: '.jpg',
    };
  } catch (error) {
    console.warn(
      `Image normalization failed for ${originalName}, uploading original bytes instead:`,
      error,
    );

    return {
      buffer: fileBuffer,
      contentType,
      extension: path.extname(originalName) || '.jpg',
    };
  }
}

/**
 * Uploads a file buffer to S3 and returns the public URL.
 *
 * @param fileBuffer - The file data
 * @param originalName - Original filename (used for extension)
 * @param folder - S3 folder prefix (e.g. "scans", "avatars")
 * @param contentType - MIME type of the file
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  originalName: string,
  folder: string,
  contentType: string,
): Promise<string> {
  const normalized = await normalizeImageForUpload(
    fileBuffer,
    originalName,
    contentType,
  );

  const uniqueName = `${folder}/${crypto.randomUUID()}${normalized.extension}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: uniqueName,
    Body: normalized.buffer,
    ContentType: normalized.contentType,
  });

  await s3Client.send(command);

  return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${uniqueName}`;
}

/**
 * Deletes a file from S3 by its full URL.
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  const url = new URL(fileUrl);
  const key = url.pathname.slice(1);

  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}
