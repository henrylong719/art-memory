import { StatusCodes } from 'http-status-codes';

import { CollectionRepository } from '@/api/collection/collectionRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

export class CollectionService {
  private collectionRepository: CollectionRepository;

  constructor(repository: CollectionRepository = new CollectionRepository()) {
    this.collectionRepository = repository;
  }

  async findByUser(userId: string) {
    try {
      const collections = await this.collectionRepository.findByUser(userId);
      return ServiceResponse.success('Collections found', collections);
    } catch (ex) {
      logger.error(
        `Error finding collections for user ${userId}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while retrieving collections.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: string, userId: string) {
    try {
      const collection = await this.collectionRepository.findById(id);
      if (!collection) {
        return ServiceResponse.failure(
          'Collection not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Ensure the collection belongs to the requesting user
      if (collection.userId !== userId) {
        return ServiceResponse.failure(
          'Collection not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success('Collection found', collection);
    } catch (ex) {
      logger.error(`Error finding collection ${id}: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while finding collection.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      coverUrl?: string;
    },
  ) {
    try {
      const collection = await this.collectionRepository.create({
        userId,
        ...data,
      });
      return ServiceResponse.success(
        'Collection created',
        collection,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      logger.error(`Error creating collection: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while creating collection.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string | null;
      coverUrl?: string | null;
    },
  ) {
    try {
      const existing = await this.collectionRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure(
          'Collection not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (existing.userId !== userId) {
        return ServiceResponse.failure(
          'Collection not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const collection = await this.collectionRepository.update(id, data);
      return ServiceResponse.success('Collection updated', collection);
    } catch (ex) {
      logger.error(`Error updating collection ${id}: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while updating collection.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string, userId: string) {
    try {
      const existing = await this.collectionRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure(
          'Collection not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (existing.userId !== userId) {
        return ServiceResponse.failure(
          'Collection not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Prevent deleting the default collection
      if (existing.isDefault) {
        return ServiceResponse.failure(
          'Cannot delete the default collection',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      await this.collectionRepository.delete(id);
      return ServiceResponse.success('Collection deleted', null);
    } catch (ex) {
      logger.error(`Error deleting collection ${id}: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while deleting collection.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const collectionService = new CollectionService();
