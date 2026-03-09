import { prisma } from '@/common/db/prisma';

// Fields to select (exclude passwordHash from all queries)
const userPublicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  plan: true,
  planExpiresAt: true,
  preferredLanguage: true,
  notificationsOn: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class UserRepository {
  async findAllAsync() {
    return prisma.user.findMany({
      select: userPublicSelect,
    });
  }

  async findByIdAsync(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });
  }

  async findByEmailAsync(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async updateAsync(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      preferredLanguage?: string;
      notificationsOn?: boolean;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect,
    });
  }
}
