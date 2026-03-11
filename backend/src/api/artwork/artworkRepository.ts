import { prisma } from '@/common/db/prisma';

const artworkInclude = {
  artist: {
    select: {
      id: true,
      name: true,
      nationality: true,
      imageUrl: true,
    },
  },
  museum: {
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
    },
  },
} as const;

export class ArtworkRepository {
  async findAll(limit = 20, offset = 0) {
    return prisma.artwork.findMany({
      take: limit,
      skip: offset,
      include: artworkInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.artwork.findUnique({
      where: { id },
      include: artworkInclude,
    });
  }

  async search(query: string, limit = 10) {
    return prisma.artwork.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { artist: { name: { contains: query, mode: 'insensitive' } } },
          { style: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: artworkInclude,
      orderBy: { title: 'asc' },
    });
  }

  async findByTitleAndArtist(title: string, artistId: string) {
    return prisma.artwork.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        artistId,
      },
      include: artworkInclude,
    });
  }

  async findByArtist(artistId: string) {
    return prisma.artwork.findMany({
      where: { artistId },
      include: artworkInclude,
      orderBy: { year: 'asc' },
    });
  }

  async create(data: {
    title: string;
    year?: number;
    medium?: string;
    dimensions?: string;
    style?: string;
    description?: string;
    imageUrl?: string;
    wikiUrl?: string;
    artistId?: string;
    museumId?: string;
    source?: 'AI_GENERATED' | 'SEED_MET' | 'SEED_AIC' | 'SEED_WIKI' | 'MANUAL';
    externalId?: string;
  }) {
    return prisma.artwork.create({
      data,
      include: artworkInclude,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      year?: number | null;
      medium?: string | null;
      dimensions?: string | null;
      style?: string | null;
      description?: string | null;
      imageUrl?: string | null;
      wikiUrl?: string | null;
      artistId?: string | null;
      museumId?: string | null;
      verified?: boolean;
      verifiedAt?: Date;
      verifiedBy?: string;
      correctionCount?: { increment: number };
    },
  ) {
    return prisma.artwork.update({
      where: { id },
      data,
      include: artworkInclude,
    });
  }

  async disconnectRelations(id: string) {
    await prisma.scan.updateMany({
      where: { artworkId: id },
      data: { artworkId: null },
    });
    await prisma.savedArtwork.deleteMany({
      where: { artworkId: id },
    });
  }

  async delete(id: string) {
    return prisma.artwork.delete({
      where: { id },
    });
  }

  async incrementCorrectionCount(id: string) {
    return prisma.artwork.update({
      where: { id },
      data: {
        correctionCount: { increment: 1 },
      },
    });
  }
}
