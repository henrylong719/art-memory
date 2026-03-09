import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ─── Response Schema ─────────────────────────────────────

export const MuseumSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  postalCode: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  googlePlaceId: z.string().nullable(),
  openingHours: z.any().nullable(),
  admissionInfo: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Museum = z.infer<typeof MuseumSchema>;

// Museum with distance (for nearby results)
export const MuseumWithDistanceSchema = MuseumSchema.extend({
  distance: z.number().optional(), // km from user
});

// Nearby search result from Google Places (not yet saved in DB)
export const NearbyMuseumSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().optional(),
  userRatingsTotal: z.number().optional(),
  openNow: z.boolean().optional(),
  photoUrl: z.string().optional(),
  distance: z.number().optional(),
  // If we already have this museum in our DB
  museumId: z.string().optional(),
});

// ─── Request Schemas ─────────────────────────────────────

export const GetMuseumSchema = z.object({
  params: z.object({ id: z.string().min(1, 'ID is required') }),
});

export const NearbySearchSchema = z.object({
  query: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().int().min(500).max(50000).default(5000),
  }),
});

export const TextSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  }),
});

export const GetByPlaceIdSchema = z.object({
  params: z.object({ placeId: z.string().min(1, 'Place ID is required') }),
});
