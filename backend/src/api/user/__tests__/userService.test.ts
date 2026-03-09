import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';

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

  const mockUsers: User[] = [
    {
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
    },
    {
      id: 'user_2',
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Smith',
      avatarUrl: null,
      plan: 'MONTHLY',
      planExpiresAt: null,
      preferredLanguage: 'en',
      notificationsOn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    userRepositoryInstance = new UserRepository();
    userServiceInstance = new UserService(userRepositoryInstance);
  });

  describe('findAll', () => {
    it('return all users', async () => {
      (userRepositoryInstance.findAllAsync as Mock).mockReturnValue(mockUsers);

      const result = await userServiceInstance.findAll();

      expect(result.statusCode).toEqual(StatusCodes.OK);
      expect(result.success).toBeTruthy();
      expect(result.message).equals('Users found');
      expect(result.responseObject).toEqual(mockUsers);
    });

    it('returns a not found error for no users found', async () => {
      (userRepositoryInstance.findAllAsync as Mock).mockReturnValue(null);

      const result = await userServiceInstance.findAll();

      expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(result.success).toBeFalsy();
      expect(result.message).equals('No Users found');
      expect(result.responseObject).toBeNull();
    });

    it('handles errors for findAllAsync', async () => {
      (userRepositoryInstance.findAllAsync as Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await userServiceInstance.findAll();

      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).equals('An error occurred while retrieving users.');
      expect(result.responseObject).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns a user for a valid ID', async () => {
      const testId = 'user_1';
      const mockUser = mockUsers.find((user) => user.id === testId);
      (userRepositoryInstance.findByIdAsync as Mock).mockReturnValue(mockUser);

      const result = await userServiceInstance.findById(testId);

      expect(result.statusCode).toEqual(StatusCodes.OK);
      expect(result.success).toBeTruthy();
      expect(result.message).equals('User found');
      expect(result.responseObject).toEqual(mockUser);
    });

    it('handles errors for findByIdAsync', async () => {
      const testId = 'user_1';
      (userRepositoryInstance.findByIdAsync as Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await userServiceInstance.findById(testId);

      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).equals('An error occurred while finding user.');
      expect(result.responseObject).toBeNull();
    });

    it('returns a not found error for non-existent ID', async () => {
      const testId = 'missing-user';
      (userRepositoryInstance.findByIdAsync as Mock).mockReturnValue(null);

      const result = await userServiceInstance.findById(testId);

      expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(result.success).toBeFalsy();
      expect(result.message).equals('User not found');
      expect(result.responseObject).toBeNull();
    });
  });
});
