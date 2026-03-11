import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ─── Response Schemas ────────────────────────────────────

export const ScanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  scanType: z.enum(['ARTWORK', 'COMBINED']),
  imageUrl: z.string(),
  labelImageUrl: z.string().nullable(),
  artworkId: z.string().nullable(),
  confidence: z.number().nullable(),
  rawAiResult: z.any().nullable(),
  extractedText: z.string().nullable(),
  userCorrectedTitle: z.string().nullable(),
  userCorrectedArtist: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.date(),
});

export type Scan = z.infer<typeof ScanSchema>;

export const ScanDetailSchema = ScanSchema.extend({
  artwork: z
    .object({
      id: z.string(),
      title: z.string(),
      year: z.number().nullable(),
      medium: z.string().nullable(),
      imageUrl: z.string().nullable(),
      artist: z
        .object({
          id: z.string(),
          name: z.string(),
          nationality: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
});

// ─── Request Schemas ─────────────────────────────────────

// Note: files are handled by multer, not Zod. These validate the other form fields.
export const ScanArtworkSchema = z.object({
  body: z.object({
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  }),
});

export const ScanCombinedSchema = z.object({
  body: z.object({
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  }),
});

export const GetScanSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
});

export const CorrectScanSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
  body: z.object({
    userCorrectedTitle: z.string().min(1).optional(),
    userCorrectedArtist: z.string().min(1).optional(),
    artworkId: z.string().min(1).optional(),
  }),
});
