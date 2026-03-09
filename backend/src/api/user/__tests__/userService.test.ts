import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { User } from '@/api/user/userModel';
import { UserRepository } from '@/api/user/userRepository';
import { UserService } from '@/api/user/userService';

vi.mock('@/common/db/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/server', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/api/user/userRepository');

describe('userService', () => {
  let userServiceInstance: UserService;
  let userRepositoryInstance: UserRepository;

  const mockUser: User = {
    id: 'user_1',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Doe',
    avatarUrl: null,
    plan: 'FREE',
    planExpiresAt: null,
    preferredLanguage: 'en',
    notificationsOn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    userRepositoryInstance = new UserRepository();
    userServiceInstance = new UserService(userRepositoryInstance);
  });

  describe('findMe', () => {
    it('returns current user for a valid ID', async () => {
      (userRepositoryInstance.findByIdAsync as Mock).mockReturnValue(mockUser);

      const result = await userServiceInstance.findMe('user_1');

      expect(result.statusCode).toEqual(StatusCodes.OK);
      expect(result.success).toBeTruthy();
      expect(result.message).equals('User found');
      expect(result.responseObject).toEqual(mockUser);
    });

    it('returns not found when user does not exist', async () => {
      (userRepositoryInstance.findByIdAsync as Mock).mockReturnValue(null);

      const result = await userServiceInstance.findMe('missing-user');

      expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(result.success).toBeFalsy();
      expect(result.message).equals('User not found');
      expect(result.responseObject).toBeNull();
    });

    it('handles repository errors', async () => {
      (userRepositoryInstance.findByIdAsync as Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await userServiceInstance.findMe('user_1');

      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).equals(
        'An error occurred while retrieving your profile.',
      );
      expect(result.responseObject).toBeNull();
    });
  });

  describe('updateMe', () => {
    it('updates a user profile when user exists', async () => {
      const updatePayload = { firstName: 'Alicia' };
      const updatedUser = { ...mockUser, ...updatePayload };

      (userRepositoryInstance.findByIdAsync as Mock).mockReturnValue(mockUser);
      (userRepositoryInstance.updateAsync as Mock).mockReturnValue(updatedUser);

      const result = await userServiceInstance.updateMe('user_1', updatePayload);

      expect(result.statusCode).toEqual(StatusCodes.OK);
      expect(result.success).toBeTruthy();
      expect(result.message).equals('User updated');
      expect(result.responseObject).toEqual(updatedUser);
    });

    it('returns not found when trying to update a missing user', async () => {
      (userRepositoryInstance.findByIdAsync as Mock).mockReturnValue(null);

      const result = await userServiceInstance.updateMe('missing-user', {
        firstName: 'Alicia',
      });

      expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(result.success).toBeFalsy();
      expect(result.message).equals('User not found');
      expect(result.responseObject).toBeNull();
    });

    it('handles repository errors during update', async () => {
      (userRepositoryInstance.findByIdAsync as Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await userServiceInstance.updateMe('user_1', {
        preferredLanguage: 'fr',
      });

      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).equals(
        'An error occurred while updating your profile.',
      );
      expect(result.responseObject).toBeNull();
    });
  });
});
