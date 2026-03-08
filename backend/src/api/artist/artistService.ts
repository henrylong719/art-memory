import { StatusCodes } from 'http-status-codes';

import type { Artist } from '@/api/artist/artistModel';
import { ArtistRepository } from '@/api/artist/artistRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

export class ArtistService {
  private artistRepository: ArtistRepository;

  constructor(repository: ArtistRepository = new ArtistRepository()) {
    this.artistRepository = repository;
  }

  async findAll(): Promise<ServiceResponse<Artist[] | null>> {
    try {
      const artists = await this.artistRepository.findAll();
      if (!artists || artists.length === 0) {
        return ServiceResponse.failure(
          'No artists found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<Artist[]>('Artists found', artists);
    } catch (ex) {
      logger.error(`Error finding all artists: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while retrieving artists.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: string): Promise<ServiceResponse<Artist | null>> {
    try {
      const artist = await this.artistRepository.findById(id);
      if (!artist) {
        return ServiceResponse.failure(
          'Artist not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success('Artist found', artist);
    } catch (ex) {
      logger.error(
        `Error finding artist with id ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while finding artist.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async search(
    query: string,
    limit: number,
  ): Promise<ServiceResponse<Artist[] | null>> {
    try {
      const artists = await this.artistRepository.search(query, limit);
      if (!artists || artists.length === 0) {
        return ServiceResponse.failure(
          'No artists found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success<Artist[]>('Artists found', artists);
    } catch (ex) {
      logger.error(`Error searching artists: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while searching artists.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(data: {
    name: string;
    birthYear?: number;
    deathYear?: number;
    nationality?: string;
    biography?: string;
    imageUrl?: string;
    wikiUrl?: string;
    source?: 'AI_GENERATED' | 'SEED_MET' | 'SEED_AIC' | 'SEED_WIKI' | 'MANUAL';
    externalId?: string;
  }): Promise<ServiceResponse<Artist | null>> {
    try {
      // Check for duplicate name
      const existing = await this.artistRepository.findByName(data.name);
      if (existing) {
        return ServiceResponse.failure(
          'An artist with this name already exists',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const artist = await this.artistRepository.create(data);
      return ServiceResponse.success<Artist>(
        'Artist created',
        artist,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      logger.error(`Error creating artist: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while creating artist.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    data: {
      name?: string;
      birthYear?: number | null;
      deathYear?: number | null;
      nationality?: string | null;
      biography?: string | null;
      imageUrl?: string | null;
      wikiUrl?: string | null;
      verified?: boolean;
    },
  ): Promise<ServiceResponse<Artist | null>> {
    try {
      const existing = await this.artistRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure(
          'Artist not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const artist = await this.artistRepository.update(id, data);
      return ServiceResponse.success<Artist>('Artist updated', artist);
    } catch (ex) {
      logger.error(
        `Error updating artist with id ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while updating artist.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string): Promise<ServiceResponse<null>> {
    try {
      const existing = await this.artistRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure(
          'Artist not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      await this.artistRepository.delete(id);
      return ServiceResponse.success('Artist deleted', null);
    } catch (ex) {
      logger.error(
        `Error deleting artist with id ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while deleting artist.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const artistService = new ArtistService();
