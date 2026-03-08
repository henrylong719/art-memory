import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ─── Response Schema ─────────────────────────────────────

export const CollectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  coverUrl: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Collection = z.infer<typeof CollectionSchema>;

// Collection with artwork count and preview images
export const CollectionWithCountSchema = CollectionSchema.extend({
  _count: z.object({
    savedArtworks: z.number(),
  }),
  savedArtworks: z
    .array(
      z.object({
        id: z.string(),
        artwork: z
          .object({
            imageUrl: z.string().nullable(),
          })
          .nullable(),
        userPhotoUrl: z.string().nullable(),
      }),
    )
    .optional(),
});

// ─── Request Schemas ─────────────────────────────────────

export const GetCollectionSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
});

export const CreateCollectionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    coverUrl: z.string().url().optional(),
  }),
});

export const UpdateCollectionSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    coverUrl: z.string().url().nullable().optional(),
  }),
});
