import { StatusCodes } from 'http-status-codes';

import { SavedArtworkRepository } from '@/api/savedArtwork/savedArtworkRepository';
import { CollectionRepository } from '@/api/collection/collectionRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { ArtworkRepository } from '@/api/artwork/artworkRepository';
import { logger } from '@/server';

export class SavedArtworkService {
  private savedArtworkRepository: SavedArtworkRepository;
  private collectionRepository: CollectionRepository;
  private artworkRepository: ArtworkRepository;

  constructor(
    savedArtworkRepository: SavedArtworkRepository = new SavedArtworkRepository(),
    collectionRepository: CollectionRepository = new CollectionRepository(),
    artworkRepository: ArtworkRepository = new ArtworkRepository(),
  ) {
    this.savedArtworkRepository = savedArtworkRepository;
    this.collectionRepository = collectionRepository;
    this.artworkRepository = artworkRepository;
  }

  async findByUser(userId: string) {
    try {
      const savedArtworks =
        await this.savedArtworkRepository.findByUser(userId);
      return ServiceResponse.success('Saved artworks found', savedArtworks);
    } catch (ex) {
      logger.error(
        `Error finding saved artworks for user ${userId}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while retrieving saved artworks.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByCollection(collectionId: string, userId: string) {
    try {
      // Verify the collection belongs to the user
      const collection = await this.collectionRepository.findById(collectionId);
      if (!collection || collection.userId !== userId) {
        return ServiceResponse.failure(
          'Collection not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const savedArtworks = await this.savedArtworkRepository.findByCollection(
        collectionId,
        userId,
      );
      return ServiceResponse.success('Saved artworks found', savedArtworks);
    } catch (ex) {
      logger.error(
        `Error finding saved artworks in collection ${collectionId}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while retrieving saved artworks.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: string, userId: string) {
    try {
      const savedArtwork = await this.savedArtworkRepository.findById(id);
      if (!savedArtwork) {
        return ServiceResponse.failure(
          'Saved artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (savedArtwork.userId !== userId) {
        return ServiceResponse.failure(
          'Saved artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success('Saved artwork found', savedArtwork);
    } catch (ex) {
      logger.error(
        `Error finding saved artwork ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while finding saved artwork.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async save(
    userId: string,
    data: {
      artworkId?: string;
      collectionId?: string;
      personalNote?: string;
      userPhotoUrl?: string;
      rating?: number;
      customTitle?: string;
      customArtist?: string;
      customYear?: number;
      customMedium?: string;
    },
  ) {
    try {
      // If no collectionId provided, use the user's default collection
      let resolvedCollectionId = data.collectionId;

      if (!resolvedCollectionId) {
        const defaultCollection =
          await this.collectionRepository.findDefaultByUser(userId);
        if (!defaultCollection) {
          return ServiceResponse.failure(
            'No default collection found. Please create a collection first.',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        resolvedCollectionId = defaultCollection.id;
      } else {
        // Verify the collection belongs to the user
        const collection =
          await this.collectionRepository.findById(resolvedCollectionId);
        if (!collection || collection.userId !== userId) {
          return ServiceResponse.failure(
            'Collection not found',
            null,
            StatusCodes.NOT_FOUND,
          );
        }
      }

      // Check for duplicate (same artwork in same collection)
      if (data.artworkId) {
        // Verify the artwork exists
        const artwork = await this.artworkRepository.findById(data.artworkId);
        if (!artwork) {
          return ServiceResponse.failure(
            'Artwork not found',
            null,
            StatusCodes.NOT_FOUND,
          );
        }

        const existing = await this.savedArtworkRepository.findByUserAndArtwork(
          userId,
          data.artworkId,
          resolvedCollectionId,
        );
        if (existing) {
          return ServiceResponse.failure(
            'This artwork is already saved in this collection',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      const { collectionId: _, ...createData } = data;
      const savedArtwork = await this.savedArtworkRepository.create({
        userId,
        collectionId: resolvedCollectionId,
        ...createData,
      });

      return ServiceResponse.success(
        'Artwork saved',
        savedArtwork,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      logger.error(`Error saving artwork: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while saving artwork.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async update(
    id: string,
    userId: string,
    data: {
      collectionId?: string;
      personalNote?: string | null;
      rating?: number | null;
      customTitle?: string | null;
      customArtist?: string | null;
      customYear?: number | null;
      customMedium?: string | null;
    },
  ) {
    try {
      const existing = await this.savedArtworkRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure(
          'Saved artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (existing.userId !== userId) {
        return ServiceResponse.failure(
          'Saved artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // If moving to a different collection, verify ownership
      if (data.collectionId && data.collectionId !== existing.collectionId) {
        const targetCollection = await this.collectionRepository.findById(
          data.collectionId,
        );
        if (!targetCollection || targetCollection.userId !== userId) {
          return ServiceResponse.failure(
            'Target collection not found',
            null,
            StatusCodes.NOT_FOUND,
          );
        }
      }

      const savedArtwork = await this.savedArtworkRepository.update(id, data);
      return ServiceResponse.success('Saved artwork updated', savedArtwork);
    } catch (ex) {
      logger.error(
        `Error updating saved artwork ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while updating saved artwork.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string, userId: string) {
    try {
      const existing = await this.savedArtworkRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure(
          'Saved artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (existing.userId !== userId) {
        return ServiceResponse.failure(
          'Saved artwork not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      await this.savedArtworkRepository.delete(id);
      return ServiceResponse.success('Saved artwork removed', null);
    } catch (ex) {
      logger.error(
        `Error removing saved artwork ${id}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while removing saved artwork.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const savedArtworkService = new SavedArtworkService();
