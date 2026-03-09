import express from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

const {
  mockGetArtworks,
  mockSearchArtworks,
  mockGetArtworksByArtist,
  mockGetArtwork,
  mockCreateArtwork,
  mockUpdateArtwork,
  mockDeleteArtwork,
  mockGenerateStory,
} = vi.hoisted(() => ({
  mockGetArtworks: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Artworks found' }),
  ),
  mockSearchArtworks: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Artworks found' }),
  ),
  mockGetArtworksByArtist: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Artworks found' }),
  ),
  mockGetArtwork: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Artwork found' }),
  ),
  mockCreateArtwork: vi.fn((_req, res) =>
    res
      .status(StatusCodes.CREATED)
      .send({ success: true, message: 'Artwork created' }),
  ),
  mockUpdateArtwork: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Artwork updated' }),
  ),
  mockDeleteArtwork: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Artwork deleted' }),
  ),
  mockGenerateStory: vi.fn((_req, res) =>
    res
      .status(StatusCodes.OK)
      .send({ success: true, message: 'Story generated' }),
  ),
}));

vi.mock('@/api/artwork/artworkController', () => ({
  artworkController: {
    getArtworks: mockGetArtworks,
    searchArtworks: mockSearchArtworks,
    getArtworksByArtist: mockGetArtworksByArtist,
    getArtwork: mockGetArtwork,
    createArtwork: mockCreateArtwork,
    updateArtwork: mockUpdateArtwork,
    deleteArtwork: mockDeleteArtwork,
    generateStory: mockGenerateStory,
  },
}));

import { artworkRouter } from '@/api/artwork/artworkRouter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('artworkRouter', () => {
  const app = express();
  app.use(express.json());
  app.use('/artworks', artworkRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /artworks calls getArtworks controller', async () => {
    const response = await request(app).get('/artworks');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGetArtworks).toHaveBeenCalledTimes(1);
  });

  it('GET /artworks/search validates query before controller', async () => {
    const response = await request(app)
      .get('/artworks/search')
      .query({ q: '' });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockSearchArtworks).not.toHaveBeenCalled();
  });

  it('POST /artworks validates payload and calls create controller', async () => {
    const response = await request(app).post('/artworks').send({
      title: 'Starry Night',
      imageUrl: 'https://example.com/starry-night.jpg',
    });

    expect(response.statusCode).toBe(StatusCodes.CREATED);
    expect(mockCreateArtwork).toHaveBeenCalledTimes(1);
  });

  it('POST /artworks/:id/generate-story validates params and calls controller', async () => {
    const response = await request(app).post('/artworks/art_1/generate-story');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(mockGenerateStory).toHaveBeenCalledTimes(1);
  });

  it('PUT /artworks/:id rejects invalid wikiUrl and does not call update controller', async () => {
    const response = await request(app)
      .put('/artworks/art_1')
      .send({ wikiUrl: 'not-a-url' });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.body.message).toContain('Invalid input');
    expect(mockUpdateArtwork).not.toHaveBeenCalled();
  });
});
