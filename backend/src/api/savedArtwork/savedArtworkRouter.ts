import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import {
  SavedArtworkSchema,
  SavedArtworkDetailSchema,
  GetSavedArtworkSchema,
  SaveArtworkSchema,
  UpdateSavedArtworkSchema,
  GetByCollectionSchema,
} from '@/api/savedArtwork/savedArtworkModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { savedArtworkController } from './savedArtworkController';

export const savedArtworkRegistry = new OpenAPIRegistry();
export const savedArtworkRouter: Router = express.Router();

savedArtworkRegistry.register('SavedArtwork', SavedArtworkSchema);

// GET /saved-artworks (all saved artworks for current user)
savedArtworkRegistry.registerPath({
  method: 'get',
  path: '/saved-artworks',
  tags: ['SavedArtwork'],
  responses: createApiResponse(z.array(SavedArtworkDetailSchema), 'Success'),
});

savedArtworkRouter.get('/', savedArtworkController.getSavedArtworks);

// GET /saved-artworks/collection/:collectionId
savedArtworkRegistry.registerPath({
  method: 'get',
  path: '/saved-artworks/collection/{collectionId}',
  tags: ['SavedArtwork'],
  request: { params: GetByCollectionSchema.shape.params },
  responses: createApiResponse(z.array(SavedArtworkDetailSchema), 'Success'),
});

savedArtworkRouter.get(
  '/collection/:collectionId',
  validateRequest(GetByCollectionSchema),
  savedArtworkController.getSavedArtworksByCollection,
);

// GET /saved-artworks/:id
savedArtworkRegistry.registerPath({
  method: 'get',
  path: '/saved-artworks/{id}',
  tags: ['SavedArtwork'],
  request: { params: GetSavedArtworkSchema.shape.params },
  responses: createApiResponse(SavedArtworkDetailSchema, 'Success'),
});

savedArtworkRouter.get(
  '/:id',
  validateRequest(GetSavedArtworkSchema),
  savedArtworkController.getSavedArtwork,
);

// POST /saved-artworks
savedArtworkRegistry.registerPath({
  method: 'post',
  path: '/saved-artworks',
  tags: ['SavedArtwork'],
  request: {
    body: {
      content: { 'application/json': { schema: SaveArtworkSchema.shape.body } },
    },
  },
  responses: createApiResponse(SavedArtworkDetailSchema, 'Artwork saved'),
});

savedArtworkRouter.post(
  '/',
  validateRequest(SaveArtworkSchema),
  savedArtworkController.saveArtwork,
);

// PUT /saved-artworks/:id
savedArtworkRegistry.registerPath({
  method: 'put',
  path: '/saved-artworks/{id}',
  tags: ['SavedArtwork'],
  request: {
    params: UpdateSavedArtworkSchema.shape.params,
    body: {
      content: {
        'application/json': { schema: UpdateSavedArtworkSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(
    SavedArtworkDetailSchema,
    'Saved artwork updated',
  ),
});

savedArtworkRouter.put(
  '/:id',
  validateRequest(UpdateSavedArtworkSchema),
  savedArtworkController.updateSavedArtwork,
);

// DELETE /saved-artworks/:id
savedArtworkRegistry.registerPath({
  method: 'delete',
  path: '/saved-artworks/{id}',
  tags: ['SavedArtwork'],
  request: { params: GetSavedArtworkSchema.shape.params },
  responses: createApiResponse(z.null(), 'Saved artwork removed'),
});

savedArtworkRouter.delete(
  '/:id',
  validateRequest(GetSavedArtworkSchema),
  savedArtworkController.removeSavedArtwork,
);
