// ─── API Response Wrapper ────────────────────────────────

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  responseObject: T;
  statusCode: number;
};

// ─── Auth ────────────────────────────────────────────────

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  plan: 'FREE' | 'MONTHLY' | 'YEARLY';
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SocialLoginInput = {
  provider: 'google' | 'facebook';
  token: string;
};

// ─── User ────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  plan: 'FREE' | 'MONTHLY' | 'YEARLY';
  planExpiresAt: string | null;
  preferredLanguage: string;
  notificationsOn: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Artist ──────────────────────────────────────────────

export type Artist = {
  id: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  nationality: string | null;
  biography: string | null;
  imageUrl: string | null;
  wikiUrl: string | null;
  source: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Artwork ─────────────────────────────────────────────

export type ArtworkArtist = {
  id: string;
  name: string;
  nationality: string | null;
  imageUrl: string | null;
};

export type ArtworkMuseum = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
};

export type Artwork = {
  id: string;
  title: string;
  year: number | null;
  medium: string | null;
  dimensions: string | null;
  style: string | null;
  description: string | null;
  imageUrl: string | null;
  wikiUrl: string | null;
  artistId: string | null;
  museumId: string | null;
  source: string;
  verified: boolean;
  correctionCount: number;
  createdAt: string;
  updatedAt: string;
  artist: ArtworkArtist | null;
  museum: ArtworkMuseum | null;
};

// ─── Scan ────────────────────────────────────────────────

export type Scan = {
  id: string;
  userId: string;
  scanType: 'ARTWORK' | 'COMBINED';
  imageUrl: string;
  labelImageUrl: string | null;
  artworkId: string | null;
  confidence: number | null;
  rawAiResult: unknown;
  extractedText: string | null;
  userCorrectedTitle: string | null;
  userCorrectedArtist: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  artwork: {
    id: string;
    title: string;
    year: number | null;
    medium: string | null;
    imageUrl: string | null;
    artist: {
      id: string;
      name: string;
      nationality: string | null;
    } | null;
  } | null;
};

// ─── Collection ──────────────────────────────────────────

export type Collection = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    savedArtworks: number;
  };
  savedArtworks?: Array<{
    id: string;
    artwork: { imageUrl: string | null } | null;
    userPhotoUrl: string | null;
  }>;
};

// ─── SavedArtwork ────────────────────────────────────────

export type SavedArtwork = {
  id: string;
  userId: string;
  artworkId: string | null;
  collectionId: string;
  personalNote: string | null;
  userPhotoUrl: string | null;
  rating: number | null;
  customTitle: string | null;
  customArtist: string | null;
  customYear: number | null;
  customMedium: string | null;
  createdAt: string;
  updatedAt: string;
  artwork: {
    id: string;
    title: string;
    year: number | null;
    medium: string | null;
    imageUrl: string | null;
    artist: {
      id: string;
      name: string;
      nationality: string | null;
    } | null;
    museum: {
      id: string;
      name: string;
      city: string | null;
    } | null;
  } | null;
  collection: {
    id: string;
    name: string;
  };
};

// ─── Museum ──────────────────────────────────────────────

export type NearbyMuseum = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  photoUrl?: string;
  distance?: number;
  museumId?: string;
};

export type Museum = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  googlePlaceId: string | null;
  openingHours: Record<string, string> | null;
  admissionInfo: string | null;
  createdAt: string;
  updatedAt: string;
};
