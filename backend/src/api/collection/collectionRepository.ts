import { prisma } from '@/common/db/prisma';

export class CollectionRepository {
  async findByUser(userId: string) {
    return prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { savedArtworks: true },
        },
        // Get first 4 saved artworks for cover preview
        savedArtworks: {
          take: 4,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userPhotoUrl: true,
            artwork: {
              select: { imageUrl: true },
            },
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' }, // Default collection first
        { updatedAt: 'desc' },
      ],
    });
  }

  async findById(id: string) {
    return prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { savedArtworks: true },
        },
      },
    });
  }

  async findDefaultByUser(userId: string) {
    return prisma.collection.findFirst({
      where: { userId, isDefault: true },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    description?: string;
    coverUrl?: string;
  }) {
    return prisma.collection.create({
      data,
      include: {
        _count: {
          select: { savedArtworks: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      coverUrl?: string | null;
    },
  ) {
    return prisma.collection.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { savedArtworks: true },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.collection.delete({
      where: { id },
    });
  }
}
