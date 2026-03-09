import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScanService } from '@/api/scan/scanService';
import { extractUsageInfo, identifyArtwork } from '@/common/services/openai';
import { uploadToS3 } from '@/common/services/s3';

vi.mock('@/common/db/prisma', () => ({
  prisma: {},
}));

vi.mock('@/common/services/s3', () => ({
  uploadToS3: vi.fn(),
}));

vi.mock('@/common/services/openai', () => ({
  identifyArtwork: vi.fn(),
  extractLabel: vi.fn(),
  extractUsageInfo: vi.fn(),
}));

vi.mock('@/server', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('scanService', () => {
  const scanRepository = {
    findByUser: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const aiUsageLogRepository = {
    create: vi.fn(),
  };

  const artworkRepository = {
    findByTitleAndArtist: vi.fn(),
    create: vi.fn(),
    incrementCorrectionCount: vi.fn(),
  };

  const artistRepository = {
    findOrCreate: vi.fn(),
  };

  let scanService: ScanService;

  beforeEach(() => {
    vi.clearAllMocks();
    aiUsageLogRepository.create.mockResolvedValue({ id: 'usage-1' });
    scanService = new ScanService(
      scanRepository as never,
      aiUsageLogRepository as never,
      artworkRepository as never,
      artistRepository as never,
    );
  });

  it('returns a not found response when finding scan from a different user', async () => {
    scanRepository.findById.mockResolvedValue({ id: 'scan-1', userId: 'other' });

    const result = await scanService.findById('scan-1', 'user-1');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(result.message).toBe('Scan not found');
  });

  it('creates a scan record for successful artwork scan', async () => {
    const rawResponse = { usage: { prompt_tokens: 100, completion_tokens: 45 } };

    vi.mocked(uploadToS3).mockResolvedValue('https://cdn.example.com/art.jpg');
    vi.mocked(identifyArtwork).mockResolvedValue({
      result: {
        title: 'Starry Night',
        artistName: 'Vincent van Gogh',
        confidence: 0.91,
        year: 1889,
      },
      rawResponse,
    });
    vi.mocked(extractUsageInfo).mockReturnValue({
      model: 'gpt-4.1-mini',
      tokensIn: 100,
      tokensOut: 45,
      durationMs: 250,
    });

    artistRepository.findOrCreate.mockResolvedValue({ id: 'artist-1' });
    artworkRepository.findByTitleAndArtist.mockResolvedValue(null);
    artworkRepository.create.mockResolvedValue({ id: 'artwork-1' });
    scanRepository.create.mockResolvedValue({ id: 'scan-1', userId: 'user-1' });

    const file = {
      buffer: Buffer.from('image-bytes'),
      originalname: 'art.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const result = await scanService.scanArtwork('user-1', file, {
      latitude: 1.2,
      longitude: 2.3,
    });

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(StatusCodes.CREATED);
    expect(result.message).toBe('Artwork scanned successfully');
    expect(aiUsageLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        endpoint: 'openai/vision/artwork',
        success: true,
      }),
    );
    expect(scanRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        scanType: 'ARTWORK',
        artworkId: 'artwork-1',
      }),
    );
  });

  it('logs failed usage and returns internal error when artwork scan fails', async () => {
    vi.mocked(uploadToS3).mockRejectedValue(new Error('S3 unavailable'));

    const file = {
      buffer: Buffer.from('image-bytes'),
      originalname: 'art.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const result = await scanService.scanArtwork('user-1', file, {});

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(result.message).toBe('An error occurred while scanning artwork.');
    expect(aiUsageLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        endpoint: 'openai/vision/artwork',
        model: 'unknown',
        success: false,
      }),
    );
  });

  it('increments correction count when correcting a scan with linked artwork', async () => {
    scanRepository.findById.mockResolvedValue({
      id: 'scan-1',
      userId: 'user-1',
      artworkId: 'artwork-1',
    });
    scanRepository.update.mockResolvedValue({ id: 'scan-1' });

    const result = await scanService.correctScan('scan-1', 'user-1', {
      userCorrectedTitle: 'Corrected Title',
    });

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(StatusCodes.OK);
    expect(artworkRepository.incrementCorrectionCount).toHaveBeenCalledWith(
      'artwork-1',
    );
  });
});
