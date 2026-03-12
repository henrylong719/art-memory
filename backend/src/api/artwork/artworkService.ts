import { StatusCodes } from 'http-status-codes';

import { ArtworkRepository } from '@/api/artwork/artworkRepository';
import { ArtistRepository } from '@/api/artist/artistRepository';
import { AiUsageLogRepository } from '@/api/scan/aiUsageLogRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import {
  generateArtworkStory,
  extractUsageInfo,
} from '@/common/services/openai';
import { logger } from '@/server';
import { STORY_LIMITS } from '@/common/config/storyLimit';

export class ArtworkService {
  private artworkRepository: ArtworkRepository;
  private artistRepository: ArtistRepository;
  private aiUsageLogRepository: AiUsageLogRepository;

  constructor(
    artworkRepository: ArtworkRepository = new ArtworkRepository(),
    artistRepository: ArtistRepository = new ArtistRepository(),
    aiUsageLogRepository: AiUsageLogRepository = new AiUsageLogRepository(),
  ) {
    this.artworkRepository = artworkRepository;
    this.artistRepository = artistRepository;
    this.aiUsageLogRepository = aiUsageLogRepository;
  }

  async findAll() {
    try {
      const artworks = await this.artworkRepository.findAll();
      if (!artworks || artworks.length === 0) {
        return ServiceResponse.failure(
          'No artworks found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success('Artworks found', artworks);
    } catch (ex) {
      logger.error(`Error finding all artworks: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while retrieving artworks.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: string) {
    try {
      const artwork = await this.artworkRepository.findById(id);
      if (!artwork) {
        return ServiceResponse.failure(
          'Artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success('Artwork found', artwork);
    } catch (ex) {
      logger.error(
        `Error finding artwork with id ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while finding artwork.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async search(query: string, limit: number) {
    try {
      const artworks = await this.artworkRepository.search(query, limit);
      if (!artworks || artworks.length === 0) {
        return ServiceResponse.failure(
          'No artworks found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success('Artworks found', artworks);
    } catch (ex) {
      logger.error(`Error searching artworks: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while searching artworks.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByArtist(artistId: string) {
    try {
      const artist = await this.artistRepository.findById(artistId);
      if (!artist) {
        return ServiceResponse.failure(
          'Artist not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const artworks = await this.artworkRepository.findByArtist(artistId);
      return ServiceResponse.success('Artworks found', artworks);
    } catch (ex) {
      logger.error(
        `Error finding artworks by artist: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while finding artworks.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   *
   * When a user scans a painting, OpenAI returns something like "Starry Night by Vincent van Gogh".
   * We get a title and an artist name — not an artist ID from our database.
   * So the method needs to be flexible about how it receives artist information.
   */
  async create(data: {
    title: string;
    year?: number;
    medium?: string;
    dimensions?: string;
    style?: string;
    description?: string;
    imageUrl?: string;
    wikiUrl?: string;
    artistId?: string;
    artistName?: string;
    museumId?: string;
    source?: 'AI_GENERATED' | 'SEED_MET' | 'SEED_AIC' | 'SEED_WIKI' | 'MANUAL';
    externalId?: string;
    latitude?: number;
    longitude?: number;
  }) {
    try {
      /***
       *
       * There are two ways to link an artist.
       * If the caller passes artistId directly (they already know the artist exists in our DB),
       * we use that. But if they pass artistName instead (like from an AI scan result),
       * we call findOrCreate — this searches the database for "Vincent van Gogh".
       * If found, it returns the existing record. If not found,
       * it creates a new artist entry. Either way, we end up with an artistId we can use.
       */
      // If artistName is provided instead of artistId, find or create the artist
      let resolvedArtistId = data.artistId;

      if (!resolvedArtistId && data.artistName) {
        const artist = await this.artistRepository.findOrCreate(
          data.artistName,
          {
            source: data.source || 'AI_GENERATED',
          },
        );
        resolvedArtistId = artist.id;
      }

      /**
       * If 500 users scan the Mona Lisa, we don't want 500 duplicate Artwork records.
       * So we check: does "Starry Night" by this artist already exist? If yes,
       * we return the existing one — no duplicate created.
       * otice it returns a success response,
       * not a failure — the caller still gets the artwork they need.
       */
      // Check for duplicate (same title + same artist)
      if (resolvedArtistId) {
        const existing = await this.artworkRepository.findByTitleAndArtist(
          data.title,
          resolvedArtistId,
        );
        if (existing) {
          return ServiceResponse.success('Artwork already exists', existing);
        }
      }

      /**
       * The destructuring { artistName, ...createData } strips out artistName
       * from the data before sending it to Prisma.
       * Why? Because artistName isn't a column in the artworks table —
       * it was only used for the find-or-create logic above.
       * Prisma would throw an error if we tried to pass an unknown field.
       * We then override artistId with the resolved one.
       */
      const { artistName, ...createData } = data;
      const artwork = await this.artworkRepository.create({
        ...createData,
        artistId: resolvedArtistId,
      });

      return ServiceResponse.success(
        'Artwork created',
        artwork,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      logger.error(`Error creating artwork: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while creating artwork.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    data: {
      title?: string;
      year?: number | null;
      medium?: string | null;
      dimensions?: string | null;
      style?: string | null;
      description?: string | null;
      imageUrl?: string | null;
      wikiUrl?: string | null;
      artistId?: string | null;
      museumId?: string | null;
      verified?: boolean;
    },
  ) {
    try {
      const existing = await this.artworkRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure(
          'Artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // If marking as verified, set the timestamp
      const updateData: any = { ...data };
      if (data.verified === true && !existing.verified) {
        updateData.verifiedAt = new Date();
      }

      const artwork = await this.artworkRepository.update(id, updateData);
      return ServiceResponse.success('Artwork updated', artwork);
    } catch (ex) {
      logger.error(
        `Error updating artwork with id ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while updating artwork.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string) {
    try {
      const existing = await this.artworkRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure(
          'Artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Disconnect scans and saved artworks before deleting
      await this.artworkRepository.disconnectRelations(id);
      await this.artworkRepository.delete(id);
      return ServiceResponse.success('Artwork deleted', null);
    } catch (ex) {
      logger.error(
        `Error deleting artwork with id ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while deleting artwork.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Minimum seconds between generations per user
  private static readonly COOLDOWN_SECONDS = 60;

  private static readonly STORY_ENDPOINT = 'openai/text/story';

  async generateStory(id: string, userId: string) {
    try {
      const artwork = await this.artworkRepository.findById(id);
      if (!artwork) {
        return ServiceResponse.failure(
          'Artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // ── Fetch user plan ──
      const { prisma } = await import('@/common/db/prisma');
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      const plan = user?.plan ?? 'FREE';

      // ── Cooldown check ──
      const latestLog = await this.aiUsageLogRepository.findLatest(
        userId,
        ArtworkService.STORY_ENDPOINT,
      );

      if (latestLog) {
        const elapsed = (Date.now() - latestLog.createdAt.getTime()) / 1000;
        const remaining = Math.ceil(ArtworkService.COOLDOWN_SECONDS - elapsed);

        if (remaining > 0) {
          return ServiceResponse.failure(
            `Please wait ${remaining} seconds before generating another story.`,
            { cooldownRemaining: remaining },
            StatusCodes.TOO_MANY_REQUESTS,
          );
        }
      }

      // ── Daily limit check ──
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayCount = await this.aiUsageLogRepository.countSince(
        userId,
        ArtworkService.STORY_ENDPOINT,
        startOfDay,
      );

      const dailyLimit = STORY_LIMITS[plan] ?? STORY_LIMITS.FREE;

      if (todayCount >= dailyLimit) {
        return ServiceResponse.failure(
          `Daily story limit reached (${dailyLimit}/${dailyLimit}). ${
            plan === 'FREE'
              ? 'Upgrade your plan for more generations.'
              : 'Limit resets at midnight.'
          }`,
          {
            used: todayCount,
            limit: dailyLimit,
            plan,
          },
          StatusCodes.TOO_MANY_REQUESTS,
        );
      }

      // ── Generate story via OpenAI ──
      const artistName = artwork.artist?.name || 'Unknown Artist';

      const { story, rawResponse } = await generateArtworkStory({
        title: artwork.title,
        artistName,
        year: artwork.year,
        medium: artwork.medium,
        style: artwork.style,
      });

      // Log AI usage
      const usageInfo = extractUsageInfo(rawResponse);
      await this.aiUsageLogRepository.create({
        userId,
        endpoint: ArtworkService.STORY_ENDPOINT,
        model: usageInfo.model,
        tokensIn: usageInfo.tokensIn,
        tokensOut: usageInfo.tokensOut,
        costUsd: usageInfo.costUsd,
        durationMs: usageInfo.durationMs,
        success: true,
      });

      // Update artwork with the generated story
      const updated = await this.artworkRepository.update(id, {
        description: story,
      });

      // Return with usage metadata
      const newUsed = todayCount + 1;
      return ServiceResponse.success('Story generated', {
        ...updated,
        _storyMeta: {
          used: newUsed,
          limit: dailyLimit,
          remaining: dailyLimit - newUsed,
          cooldownSeconds: ArtworkService.COOLDOWN_SECONDS,
          plan,
        },
      });
    } catch (ex) {
      logger.error(
        `Error generating story for artwork ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while generating story.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const artworkService = new ArtworkService();
