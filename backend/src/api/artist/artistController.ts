import type { Request, RequestHandler, Response } from 'express';
import { artistService } from '@/api/artist/artistService';

class ArtistController {
  public getArtists: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await artistService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getArtist: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await artistService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public searchArtists: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const q = req.query.q as string;
    const limit = Number(req.query.limit) || 10;
    const serviceResponse = await artistService.search(q, limit);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createArtist: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await artistService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public updateArtist: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await artistService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deleteArtist: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await artistService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const artistController = new ArtistController();
