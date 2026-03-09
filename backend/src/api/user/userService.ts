import { StatusCodes } from 'http-status-codes';
import type { User } from '@/api/user/userModel';
import { UserRepository } from '@/api/user/userRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

export class UserService {
  private userRepository: UserRepository;

  constructor(repository: UserRepository = new UserRepository()) {
    this.userRepository = repository;
  }

  async findMe(userId: string): Promise<ServiceResponse<User | null>> {
    try {
      const user = await this.userRepository.findByIdAsync(userId);
      if (!user) {
        return ServiceResponse.failure(
          'User not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success('User found', user);
    } catch (ex) {
      logger.error(
        `Error finding current user ${userId}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while retrieving your profile.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateMe(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      preferredLanguage?: string;
      notificationsOn?: boolean;
    },
  ): Promise<ServiceResponse<User | null>> {
    try {
      const existing = await this.userRepository.findByIdAsync(userId);
      if (!existing) {
        return ServiceResponse.failure(
          'User not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const user = await this.userRepository.updateAsync(userId, data);
      return ServiceResponse.success('User updated', user);
    } catch (ex) {
      logger.error(
        `Error updating current user ${userId}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while updating your profile.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const userService = new UserService();
