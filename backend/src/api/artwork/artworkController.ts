import type { Request, RequestHandler, Response } from 'express';

import { artworkService } from '@/api/artwork/artworkService';

class ArtworkController {
  public getArtworks: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await artworkService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getArtwork: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await artworkService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public searchArtworks: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const q = req.query.q as string;
    const limit = Number(req.query.limit) || 10;
    const serviceResponse = await artworkService.search(q, limit);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getArtworksByArtist: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const artistId = req.params.artistId as string;
    const serviceResponse = await artworkService.findByArtist(artistId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createArtwork: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const serviceResponse = await artworkService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public updateArtwork: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const id = req.params.id as string;
    const serviceResponse = await artworkService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deleteArtwork: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const id = req.params.id as string;
    const serviceResponse = await artworkService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public generateStory: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const serviceResponse = await artworkService.generateStory(id, userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const artworkController = new ArtworkController();
