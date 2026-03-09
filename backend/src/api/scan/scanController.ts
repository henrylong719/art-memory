import type { Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { scanService } from '@/api/scan/scanService';
import { ServiceResponse } from '@/common/models/serviceResponse';

class ScanController {
  public getScans: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const serviceResponse = await scanService.findByUser(userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getScan: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await scanService.findById(id, userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  // Mode 1: Artwork only (single image)
  public scanArtwork: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
      const response = ServiceResponse.failure(
        'Artwork image is required',
        null,
        StatusCodes.BAD_REQUEST,
      );
      res.status(response.statusCode).send(response);
      return;
    }

    const serviceResponse = await scanService.scanArtwork(userId, file, {
      latitude: req.body.latitude ? Number(req.body.latitude) : undefined,
      longitude: req.body.longitude ? Number(req.body.longitude) : undefined,
    });

    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  // Mode 2: Artwork + Label (two images)
  public scanCombined: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const artworkFile = files?.artwork?.[0];
    const labelFile = files?.label?.[0];

    if (!artworkFile) {
      const response = ServiceResponse.failure(
        'Artwork image is required',
        null,
        StatusCodes.BAD_REQUEST,
      );
      res.status(response.statusCode).send(response);
      return;
    }

    if (!labelFile) {
      const response = ServiceResponse.failure(
        'Label image is required',
        null,
        StatusCodes.BAD_REQUEST,
      );
      res.status(response.statusCode).send(response);
      return;
    }

    const serviceResponse = await scanService.scanCombined(
      userId,
      artworkFile,
      labelFile,
      {
        latitude: req.body.latitude ? Number(req.body.latitude) : undefined,
        longitude: req.body.longitude ? Number(req.body.longitude) : undefined,
      },
    );

    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public correctScan: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await scanService.correctScan(id, userId, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const scanController = new ScanController();
