import { prisma } from '@/common/db/prisma';

const savedArtworkInclude = {
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
      museum: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  },
  collection: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export class SavedArtworkRepository {
  async findByUser(userId: string, limit = 50, offset = 0) {
    return prisma.savedArtwork.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      include: savedArtworkInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCollection(
    collectionId: string,
    userId: string,
    limit = 50,
    offset = 0,
  ) {
    return prisma.savedArtwork.findMany({
      where: { collectionId, userId },
      take: limit,
      skip: offset,
      include: savedArtworkInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.savedArtwork.findUnique({
      where: { id },
      include: savedArtworkInclude,
    });
  }

  async findByUserAndArtwork(
    userId: string,
    artworkId: string,
    collectionId: string,
  ) {
    return prisma.savedArtwork.findUnique({
      where: {
        collectionId_artworkId: {
          collectionId,
          artworkId,
        },
      },
    });
  }

  async create(data: {
    userId: string;
    artworkId?: string;
    collectionId: string;
    personalNote?: string;
    userPhotoUrl?: string;
    rating?: number;
    customTitle?: string;
    customArtist?: string;
    customYear?: number;
    customMedium?: string;
  }) {
    return prisma.savedArtwork.create({
      data,
      include: savedArtworkInclude,
    });
  }

  async update(
    id: string,
    data: {
      collectionId?: string;
      personalNote?: string | null;
      rating?: number | null;
      customTitle?: string | null;
      customArtist?: string | null;
      customYear?: number | null;
      customMedium?: string | null;
    },
  ) {
    return prisma.savedArtwork.update({
      where: { id },
      data,
      include: savedArtworkInclude,
    });
  }

  async delete(id: string) {
    return prisma.savedArtwork.delete({
      where: { id },
    });
  }

  async countByUser(userId: string) {
    return prisma.savedArtwork.count({
      where: { userId },
    });
  }
}
