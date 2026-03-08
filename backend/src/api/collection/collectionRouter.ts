import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import {
  CollectionSchema,
  CollectionWithCountSchema,
  GetCollectionSchema,
  CreateCollectionSchema,
  UpdateCollectionSchema,
} from '@/api/collection/collectionModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { collectionController } from './collectionController';

export const collectionRegistry = new OpenAPIRegistry();
export const collectionRouter: Router = express.Router();

collectionRegistry.register('Collection', CollectionSchema);

// GET /collections (current user's collections)
collectionRegistry.registerPath({
  method: 'get',
  path: '/collections',
  tags: ['Collection'],
  responses: createApiResponse(z.array(CollectionWithCountSchema), 'Success'),
});

collectionRouter.get('/', collectionController.getCollections);

// GET /collections/:id
collectionRegistry.registerPath({
  method: 'get',
  path: '/collections/{id}',
  tags: ['Collection'],
  request: { params: GetCollectionSchema.shape.params },
  responses: createApiResponse(CollectionWithCountSchema, 'Success'),
});

collectionRouter.get(
  '/:id',
  validateRequest(GetCollectionSchema),
  collectionController.getCollection,
);

// POST /collections
collectionRegistry.registerPath({
  method: 'post',
  path: '/collections',
  tags: ['Collection'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateCollectionSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(CollectionSchema, 'Collection created'),
});

collectionRouter.post(
  '/',
  validateRequest(CreateCollectionSchema),
  collectionController.createCollection,
);

// PUT /collections/:id
collectionRegistry.registerPath({
  method: 'put',
  path: '/collections/{id}',
  tags: ['Collection'],
  request: {
    params: UpdateCollectionSchema.shape.params,
    body: {
      content: {
        'application/json': { schema: UpdateCollectionSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(CollectionSchema, 'Collection updated'),
});

collectionRouter.put(
  '/:id',
  validateRequest(UpdateCollectionSchema),
  collectionController.updateCollection,
);

// DELETE /collections/:id
collectionRegistry.registerPath({
  method: 'delete',
  path: '/collections/{id}',
  tags: ['Collection'],
  request: { params: GetCollectionSchema.shape.params },
  responses: createApiResponse(z.null(), 'Collection deleted'),
});

collectionRouter.delete(
  '/:id',
  validateRequest(GetCollectionSchema),
  collectionController.deleteCollection,
);
