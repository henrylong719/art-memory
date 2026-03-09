import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

import { ServiceResponse } from '@/common/models/serviceResponse';
import { env } from '@/common/utils/envConfig';
import { logger } from '@/server';
import { Prisma } from '@generated/prisma/client';

const notFoundHandler: RequestHandler = (req, res) => {
  const response = ServiceResponse.failure(
    `Route not found: ${req.method} ${req.originalUrl}`,
    null,
    StatusCodes.NOT_FOUND,
  );

  res.status(response.statusCode).send(response);
};

const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl,
    },
    'Unhandled request error',
  );

  if (err instanceof ZodError) {
    const message = err.issues
      .map((issue) => {
        const field = issue.path.length > 0 ? issue.path.join('.') : 'body';
        return `${field}: ${issue.message}`;
      })
      .join('; ');

    const response = ServiceResponse.failure(
      `Invalid input: ${message}`,
      null,
      StatusCodes.BAD_REQUEST,
    );

    res.status(response.statusCode).send(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const response = ServiceResponse.failure(
        'A record with this value already exists.',
        null,
        StatusCodes.CONFLICT,
      );
      res.status(response.statusCode).send(response);
      return;
    }

    if (err.code === 'P2025') {
      const response = ServiceResponse.failure(
        'Requested record was not found.',
        null,
        StatusCodes.NOT_FOUND,
      );
      res.status(response.statusCode).send(response);
      return;
    }

    const response = ServiceResponse.failure(
      'Database request failed.',
      null,
      StatusCodes.BAD_REQUEST,
    );
    res.status(response.statusCode).send(response);
    return;
  }

  if (err instanceof multer.MulterError) {
    let message = 'File upload failed.';

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file is too large.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Invalid uploaded file field.';
    }

    const response = ServiceResponse.failure(
      message,
      null,
      StatusCodes.BAD_REQUEST,
    );

    res.status(response.statusCode).send(response);
    return;
  }

  if (err instanceof Error) {
    const response = ServiceResponse.failure(
      env.isProduction ? 'Internal server error' : err.message,
      null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );

    res.status(response.statusCode).send(response);
    return;
  }

  const response = ServiceResponse.failure(
    'Internal server error',
    null,
    StatusCodes.INTERNAL_SERVER_ERROR,
  );

  res.status(response.statusCode).send(response);
};

export default (): [RequestHandler, ErrorRequestHandler] => [
  notFoundHandler,
  globalErrorHandler,
];
