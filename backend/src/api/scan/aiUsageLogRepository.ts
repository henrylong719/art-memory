import { prisma } from '@/common/db/prisma';

export class AiUsageLogRepository {
  async create(data: {
    userId: string;
    artworkId?: string;
    endpoint: string;
    model: string;
    tokensIn?: number | null;
    tokensOut?: number | null;
    costUsd?: number;
    durationMs?: number | null;
    success: boolean;
    errorMsg?: string;
  }) {
    return prisma.aiUsageLog.create({ data });
  }

  /**
   * Count successful AI calls for a given user + endpoint since a given date.
   */
  async countSince(userId: string, endpoint: string, since: Date) {
    return prisma.aiUsageLog.count({
      where: {
        userId,
        endpoint,
        success: true,
        createdAt: { gte: since },
      },
    });
  }

  /**
   * Get the most recent successful story generation for a user + artwork + endpoint.
   */
  async findLatestForArtwork(
    userId: string,
    artworkId: string,
    endpoint: string,
  ) {
    return prisma.aiUsageLog.findFirst({
      where: { userId, artworkId, endpoint, success: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
