import { StatusCodes } from 'http-status-codes';

import { MuseumRepository } from '@/api/museum/museumRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import {
  searchNearbyMuseums,
  searchMuseumsByText,
  getPlaceDetails,
  getPhotoUrl,
} from '@/common/services/googlePlaces';
import { logger } from '@/server';

export class MuseumService {
  private museumRepository: MuseumRepository;

  constructor(repository: MuseumRepository = new MuseumRepository()) {
    this.museumRepository = repository;
  }

  async findById(id: string) {
    try {
      const museum = await this.museumRepository.findById(id);
      if (!museum) {
        return ServiceResponse.failure(
          'Museum not found',
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      return ServiceResponse.success('Museum found', museum);
    } catch (ex) {
      logger.error(`Error finding museum ${id}: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while finding museum.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Nearby Search ───────────────────────────────────────
  // Searches Google Places for nearby museums, cross-references with our DB

  async findNearby(latitude: number, longitude: number, radiusMeters: number) {
    try {
      // Search Google Places for nearby museums
      const googleResults = await searchNearbyMuseums(
        latitude,
        longitude,
        radiusMeters,
      );

      // Enrich with our local DB data
      const enriched = await Promise.all(
        googleResults.map(async (place) => {
          const localMuseum = await this.museumRepository.findByGooglePlaceId(
            place.placeId,
          );
          return {
            placeId: place.placeId,
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            rating: place.rating,
            userRatingsTotal: place.userRatingsTotal,
            openNow: place.openNow,
            photoUrl: place.photoReference
              ? getPhotoUrl(place.photoReference)
              : undefined,
            distance: this.calculateDistance(
              latitude,
              longitude,
              place.latitude,
              place.longitude,
            ),
            museumId: localMuseum?.id,
          };
        }),
      );

      // Sort by distance
      enriched.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      return ServiceResponse.success('Nearby museums found', enriched);
    } catch (ex) {
      logger.error(`Error finding nearby museums: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while searching for nearby museums.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Text Search ─────────────────────────────────────────

  async search(query: string, latitude?: number, longitude?: number) {
    try {
      const googleResults = await searchMuseumsByText(
        query,
        latitude,
        longitude,
      );

      const enriched = await Promise.all(
        googleResults.map(async (place) => {
          const localMuseum = await this.museumRepository.findByGooglePlaceId(
            place.placeId,
          );
          return {
            placeId: place.placeId,
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            rating: place.rating,
            userRatingsTotal: place.userRatingsTotal,
            openNow: place.openNow,
            photoUrl: place.photoReference
              ? getPhotoUrl(place.photoReference)
              : undefined,
            distance:
              latitude && longitude
                ? this.calculateDistance(
                    latitude,
                    longitude,
                    place.latitude,
                    place.longitude,
                  )
                : undefined,
            museumId: localMuseum?.id,
          };
        }),
      );

      return ServiceResponse.success('Museums found', enriched);
    } catch (ex) {
      logger.error(`Error searching museums: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        'An error occurred while searching museums.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Get Details by Google Place ID ──────────────────────
  // Fetches full details from Google and saves/updates in our DB

  async getDetails(placeId: string) {
    try {
      // Fetch fresh details from Google Places
      const details = await getPlaceDetails(placeId);

      // Upsert into our database so we have it cached
      const museum = await this.museumRepository.upsertByGooglePlaceId(
        placeId,
        {
          name: details.name,
          address: details.address,
          phone: details.phone,
          websiteUrl: details.website,
          latitude: details.latitude,
          longitude: details.longitude,
          openingHours: details.openingHours as object | undefined,
          imageUrl: details.photoReferences[0]
            ? getPhotoUrl(details.photoReferences[0], 800)
            : undefined,
        },
      );

      // Parse city/state/country from the formatted address
      const addressParts = details.address.split(', ');
      if (addressParts.length >= 3) {
        await this.museumRepository.update(museum.id, {
          city: addressParts[addressParts.length - 3] || null,
          state: addressParts[addressParts.length - 2] || null,
          country: addressParts[addressParts.length - 1] || null,
        });
      }

      // Return the full museum record
      const fullMuseum = await this.museumRepository.findById(museum.id);
      return ServiceResponse.success('Museum details found', fullMuseum);
    } catch (ex) {
      logger.error(
        `Error getting museum details for ${placeId}: ${(ex as Error).message}`,
      );
      return ServiceResponse.failure(
        'An error occurred while fetching museum details.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Private Helpers ─────────────────────────────────────

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }
}

export const museumService = new MuseumService();
