import { prisma } from '@/common/db/prisma';
import crypto from 'node:crypto';

/**
 * Hash a raw refresh token with SHA-256.
 * Refresh tokens are high-entropy random values, so a fast hash is sufficient
 * (unlike passwords which need bcrypt). This prevents stolen DB data from
 * being directly usable as bearer tokens.
 */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

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

  /**
   * Creates a refresh token record. A random raw token is generated and
   * returned, but only its SHA-256 hash is persisted in the database.
   */
  async createRefreshToken(userId: string, expiresAt: Date) {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = hashToken(rawToken);
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
    return { token: rawToken };
  }

  /**
   * Looks up a refresh token by hashing the raw value and matching against
   * the stored hash.
   */
  async findRefreshToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
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

  async deleteRefreshToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    return prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  async deleteAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async getUserPasswordHash(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
      },
    });
  }
}
