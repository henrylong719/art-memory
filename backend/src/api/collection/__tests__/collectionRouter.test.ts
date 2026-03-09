import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

const {
  mockGetCollections,
  mockGetCollection,
  mockCreateCollection,
  mockUpdateCollection,
  mockDeleteCollection,
} = vi.hoisted(() => ({
  mockGetCollections: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Collections found' }),
  ),
  mockGetCollection: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Collection found' }),
  ),
  mockCreateCollection: vi.fn((_req, res) =>
    res
      .status(StatusCodes.CREATED)
      .send({ success: true, message: 'Collection created' }),
  ),
  mockUpdateCollection: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Collection updated' }),
  ),
  mockDeleteCollection: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Collection deleted' }),
  ),
}));

vi.mock('@/api/collection/collectionController', () => ({
  collectionController: {
    getCollections: mockGetCollections,
    getCollection: mockGetCollection,
    createCollection: mockCreateCollection,
    updateCollection: mockUpdateCollection,
    deleteCollection: mockDeleteCollection,
  },
}));

import { collectionRouter } from '@/api/collection/collectionRouter';

describe('collectionRouter', () => {
  const app = express();
  app.use(express.json());
  app.use('/collections', collectionRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /collections calls getCollections controller', async () => {
    const response = await request(app).get('/collections');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetCollections).toHaveBeenCalledTimes(1);
  });

  it('POST /collections validates payload and calls create controller', async () => {
    const response = await request(app).post('/collections').send({
      name: 'Favorites',
      coverUrl: 'https://example.com/cover.jpg',
    });

    expect(response.statusCode).toBe(StatusCodes.CREATED);
    expect(mockCreateCollection).toHaveBeenCalledTimes(1);
  });

  it('PUT /collections/:id rejects invalid coverUrl before controller', async () => {
    const response = await request(app)
      .put('/collections/col_1')
      .send({ coverUrl: 'not-a-url' });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockUpdateCollection).not.toHaveBeenCalled();
  });

  it('GET /collections/:id validates params and calls getCollection controller', async () => {
    const response = await request(app).get('/collections/col_1');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetCollection).toHaveBeenCalledTimes(1);
  });
});
