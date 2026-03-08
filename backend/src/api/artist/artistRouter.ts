import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import {
  ArtistSchema,
  GetArtistSchema,
  CreateArtistSchema,
  UpdateArtistSchema,
  SearchArtistSchema,
} from '@/api/artist/artistModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { artistController } from './artistController';

export const artistRegistry = new OpenAPIRegistry();
export const artistRouter: Router = express.Router();

artistRegistry.register('Artist', ArtistSchema);

// GET /artists
artistRegistry.registerPath({
  method: 'get',
  path: '/artists',
  tags: ['Artist'],
  responses: createApiResponse(z.array(ArtistSchema), 'Success'),
});

artistRouter.get('/', artistController.getArtists);

// GET /artists/search?q=...&limit=...
artistRegistry.registerPath({
  method: 'get',
  path: '/artists/search',
  tags: ['Artist'],
  request: { query: SearchArtistSchema.shape.query },
  responses: createApiResponse(z.array(ArtistSchema), 'Success'),
});

artistRouter.get(
  '/search',
  validateRequest(SearchArtistSchema),
  artistController.searchArtists,
);

// GET /artists/:id
artistRegistry.registerPath({
  method: 'get',
  path: '/artists/{id}',
  tags: ['Artist'],
  request: { params: GetArtistSchema.shape.params },
  responses: createApiResponse(ArtistSchema, 'Success'),
});

artistRouter.get(
  '/:id',
  validateRequest(GetArtistSchema),
  artistController.getArtist,
);

// POST /artists
artistRegistry.registerPath({
  method: 'post',
  path: '/artists',
  tags: ['Artist'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateArtistSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(ArtistSchema, 'Artist created'),
});

artistRouter.post(
  '/',
  validateRequest(CreateArtistSchema),
  artistController.createArtist,
);

// PUT /artists/:id
artistRegistry.registerPath({
  method: 'put',
  path: '/artists/{id}',
  tags: ['Artist'],
  request: {
    params: UpdateArtistSchema.shape.params,
    body: {
      content: {
        'application/json': { schema: UpdateArtistSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(ArtistSchema, 'Artist updated'),
});

artistRouter.put(
  '/:id',
  validateRequest(UpdateArtistSchema),
  artistController.updateArtist,
);

// DELETE /artists/:id
artistRegistry.registerPath({
  method: 'delete',
  path: '/artists/{id}',
  tags: ['Artist'],
  request: { params: GetArtistSchema.shape.params },
  responses: createApiResponse(z.null(), 'Artist deleted'),
});

artistRouter.delete(
  '/:id',
  validateRequest(GetArtistSchema),
  artistController.deleteArtist,
);
