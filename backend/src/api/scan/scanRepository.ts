import { prisma } from '@/common/db/prisma';

const scanInclude = {
  artwork: {
    select: {
      id: true,
      title: true,
      year: true,
      medium: true,
      imageUrl: true,
      artist: {
        select: {
          id: true,
          name: true,
          nationality: true,
        },
      },
    },
  },
} as const;

export class ScanRepository {
  async findByUser(userId: string, limit = 50, offset = 0) {
    return prisma.scan.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      include: scanInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.scan.findUnique({
      where: { id },
      include: scanInclude,
    });
  }

  async create(data: {
    userId: string;
    scanType: 'ARTWORK' | 'COMBINED';
    imageUrl: string;
    labelImageUrl?: string;
    artworkId?: string;
    confidence?: number;
    rawAiResult?: object;
    extractedText?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return prisma.scan.create({
      data,
      include: scanInclude,
    });
  }

  async update(
    id: string,
    data: {
      artworkId?: string;
      userCorrectedTitle?: string;
      userCorrectedArtist?: string;
    },
  ) {
    return prisma.scan.update({
      where: { id },
      data,
      include: scanInclude,
    });
  }

  async countByUser(userId: string) {
    return prisma.scan.count({
      where: { userId },
    });
  }
}
