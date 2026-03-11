import { prisma } from '@/common/db/prisma';
import crypto from 'node:crypto';

export class AuthRepository {
  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        collections: {
          create: {
            name: 'My Collection',
            description: 'Default collection',
            isDefault: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
      },
    });
  }

  async createSocialUser(data: {
    email: string;
    googleId?: string;
    facebookId?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        collections: {
          create: {
            name: 'My Collection',
            description: 'Default collection',
            isDefault: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
      },
    });
  }

  async findUserBySocialId(field: 'googleId' | 'facebookId', value: string) {
    return prisma.user.findFirst({
      where: { [field]: value },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
      },
    });
  }

  async linkSocialId(
    userId: string,
    field: 'googleId' | 'facebookId',
    value: string,
    avatarUrl?: string,
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        [field]: value,
        ...(avatarUrl && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
      },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        plan: true,
      },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
      },
    });
  }

  async createRefreshToken(userId: string, expiresAt: Date) {
    const token = crypto.randomBytes(64).toString('hex');
    return prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            plan: true,
          },
        },
      },
    });
  }

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
