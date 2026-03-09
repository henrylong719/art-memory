import { env } from '@/common/utils/envConfig';
import { logger } from '@/server';

const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// ─── Types ───────────────────────────────────────────────

export interface GooglePlaceResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  photoReference?: string;
  types: string[];
}

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  openingHours?: { [key: string]: string };
  photoReferences: string[];
}

// ─── Nearby Search ───────────────────────────────────────

export async function searchNearbyMuseums(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000,
): Promise<GooglePlaceResult[]> {
  const url = new URL(`${PLACES_BASE_URL}/nearbysearch/json`);
  url.searchParams.set('location', `${latitude},${longitude}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('type', 'museum');
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    logger.error(
      `Google Places API error: ${data.status} - ${data.error_message || ''}`,
    );
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return (data.results || []).map((place: any) => ({
    placeId: place.place_id,
    name: place.name,
    address: place.vicinity || '',
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    openNow: place.opening_hours?.open_now,
    photoReference: place.photos?.[0]?.photo_reference,
    types: place.types || [],
  }));
}

// ─── Text Search (for "art gallery", "art museum") ──────

export async function searchMuseumsByText(
  query: string,
  latitude?: number,
  longitude?: number,
): Promise<GooglePlaceResult[]> {
  const url = new URL(`${PLACES_BASE_URL}/textsearch/json`);
  url.searchParams.set('query', query);
  url.searchParams.set('type', 'museum');
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);

  if (latitude && longitude) {
    url.searchParams.set('location', `${latitude},${longitude}`);
    url.searchParams.set('radius', '50000'); // 50km for text search
  }

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    logger.error(`Google Places text search error: ${data.status}`);
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return (data.results || []).map((place: any) => ({
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address || '',
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    openNow: place.opening_hours?.open_now,
    photoReference: place.photos?.[0]?.photo_reference,
    types: place.types || [],
  }));
}

// ─── Place Details ───────────────────────────────────────

export async function getPlaceDetails(
  placeId: string,
): Promise<GooglePlaceDetails> {
  const url = new URL(`${PLACES_BASE_URL}/details/json`);
  url.searchParams.set('place_id', placeId);
  url.searchParams.set(
    'fields',
    'place_id,name,formatted_address,formatted_phone_number,website,geometry,rating,opening_hours,photos',
  );
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== 'OK') {
    logger.error(`Google Places details error: ${data.status}`);
    throw new Error(`Google Places API error: ${data.status}`);
  }

  const result = data.result;

  // Parse opening hours into a clean object
  let openingHours: { [key: string]: string } | undefined;
  if (result.opening_hours?.weekday_text) {
    openingHours = {};
    for (const line of result.opening_hours.weekday_text) {
      const [day, ...hours] = line.split(': ');
      openingHours[day.toLowerCase().slice(0, 3)] = hours.join(': ');
    }
  }

  return {
    placeId: result.place_id,
    name: result.name,
    address: result.formatted_address || '',
    phone: result.formatted_phone_number,
    website: result.website,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    rating: result.rating,
    openingHours,
    photoReferences: (result.photos || []).map((p: any) => p.photo_reference),
  };
}

// ─── Photo URL helper ────────────────────────────────────

export function getPhotoUrl(
  photoReference: string,
  maxWidth: number = 400,
): string {
  return `${PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${env.GOOGLE_PLACES_API_KEY}`;
}
