import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import path from 'node:path';
import { env } from '@/common/utils/envConfig';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

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
  const ext = path.extname(originalName) || '.jpg';
  const uniqueName = `${folder}/${crypto.randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: uniqueName,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${uniqueName}`;
}

/**
 * Deletes a file from S3 by its full URL.
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  const url = new URL(fileUrl);
  const key = url.pathname.slice(1); // Remove leading /

  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}
