import { prisma } from '@/common/db/prisma';
import { Prisma } from '@generated/prisma/client';

export class MuseumRepository {
  async findAll(limit = 50, offset = 0) {
    return prisma.museum.findMany({
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.museum.findUnique({
      where: { id },
      include: {
        artworks: {
          select: {
            id: true,
            title: true,
            year: true,
            imageUrl: true,
            artist: {
              select: { id: true, name: true },
            },
          },
          take: 20,
          orderBy: { title: 'asc' },
        },
      },
    });
  }

  async findByGooglePlaceId(googlePlaceId: string) {
    return prisma.museum.findUnique({
      where: { googlePlaceId },
    });
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 5) {
    // Prisma doesn't support PostGIS natively, so we use a bounding box + sort by distance
    const latDelta = radiusKm / 111; // ~111km per degree of latitude
    const lngDelta = radiusKm / (111 * Math.cos(latitude * (Math.PI / 180)));

    const museums = await prisma.museum.findMany({
      where: {
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta,
        },
      },
    });

    // Calculate actual distance and sort
    return museums
      .map((museum) => ({
        ...museum,
        distance: this.haversineDistance(
          latitude,
          longitude,
          museum.latitude,
          museum.longitude,
        ),
      }))
      .filter((m) => m.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  async create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    websiteUrl?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude: number;
    longitude: number;
    googlePlaceId?: string;
    openingHours?: object;
    admissionInfo?: string;
  }) {
    return prisma.museum.create({ data });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      imageUrl?: string | null;
      websiteUrl?: string | null;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      openingHours?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
      admissionInfo?: string | null;
    },
  ) {
    return prisma.museum.update({
      where: { id },
      data,
    });
  }

  async upsertByGooglePlaceId(
    googlePlaceId: string,
    data: {
      name: string;
      address?: string;
      phone?: string;
      websiteUrl?: string;
      latitude: number;
      longitude: number;
      openingHours?: object;
      imageUrl?: string;
    },
  ) {
    return prisma.museum.upsert({
      where: { googlePlaceId },
      create: {
        googlePlaceId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }

  // Haversine formula for distance between two lat/lng points (in km)
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // Round to 2 decimal places
  }
}
