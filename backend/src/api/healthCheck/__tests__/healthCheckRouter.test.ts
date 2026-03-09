import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

import type { ServiceResponse } from '@/common/models/serviceResponse';
import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter';

describe('healthCheckRouter', () => {
  it('GET /health-check returns service health payload', async () => {
    const app = express();
    app.use('/health-check', healthCheckRouter);

    const response = await request(app).get('/health-check');
    const result: ServiceResponse = response.body;

    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(result.success).toBeTruthy();
    expect(result.responseObject).toBeNull();
    expect(result.message).toEqual('Service is healthy');
  });
});
