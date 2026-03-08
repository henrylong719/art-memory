import type { Request, RequestHandler, Response } from 'express';

import { collectionService } from '@/api/collection/collectionService';

class CollectionController {
  public getCollections: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const serviceResponse = await collectionService.findByUser(userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getCollection: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await collectionService.findById(id, userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createCollection: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const serviceResponse = await collectionService.create(userId, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public updateCollection: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await collectionService.update(
      id,
      userId,
      req.body,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deleteCollection: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await collectionService.delete(id, userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const collectionController = new CollectionController();
