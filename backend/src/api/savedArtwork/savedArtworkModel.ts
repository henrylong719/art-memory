import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ─── Response Schema ─────────────────────────────────────

export const SavedArtworkSchema = z.object({
  id: z.string(),
  userId: z.string(),
  artworkId: z.string().nullable(),
  collectionId: z.string(),
  personalNote: z.string().nullable(),
  userPhotoUrl: z.string().nullable(),
  rating: z.number().nullable(),
  customTitle: z.string().nullable(),
  customArtist: z.string().nullable(),
  customYear: z.number().nullable(),
  customMedium: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SavedArtwork = z.infer<typeof SavedArtworkSchema>;

// SavedArtwork with artwork, artist, and collection details included
export const SavedArtworkDetailSchema = SavedArtworkSchema.extend({
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
      museum: z
        .object({
          id: z.string(),
          name: z.string(),
          city: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
  collection: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

// ─── Request Schemas ─────────────────────────────────────

export const GetSavedArtworkSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
});

export const SaveArtworkSchema = z.object({
  body: z.object({
    artworkId: z.string().optional(),
    collectionId: z.string().optional(), // If not provided, saves to default collection
    personalNote: z.string().max(1000).optional(),
    userPhotoUrl: z.string().url().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    // Manual entry fields (when no artwork exists in DB)
    customTitle: z.string().optional(),
    customArtist: z.string().optional(),
    customYear: z.number().int().optional(),
    customMedium: z.string().optional(),
  }),
});

export const UpdateSavedArtworkSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
  body: z.object({
    collectionId: z.string().optional(),
    personalNote: z.string().max(1000).nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    customTitle: z.string().nullable().optional(),
    customArtist: z.string().nullable().optional(),
    customYear: z.number().int().nullable().optional(),
    customMedium: z.string().nullable().optional(),
  }),
});

export const GetByCollectionSchema = z.object({
  params: z.object({
    collectionId: z.string().min(1, 'Collection ID is required'),
  }),
});
