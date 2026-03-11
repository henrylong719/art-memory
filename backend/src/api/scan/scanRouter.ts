import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import {
  ScanSchema,
  ScanDetailSchema,
  GetScanSchema,
  CorrectScanSchema,
} from '@/api/scan/scanModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { uploadImage } from '@/common/middleware/upload';
import { scanController } from './scanController';

export const scanRegistry = new OpenAPIRegistry();
export const scanRouter: Router = express.Router();

scanRegistry.register('Scan', ScanSchema);

// GET /scans (current user's scan history)
scanRegistry.registerPath({
  method: 'get',
  path: '/scans',
  tags: ['Scan'],
  responses: createApiResponse(z.array(ScanDetailSchema), 'Success'),
});

scanRouter.get('/', scanController.getScans);

// GET /scans/:id
scanRegistry.registerPath({
  method: 'get',
  path: '/scans/{id}',
  tags: ['Scan'],
  request: { params: GetScanSchema.shape.params },
  responses: createApiResponse(ScanDetailSchema, 'Success'),
});

scanRouter.get('/:id', validateRequest(GetScanSchema), scanController.getScan);

// POST /scans/artwork (Mode 1: artwork only — single image)
scanRegistry.registerPath({
  method: 'post',
  path: '/scans/artwork',
  tags: ['Scan'],
  description:
    'Upload a photo of an artwork for AI identification. Send as multipart/form-data with field name "image". Optionally include latitude and longitude.',
  responses: createApiResponse(ScanDetailSchema, 'Artwork identified'),
});

scanRouter.post(
  '/artwork',
  uploadImage.single('image'),
  scanController.scanArtwork,
);

// POST /scans/combined (Mode 2: artwork + label — two images)
scanRegistry.registerPath({
  method: 'post',
  path: '/scans/combined',
  tags: ['Scan'],
  description:
    'Upload a photo of an artwork AND its museum label for AI identification. Send as multipart/form-data with field names "artwork" and "label". Optionally include latitude and longitude.',
  responses: createApiResponse(
    ScanDetailSchema,
    'Artwork and label identified',
  ),
});

scanRouter.post(
  '/combined',
  uploadImage.fields([
    { name: 'artwork', maxCount: 1 },
    { name: 'label', maxCount: 1 },
  ]),
  scanController.scanCombined,
);

// PUT /scans/:id/correct (user corrects AI results)
scanRegistry.registerPath({
  method: 'put',
  path: '/scans/{id}/correct',
  tags: ['Scan'],
  request: {
    params: CorrectScanSchema.shape.params,
    body: {
      content: { 'application/json': { schema: CorrectScanSchema.shape.body } },
    },
  },
  responses: createApiResponse(ScanDetailSchema, 'Scan corrected'),
});

scanRouter.put(
  '/:id/correct',
  validateRequest(CorrectScanSchema),
  scanController.correctScan,
);

// DELETE /scans/:id
scanRegistry.registerPath({
  method: 'delete',
  path: '/scans/{id}',
  tags: ['Scan'],
  request: { params: GetScanSchema.shape.params },
  responses: createApiResponse(z.null(), 'Scan deleted'),
});

scanRouter.delete('/:id', validateRequest(GetScanSchema), scanController.deleteScan);
