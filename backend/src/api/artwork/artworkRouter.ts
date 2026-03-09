import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import {
  ArtworkSchema,
  ArtworkDetailSchema,
  GetArtworkSchema,
  CreateArtworkSchema,
  UpdateArtworkSchema,
  SearchArtworkSchema,
} from '@/api/artwork/artworkModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { artworkController } from './artworkController';

export const artworkRegistry = new OpenAPIRegistry();
export const artworkRouter: Router = express.Router();

artworkRegistry.register('Artwork', ArtworkSchema);
artworkRegistry.register('ArtworkDetail', ArtworkDetailSchema);

// GET /artworks
artworkRegistry.registerPath({
  method: 'get',
  path: '/artworks',
  tags: ['Artwork'],
  responses: createApiResponse(z.array(ArtworkDetailSchema), 'Success'),
});

artworkRouter.get('/', artworkController.getArtworks);

// GET /artworks/search?q=...&limit=...
artworkRegistry.registerPath({
  method: 'get',
  path: '/artworks/search',
  tags: ['Artwork'],
  request: { query: SearchArtworkSchema.shape.query },
  responses: createApiResponse(z.array(ArtworkDetailSchema), 'Success'),
});

artworkRouter.get(
  '/search',
  validateRequest(SearchArtworkSchema),
  artworkController.searchArtworks,
);

// GET /artworks/artist/:artistId
artworkRegistry.registerPath({
  method: 'get',
  path: '/artworks/artist/{artistId}',
  tags: ['Artwork'],
  request: {
    params: z.object({ artistId: z.string().min(1) }),
  },
  responses: createApiResponse(z.array(ArtworkDetailSchema), 'Success'),
});

artworkRouter.get('/artist/:artistId', artworkController.getArtworksByArtist);

// GET /artworks/:id
artworkRegistry.registerPath({
  method: 'get',
  path: '/artworks/{id}',
  tags: ['Artwork'],
  request: { params: GetArtworkSchema.shape.params },
  responses: createApiResponse(ArtworkDetailSchema, 'Success'),
});

artworkRouter.get(
  '/:id',
  validateRequest(GetArtworkSchema),
  artworkController.getArtwork,
);

// POST /artworks
artworkRegistry.registerPath({
  method: 'post',
  path: '/artworks',
  tags: ['Artwork'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateArtworkSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(ArtworkDetailSchema, 'Artwork created'),
});

artworkRouter.post(
  '/',
  validateRequest(CreateArtworkSchema),
  artworkController.createArtwork,
);

// PUT /artworks/:id
artworkRegistry.registerPath({
  method: 'put',
  path: '/artworks/{id}',
  tags: ['Artwork'],
  request: {
    params: UpdateArtworkSchema.shape.params,
    body: {
      content: {
        'application/json': { schema: UpdateArtworkSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(ArtworkDetailSchema, 'Artwork updated'),
});

artworkRouter.put(
  '/:id',
  validateRequest(UpdateArtworkSchema),
  artworkController.updateArtwork,
);

// DELETE /artworks/:id
artworkRegistry.registerPath({
  method: 'delete',
  path: '/artworks/{id}',
  tags: ['Artwork'],
  request: { params: GetArtworkSchema.shape.params },
  responses: createApiResponse(z.null(), 'Artwork deleted'),
});

artworkRouter.delete(
  '/:id',
  validateRequest(GetArtworkSchema),
  artworkController.deleteArtwork,
);

// POST /artworks/:id/generate-story
artworkRegistry.registerPath({
  method: 'post',
  path: '/artworks/{id}/generate-story',
  tags: ['Artwork'],
  description:
    'Generate a rich art-historical description for an artwork using AI. Returns cached story if one already exists.',
  request: { params: GetArtworkSchema.shape.params },
  responses: createApiResponse(ArtworkDetailSchema, 'Story generated'),
});

artworkRouter.post(
  '/:id/generate-story',
  validateRequest(GetArtworkSchema),
  artworkController.generateStory,
);
