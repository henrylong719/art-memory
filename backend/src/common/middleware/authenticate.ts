import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { verifyAccessToken, type JwtPayload } from '@/common/utils/jwt';
import { ServiceResponse } from '@/common/models/serviceResponse';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware that verifies the JWT access token from the Authorization header.
 * Attaches `req.user` with { userId, email } on success.
 */

export const authticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response = ServiceResponse.failure(
      'Access token is required',
      null,
      StatusCodes.UNAUTHORIZED,
    );
    res.status(response.statusCode).send(response);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    const response = ServiceResponse.failure(
      'Invalid or expired access token',
      null,
      StatusCodes.UNAUTHORIZED,
    );
    res.status(response.statusCode).send(response);
  }
};
