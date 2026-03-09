import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

const {
  mockGetArtists,
  mockSearchArtists,
  mockGetArtist,
  mockCreateArtist,
  mockUpdateArtist,
  mockDeleteArtist,
} = vi.hoisted(() => ({
  mockGetArtists: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Artists found' }),
  ),
  mockSearchArtists: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Artists found' }),
  ),
  mockGetArtist: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Artist found' }),
  ),
  mockCreateArtist: vi.fn((_req, res) =>
    res.status(StatusCodes.CREATED).send({ success: true, message: 'Artist created' }),
  ),
  mockUpdateArtist: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Artist updated' }),
  ),
  mockDeleteArtist: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Artist deleted' }),
  ),
}));

vi.mock('@/api/artist/artistController', () => ({
  artistController: {
    getArtists: mockGetArtists,
    searchArtists: mockSearchArtists,
    getArtist: mockGetArtist,
    createArtist: mockCreateArtist,
    updateArtist: mockUpdateArtist,
    deleteArtist: mockDeleteArtist,
  },
}));

import { artistRouter } from '@/api/artist/artistRouter';

describe('artistRouter', () => {
  const app = express();
  app.use(express.json());
  app.use('/artists', artistRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /artists calls getArtists controller', async () => {
    const response = await request(app).get('/artists');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetArtists).toHaveBeenCalledTimes(1);
  });

  it('GET /artists/search rejects empty query before controller', async () => {
    const response = await request(app).get('/artists/search').query({ q: '' });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockSearchArtists).not.toHaveBeenCalled();
  });

  it('POST /artists validates payload and calls createArtist controller', async () => {
    const response = await request(app).post('/artists').send({
      name: 'Claude Monet',
      imageUrl: 'https://example.com/monet.jpg',
    });

    expect(response.statusCode).toBe(StatusCodes.CREATED);
    expect(mockCreateArtist).toHaveBeenCalledTimes(1);
  });

  it('PUT /artists/:id rejects invalid imageUrl and does not call update controller', async () => {
    const response = await request(app)
      .put('/artists/artist_1')
      .send({ imageUrl: 'not-a-url' });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockUpdateArtist).not.toHaveBeenCalled();
  });
});
