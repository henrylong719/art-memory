import { prisma } from '@/common/db/prisma';

export class AiUsageLogRepository {
  async create(data: {
    userId: string;
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
}
