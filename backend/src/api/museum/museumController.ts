import type { Request, RequestHandler, Response } from 'express';

import { museumService } from '@/api/museum/museumService';

class MuseumController {
  public getMuseum: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await museumService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public nearbySearch: RequestHandler = async (req: Request, res: Response) => {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const radius = Number(req.query.radius) || 5000;
    const serviceResponse = await museumService.findNearby(
      latitude,
      longitude,
      radius,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public textSearch: RequestHandler = async (req: Request, res: Response) => {
    const q = req.query.q as string;
    const latitude = req.query.latitude
      ? Number(req.query.latitude)
      : undefined;
    const longitude = req.query.longitude
      ? Number(req.query.longitude)
      : undefined;
    const serviceResponse = await museumService.search(q, latitude, longitude);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getDetails: RequestHandler = async (req: Request, res: Response) => {
    const placeId = req.params.placeId as string;
    const serviceResponse = await museumService.getDetails(placeId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const museumController = new MuseumController();
