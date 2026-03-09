import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import {
  MuseumSchema,
  NearbyMuseumSchema,
  GetMuseumSchema,
  NearbySearchSchema,
  TextSearchSchema,
  GetByPlaceIdSchema,
} from '@/api/museum/museumModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { museumController } from './museumController';

export const museumRegistry = new OpenAPIRegistry();
export const museumRouter: Router = express.Router();

museumRegistry.register('Museum', MuseumSchema);

// GET /museums/nearby?latitude=...&longitude=...&radius=...
museumRegistry.registerPath({
  method: 'get',
  path: '/museums/nearby',
  tags: ['Museum'],
  description:
    'Search for museums near a location using Google Places. Returns results sorted by distance.',
  request: { query: NearbySearchSchema.shape.query },
  responses: createApiResponse(
    z.array(NearbyMuseumSchema),
    'Nearby museums found',
  ),
});

museumRouter.get(
  '/nearby',
  validateRequest(NearbySearchSchema),
  museumController.nearbySearch,
);

// GET /museums/search?q=...&latitude=...&longitude=...
museumRegistry.registerPath({
  method: 'get',
  path: '/museums/search',
  tags: ['Museum'],
  description: 'Search for museums by name or keyword using Google Places.',
  request: { query: TextSearchSchema.shape.query },
  responses: createApiResponse(z.array(NearbyMuseumSchema), 'Museums found'),
});

museumRouter.get(
  '/search',
  validateRequest(TextSearchSchema),
  museumController.textSearch,
);

// GET /museums/place/:placeId
museumRegistry.registerPath({
  method: 'get',
  path: '/museums/place/{placeId}',
  tags: ['Museum'],
  description:
    'Get full details for a museum by Google Place ID. Saves/updates the museum in our database.',
  request: { params: GetByPlaceIdSchema.shape.params },
  responses: createApiResponse(MuseumSchema, 'Museum details found'),
});

museumRouter.get(
  '/place/:placeId',
  validateRequest(GetByPlaceIdSchema),
  museumController.getDetails,
);

// GET /museums/:id
museumRegistry.registerPath({
  method: 'get',
  path: '/museums/{id}',
  tags: ['Museum'],
  description: 'Get a museum from our database by ID, including its artworks.',
  request: { params: GetMuseumSchema.shape.params },
  responses: createApiResponse(MuseumSchema, 'Museum found'),
});

museumRouter.get(
  '/:id',
  validateRequest(GetMuseumSchema),
  museumController.getMuseum,
);
