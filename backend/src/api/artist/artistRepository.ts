import { prisma } from '@/common/db/prisma';

export class ArtistRepository {
  async findAll(limit = 20, offset = 0) {
    return prisma.artist.findMany({
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.artist.findUnique({
      where: { id },
      include: {
        artworks: {
          select: {
            id: true,
            title: true,
            year: true,
            medium: true,
            imageUrl: true,
          },
          orderBy: { year: 'asc' },
        },
      },
    });
  }

  async findByName(name: string) {
    return prisma.artist.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  async search(query: string, limit = 10) {
    return prisma.artist.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    name: string;
    birthYear?: number;
    deathYear?: number;
    nationality?: string;
    biography?: string;
    imageUrl?: string;
    wikiUrl?: string;
    source?: 'AI_GENERATED' | 'SEED_MET' | 'SEED_AIC' | 'SEED_WIKI' | 'MANUAL';
    externalId?: string;
  }) {
    return prisma.artist.create({ data });
  }

  async update(
    id: string,
    data: {
      name?: string;
      birthYear?: number | null;
      deathYear?: number | null;
      nationality?: string | null;
      biography?: string | null;
      imageUrl?: string | null;
      wikiUrl?: string | null;
      verified?: boolean;
    },
  ) {
    return prisma.artist.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.artist.delete({
      where: { id },
    });
  }

  async findOrCreate(
    name: string,
    additionalData?: {
      birthYear?: number;
      deathYear?: number;
      nationality?: string;
      biography?: string;
      imageUrl?: string;
      source?:
        | 'AI_GENERATED'
        | 'SEED_MET'
        | 'SEED_AIC'
        | 'SEED_WIKI'
        | 'MANUAL';
    },
  ) {
    const existing = await this.findByName(name);
    if (existing) return existing;

    return this.create({
      name,
      ...additionalData,
    });
  }
}
