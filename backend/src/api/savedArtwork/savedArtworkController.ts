import type { Request, RequestHandler, Response } from 'express';

import { savedArtworkService } from '@/api/savedArtwork/savedArtworkService';

class SavedArtworkController {
  public getSavedArtworks: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const serviceResponse = await savedArtworkService.findByUser(userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getSavedArtworksByCollection: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const collectionId = req.params.collectionId as string;
    const serviceResponse = await savedArtworkService.findByCollection(
      collectionId,
      userId,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getSavedArtwork: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await savedArtworkService.findById(id, userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public saveArtwork: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const serviceResponse = await savedArtworkService.save(userId, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public updateSavedArtwork: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await savedArtworkService.update(
      id,
      userId,
      req.body,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public removeSavedArtwork: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await savedArtworkService.remove(id, userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const savedArtworkController = new SavedArtworkController();
