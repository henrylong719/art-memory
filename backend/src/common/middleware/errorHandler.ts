import type { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { Prisma } from '@generated/prisma/client';

const notFoundHandler: RequestHandler = (_req, res) => {
  const response = ServiceResponse.failure(
    'Route not found',
    null,
    StatusCodes.NOT_FOUND,
  );
  res.status(response.statusCode).send(response);
};

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');

  if (err instanceof ZodError) {
    const response = ServiceResponse.failure(
      err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      null,
      StatusCodes.BAD_REQUEST,
    );
    res.status(response.statusCode).send(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const response = ServiceResponse.failure(
      'Database request failed',
      null,
      StatusCodes.BAD_REQUEST,
    );
    res.status(response.statusCode).send(response);
    return;
  }

  if (
    err instanceof Error &&
    err.message.toLowerCase().includes('unexpected field')
  ) {
    const response = ServiceResponse.failure(
      'Invalid uploaded file fields',
      null,
      StatusCodes.BAD_REQUEST,
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
