import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

const {
  mockNearbySearch,
  mockTextSearch,
  mockGetDetails,
  mockGetMuseum,
} = vi.hoisted(() => ({
  mockNearbySearch: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Nearby museums found' }),
  ),
  mockTextSearch: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Museums found' }),
  ),
  mockGetDetails: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Museum details found' }),
  ),
  mockGetMuseum: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Museum found' }),
  ),
}));

vi.mock('@/api/museum/museumController', () => ({
  museumController: {
    nearbySearch: mockNearbySearch,
    textSearch: mockTextSearch,
    getDetails: mockGetDetails,
    getMuseum: mockGetMuseum,
  },
}));

import { museumRouter } from '@/api/museum/museumRouter';

describe('museumRouter', () => {
  const app = express();
  app.use(express.json());
  app.use('/museums', museumRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /museums/nearby validates query and calls nearbySearch controller', async () => {
    const response = await request(app).get('/museums/nearby').query({
      latitude: 40.7128,
      longitude: -74.006,
      radius: 1000,
    });

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockNearbySearch).toHaveBeenCalledTimes(1);
  });

  it('GET /museums/nearby rejects invalid latitude before controller', async () => {
    const response = await request(app).get('/museums/nearby').query({
      latitude: 120,
      longitude: -74.006,
    });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockNearbySearch).not.toHaveBeenCalled();
  });

  it('GET /museums/search rejects empty query before controller', async () => {
    const response = await request(app).get('/museums/search').query({ q: '' });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockTextSearch).not.toHaveBeenCalled();
  });

  it('GET /museums/place/:placeId validates params and calls getDetails', async () => {
    const response = await request(app).get('/museums/place/abc123');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetDetails).toHaveBeenCalledTimes(1);
  });
});
