import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

const {
  mockGetSavedArtworks,
  mockGetSavedArtworksByCollection,
  mockGetSavedArtwork,
  mockSaveArtwork,
  mockUpdateSavedArtwork,
  mockRemoveSavedArtwork,
} = vi.hoisted(() => ({
  mockGetSavedArtworks: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Saved artworks found' }),
  ),
  mockGetSavedArtworksByCollection: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Saved artworks found' }),
  ),
  mockGetSavedArtwork: vi.fn((_req, res) =>
    res.status(StatusCodes.OK).send({ success: true, message: 'Saved artwork found' }),
  ),
  mockSaveArtwork: vi.fn((_req, res) =>
    res.status(StatusCodes.CREATED).send({ success: true, message: 'Artwork saved' }),
  ),
  mockUpdateSavedArtwork: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Saved artwork updated' }),
  ),
  mockRemoveSavedArtwork: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Saved artwork removed' }),
  ),
}));

vi.mock('@/api/savedArtwork/savedArtworkController', () => ({
  savedArtworkController: {
    getSavedArtworks: mockGetSavedArtworks,
    getSavedArtworksByCollection: mockGetSavedArtworksByCollection,
    getSavedArtwork: mockGetSavedArtwork,
    saveArtwork: mockSaveArtwork,
    updateSavedArtwork: mockUpdateSavedArtwork,
    removeSavedArtwork: mockRemoveSavedArtwork,
  },
}));

import { savedArtworkRouter } from '@/api/savedArtwork/savedArtworkRouter';

describe('savedArtworkRouter', () => {
  const app = express();
  app.use(express.json());
  app.use('/saved-artworks', savedArtworkRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /saved-artworks calls getSavedArtworks controller', async () => {
    const response = await request(app).get('/saved-artworks');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetSavedArtworks).toHaveBeenCalledTimes(1);
  });

  it('GET /saved-artworks/collection/:collectionId validates params and calls controller', async () => {
    const response = await request(app).get('/saved-artworks/collection/col_1');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetSavedArtworksByCollection).toHaveBeenCalledTimes(1);
  });

  it('POST /saved-artworks rejects invalid rating before controller', async () => {
    const response = await request(app).post('/saved-artworks').send({ rating: 10 });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockSaveArtwork).not.toHaveBeenCalled();
  });

  it('PUT /saved-artworks/:id validates payload and calls update controller', async () => {
    const response = await request(app)
      .put('/saved-artworks/save_1')
      .send({ rating: 5, personalNote: 'Great composition' });

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockUpdateSavedArtwork).toHaveBeenCalledTimes(1);
  });
});
