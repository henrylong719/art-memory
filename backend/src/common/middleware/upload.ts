import multer from 'multer';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Store in memory — we need the buffer for both S3 upload and OpenAI
const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        ),
      );
    }
  },
});
