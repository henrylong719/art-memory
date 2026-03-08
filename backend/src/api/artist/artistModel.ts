import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ─── Response Schema ─────────────────────────────────────

export const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  birthYear: z.number().nullable(),
  deathYear: z.number().nullable(),
  nationality: z.string().nullable(),
  biography: z.string().nullable(),
  imageUrl: z.string().nullable(),
  wikiUrl: z.string().nullable(),
  source: z.enum([
    'AI_GENERATED',
    'SEED_MET',
    'SEED_AIC',
    'SEED_WIKI',
    'MANUAL',
  ]),
  verified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Artist = z.infer<typeof ArtistSchema>;

// ─── Request Schemas ─────────────────────────────────────

export const GetArtistSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
});

export const CreateArtistSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    birthYear: z.number().int().optional(),
    deathYear: z.number().int().optional(),
    nationality: z.string().optional(),
    biography: z.string().optional(),
    imageUrl: z.string().url().optional(),
    wikiUrl: z.string().url().optional(),
    source: z
      .enum(['AI_GENERATED', 'SEED_MET', 'SEED_AIC', 'SEED_WIKI', 'MANUAL'])
      .optional(),
    externalId: z.string().optional(),
  }),
});

export const UpdateArtistSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
  body: z.object({
    name: z.string().min(1).optional(),
    birthYear: z.number().int().nullable().optional(),
    deathYear: z.number().int().nullable().optional(),
    nationality: z.string().nullable().optional(),
    biography: z.string().nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    wikiUrl: z.string().url().nullable().optional(),
    verified: z.boolean().optional(),
  }),
});

export const SearchArtistSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});
