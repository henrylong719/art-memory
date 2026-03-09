import type { Request, RequestHandler, Response } from 'express';
import { userService } from '@/api/user/userService';

class UserController {
  public getMe: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const serviceResponse = await userService.findMe(userId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public updateMe: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const serviceResponse = await userService.updateMe(userId, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const userController = new UserController();
