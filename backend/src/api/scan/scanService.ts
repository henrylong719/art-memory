import { StatusCodes } from 'http-status-codes';

import { ScanRepository } from '@/api/scan/scanRepository';
import { AiUsageLogRepository } from '@/api/scan/aiUsageLogRepository';
import { ArtworkRepository } from '@/api/artwork/artworkRepository';
import { ArtistRepository } from '@/api/artist/artistRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { uploadToS3, deleteFromS3 } from '@/common/services/s3';
import {
  identifyArtwork,
  extractLabel,
  extractUsageInfo,
} from '@/common/services/openai';
import { logger } from '@/server';

export class ScanService {
  private scanRepository: ScanRepository;
  private aiUsageLogRepository: AiUsageLogRepository;
  private artworkRepository: ArtworkRepository;
  private artistRepository: ArtistRepository;

  constructor(
    scanRepository: ScanRepository = new ScanRepository(),
    aiUsageLogRepository: AiUsageLogRepository = new AiUsageLogRepository(),
    artworkRepository: ArtworkRepository = new ArtworkRepository(),
    artistRepository: ArtistRepository = new ArtistRepository(),
  ) {
    this.scanRepository = scanRepository;
    this.aiUsageLogRepository = aiUsageLogRepository;
    this.artworkRepository = artworkRepository;
    this.artistRepository = artistRepository;
  }

  // ─── Scan History ────────────────────────────────────────

  async findByUser(userId: string) {
    try {
      const scans = await this.scanRepository.findByUser(userId);
      return ServiceResponse.success('Scans found', scans);
    } catch (ex) {
      logger.error(
        `Error finding scans for user ${userId}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while retrieving scans.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: string, userId: string) {
    try {
      const scan = await this.scanRepository.findById(id);
      if (!scan) {
        return ServiceResponse.failure(
          'Scan not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (scan.userId !== userId) {
        return ServiceResponse.failure(
          'Scan not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success('Scan found', scan);
    } catch (ex) {
      logger.error(`Error finding scan ${id}: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while finding scan.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Mode 1: Artwork Only ───────────────────────────────

  async scanArtwork(
    userId: string,
    artworkFile: Express.Multer.File,
    options: { latitude?: number; longitude?: number },
  ) {
    // Step 1: Upload artwork image to S3 (outside try so a total failure is still possible)
    const imageUrl = await uploadToS3(
      artworkFile.buffer,
      artworkFile.originalname,
      'scans/artworks',
      artworkFile.mimetype,
    );

    try {
      // Step 2: Send to OpenAI for identification
      const artworkBase64 = artworkFile.buffer.toString('base64');
      const { result: aiResult, rawResponse } = await identifyArtwork(
        artworkBase64,
        artworkFile.mimetype,
      );

      // Step 3: Log AI usage
      const usageInfo = extractUsageInfo(rawResponse);
      await this.aiUsageLogRepository.create({
        userId,
        endpoint: 'openai/vision/artwork',
        model: usageInfo.model,
        tokensIn: usageInfo.tokensIn,
        tokensOut: usageInfo.tokensOut,
        costUsd: usageInfo.costUsd,
        durationMs: usageInfo.durationMs,
        success: true,
      });

      // Step 4: Find or create artwork + artist
      const artworkId = await this.resolveArtwork({
        ...aiResult,
        imageUrl: imageUrl,
        latitude: options.latitude,
        longitude: options.longitude,
      });

      // Step 5: Create scan record
      const scan = await this.scanRepository.create({
        userId,
        scanType: 'ARTWORK',
        imageUrl,
        artworkId,
        confidence: aiResult.confidence,
        rawAiResult: rawResponse as object,
        latitude: options.latitude,
        longitude: options.longitude,
      });

      const isLowConfidence = aiResult.confidence < 0.5;
      return ServiceResponse.success(
        isLowConfidence
          ? 'Scan saved but artwork could not be confidently identified. Details may be inaccurate.'
          : 'Artwork scanned successfully',
        {
          ...scan,
          lowConfidence: isLowConfidence,
        },
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = (ex as Error).message;
      logger.error(`Error scanning artwork: ${errorMessage}`);

      await this.logFailedUsage(userId, 'openai/vision/artwork', errorMessage);

      // Still create a scan record so the image appears in scan history
      const scan = await this.scanRepository.create({
        userId,
        scanType: 'ARTWORK',
        imageUrl,
        confidence: 0,
        latitude: options.latitude,
        longitude: options.longitude,
      });

      return ServiceResponse.success(
        'Scan saved but identification failed',
        scan,
        StatusCodes.CREATED,
      );
    }
  }

  // ─── Mode 2: Artwork + Label Combined ───────────────────
  // Artwork photo is stored. Only the label is sent to OpenAI for OCR.

  async scanCombined(
    userId: string,
    artworkFile: Express.Multer.File,
    labelFile: Express.Multer.File,
    options: { latitude?: number; longitude?: number },
  ) {
    // Step 1: Upload both images to S3 in parallel (outside try so images are always persisted)
    const [imageUrl, labelImageUrl] = await Promise.all([
      uploadToS3(
        artworkFile.buffer,
        artworkFile.originalname,
        'scans/artworks',
        artworkFile.mimetype,
      ),
      uploadToS3(
        labelFile.buffer,
        labelFile.originalname,
        'scans/labels',
        labelFile.mimetype,
      ),
    ]);

    try {
      // Step 2: Send only the LABEL to OpenAI for text extraction
      const labelBase64 = labelFile.buffer.toString('base64');
      const { result: labelResult, rawResponse } = await extractLabel(
        labelBase64,
        labelFile.mimetype,
      );

      // Step 3: Log AI usage
      const usageInfo = extractUsageInfo(rawResponse);
      await this.aiUsageLogRepository.create({
        userId,
        endpoint: 'openai/vision/label',
        model: usageInfo.model,
        tokensIn: usageInfo.tokensIn,
        tokensOut: usageInfo.tokensOut,
        costUsd: usageInfo.costUsd,
        durationMs: usageInfo.durationMs,
        success: true,
      });

      // Step 4: Find or create artwork + artist from label data
      let artworkId: string | undefined;

      if (labelResult.title && labelResult.artistName) {
        const artist = await this.artistRepository.findOrCreate(
          labelResult.artistName,
          {
            source: 'AI_GENERATED',
          },
        );

        const existingArtwork =
          await this.artworkRepository.findByTitleAndArtist(
            labelResult.title,
            artist.id,
          );

        if (existingArtwork) {
          artworkId = existingArtwork.id;
        } else {
          const newArtwork = await this.artworkRepository.create({
            title: labelResult.title,
            year: labelResult.year ?? undefined,
            medium: labelResult.medium ?? undefined,
            artistId: artist.id,
            imageUrl: imageUrl,
            source: 'AI_GENERATED',
            latitude: options.latitude,
            longitude: options.longitude,
          });
          artworkId = newArtwork.id;
        }
      }

      // Step 5: Create scan record
      const scan = await this.scanRepository.create({
        userId,
        scanType: 'COMBINED',
        imageUrl,
        labelImageUrl,
        artworkId,
        confidence: labelResult.title ? 0.95 : 0.3,
        rawAiResult: rawResponse as object,
        extractedText: labelResult.extractedText,
        latitude: options.latitude,
        longitude: options.longitude,
      });

      return ServiceResponse.success(
        'Artwork and label scanned successfully',
        scan,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = (ex as Error).message;
      logger.error(`Error scanning combined: ${errorMessage}`);

      await this.logFailedUsage(userId, 'openai/vision/label', errorMessage);

      // Still create a scan record so the image appears in scan history
      const scan = await this.scanRepository.create({
        userId,
        scanType: 'COMBINED',
        imageUrl,
        labelImageUrl,
        confidence: 0,
        latitude: options.latitude,
        longitude: options.longitude,
      });

      return ServiceResponse.success(
        'Scan saved but identification failed',
        scan,
        StatusCodes.CREATED,
      );
    }
  }

  // ─── User Corrections ───────────────────────────────────

  async correctScan(
    id: string,
    userId: string,
    data: {
      userCorrectedTitle?: string;
      userCorrectedArtist?: string;
      artworkId?: string;
    },
  ) {
    try {
      const scan = await this.scanRepository.findById(id);
      if (!scan) {
        return ServiceResponse.failure(
          'Scan not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (scan.userId !== userId) {
        return ServiceResponse.failure(
          'Scan not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const updatedScan = await this.scanRepository.update(id, data);

      // Increment correction count on the linked artwork
      if (scan.artworkId) {
        await this.artworkRepository.incrementCorrectionCount(scan.artworkId);
      }

      return ServiceResponse.success('Scan corrected', updatedScan);
    } catch (ex) {
      logger.error(`Error correcting scan ${id}: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while correcting scan.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Delete Scan ────────────────────────────────────────

  async deleteScan(id: string, userId: string) {
    try {
      const scan = await this.scanRepository.findById(id);
      if (!scan) {
        return ServiceResponse.failure(
          'Scan not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (scan.userId !== userId) {
        return ServiceResponse.failure(
          'Scan not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Delete S3 images
      try {
        await deleteFromS3(scan.imageUrl);
        if (scan.labelImageUrl) {
          await deleteFromS3(scan.labelImageUrl);
        }
      } catch (ex) {
        logger.error(
          `Failed to delete S3 images for scan ${id}: ${(ex as Error).message}`,
        );
      }

      await this.scanRepository.delete(id);

      return ServiceResponse.success('Scan deleted', null);
    } catch (ex) {
      logger.error(`Error deleting scan ${id}: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while deleting scan.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Private Helpers ─────────────────────────────────────

  /**
   * Takes an AI result and finds or creates the artwork + artist in the database.
   * Returns the artworkId or undefined if confidence is too low.
   */
  private async resolveArtwork(aiResult: {
    title: string;
    artistName: string;
    year?: number | null;
    medium?: string | null;
    style?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    confidence: number;
    latitude?: number;
    longitude?: number;
  }): Promise<string | undefined> {
    if (aiResult.confidence < 0.3 || !aiResult.title || !aiResult.artistName) {
      return undefined;
    }

    // Find or create the artist
    const artist = await this.artistRepository.findOrCreate(
      aiResult.artistName,
      {
        source: 'AI_GENERATED',
      },
    );

    // Check if artwork already exists
    const existingArtwork = await this.artworkRepository.findByTitleAndArtist(
      aiResult.title,
      artist.id,
    );

    if (existingArtwork) {
      return existingArtwork.id;
    }

    // Create new artwork
    const newArtwork = await this.artworkRepository.create({
      title: aiResult.title,
      year: aiResult.year ?? undefined,
      medium: aiResult.medium ?? undefined,
      style: aiResult.style ?? undefined,
      description: aiResult.description ?? undefined,
      imageUrl: aiResult.imageUrl ?? undefined,
      artistId: artist.id,
      source: 'AI_GENERATED',
      latitude: aiResult.latitude,
      longitude: aiResult.longitude,
    });

    return newArtwork.id;
  }

  private async logFailedUsage(
    userId: string,
    endpoint: string,
    errorMsg: string,
  ) {
    await this.aiUsageLogRepository
      .create({
        userId,
        endpoint,
        model: 'unknown',
        success: false,
        errorMsg,
      })
      .catch(() => {}); // Don't fail if logging fails
  }
}

export const scanService = new ScanService();
