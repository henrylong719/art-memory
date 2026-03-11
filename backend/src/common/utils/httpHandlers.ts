import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError, type ZodSchema } from 'zod';

import { ServiceResponse } from '@/common/models/serviceResponse';

export const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message =
          err.issues
            .map((issue) => issue.message)
            .filter(Boolean)
            .join('; ') || 'Invalid input.';

        const serviceResponse = ServiceResponse.failure(
          message,
          null,
          StatusCodes.BAD_REQUEST,
        );

        res.status(serviceResponse.statusCode).send(serviceResponse);
        return;
      }

      next(err);
    }
  };
