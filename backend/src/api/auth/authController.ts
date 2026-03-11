import type { Request, RequestHandler, Response } from 'express';

import { authService } from '@/api/auth/authService';

class AuthController {
  public register: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await authService.register(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public login: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await authService.login(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public socialLogin: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await authService.socialLogin(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public refresh: RequestHandler = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const serviceResponse = await authService.refresh(refreshToken);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public logout: RequestHandler = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const serviceResponse = await authService.logout(refreshToken);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const authController = new AuthController();
