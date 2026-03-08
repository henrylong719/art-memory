import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ─── Response Schema ─────────────────────────────────────

export const ArtworkSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().nullable(),
  medium: z.string().nullable(),
  dimensions: z.string().nullable(),
  style: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  wikiUrl: z.string().nullable(),
  artistId: z.string().nullable(),
  museumId: z.string().nullable(),
  source: z.enum([
    'AI_GENERATED',
    'SEED_MET',
    'SEED_AIC',
    'SEED_WIKI',
    'MANUAL',
  ]),
  verified: z.boolean(),
  correctionCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Artwork = z.infer<typeof ArtworkSchema>;

// Artwork with artist and museum included
export const ArtworkDetailSchema = ArtworkSchema.extend({
  artist: z
    .object({
      id: z.string(),
      name: z.string(),
      nationality: z.string().nullable(),
      imageUrl: z.string().nullable(),
    })
    .nullable(),
  museum: z
    .object({
      id: z.string(),
      name: z.string(),
      city: z.string().nullable(),
      country: z.string().nullable(),
    })
    .nullable(),
});

// ─── Request Schemas ─────────────────────────────────────

export const GetArtworkSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
});

export const CreateArtworkSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    year: z.number().int().optional(),
    medium: z.string().optional(),
    dimensions: z.string().optional(),
    style: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    wikiUrl: z.string().url().optional(),
    artistId: z.string().optional(),
    artistName: z.string().optional(), // Alternative: pass artist name, we'll find or create
    museumId: z.string().optional(),
    source: z
      .enum(['AI_GENERATED', 'SEED_MET', 'SEED_AIC', 'SEED_WIKI', 'MANUAL'])
      .optional(),
    externalId: z.string().optional(),
  }),
});

export const UpdateArtworkSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
  body: z.object({
    title: z.string().min(1).optional(),
    year: z.number().int().nullable().optional(),
    medium: z.string().nullable().optional(),
    dimensions: z.string().nullable().optional(),
    style: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    wikiUrl: z.string().url().nullable().optional(),
    artistId: z.string().nullable().optional(),
    museumId: z.string().nullable().optional(),
    verified: z.boolean().optional(),
  }),
});

export const SearchArtworkSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});
