import type {
  ApiResponse,
  Artist,
  Artwork,
  AuthResponse,
  Collection,
  LoginInput,
  Museum,
  NearbyMuseum,
  RegisterInput,
  SavedArtwork,
  Scan,
  User,
} from './types';
import { client } from './client';

// ─── Auth ────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterInput) =>
    client.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginInput) =>
    client.post<ApiResponse<AuthResponse>>('/auth/login', data),

  refresh: (refreshToken: string) =>
    client.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    client.post<ApiResponse<null>>('/auth/logout', { refreshToken }),

  logoutAll: () =>
    client.post<ApiResponse<null>>('/auth/logout-all'),

  socialLogin: (data: { provider: 'google' | 'facebook'; token: string }) =>
    client.post<ApiResponse<AuthResponse>>('/auth/social', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.post<ApiResponse<null>>('/auth/change-password', data),
};

// ─── User ────────────────────────────────────────────────

export const userApi = {
  getMe: () =>
    client.get<ApiResponse<User>>('/users/me'),

  updateMe: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatarUrl' | 'preferredLanguage' | 'notificationsOn'>>) =>
    client.patch<ApiResponse<User>>('/users/me', data),
};

// ─── Artist ──────────────────────────────────────────────

export const artistApi = {
  getAll: () =>
    client.get<ApiResponse<Artist[]>>('/artists'),

  getById: (id: string) =>
    client.get<ApiResponse<Artist>>(`/artists/${id}`),

  search: (q: string, limit = 10) =>
    client.get<ApiResponse<Artist[]>>('/artists/search', { params: { q, limit } }),
};

// ─── Artwork ─────────────────────────────────────────────

export const artworkApi = {
  getAll: () =>
    client.get<ApiResponse<Artwork[]>>('/artworks'),

  getById: (id: string) =>
    client.get<ApiResponse<Artwork>>(`/artworks/${id}`),

  search: (q: string, limit = 10) =>
    client.get<ApiResponse<Artwork[]>>('/artworks/search', { params: { q, limit } }),

  getByArtist: (artistId: string) =>
    client.get<ApiResponse<Artwork[]>>(`/artworks/artist/${artistId}`),

  generateStory: (id: string) =>
    client.post<ApiResponse<Artwork>>(`/artworks/${id}/generate-story`),

  create: (data: {
    title: string;
    artistName?: string;
    year?: number;
    medium?: string;
    imageUrl?: string;
    source?: string;
  }) =>
    client.post<ApiResponse<Artwork>>('/artworks', data),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(`/artworks/${id}`),
};

// ─── Scan ────────────────────────────────────────────────

export const scanApi = {
  getAll: () =>
    client.get<ApiResponse<Scan[]>>('/scans'),

  getById: (id: string) =>
    client.get<ApiResponse<Scan>>(`/scans/${id}`),

  // Mode 2: Artwork only
  scanArtwork: (imageFile: { uri: string; type: string; name: string }, location?: { latitude: number; longitude: number }) => {
    const formData = new FormData();
    formData.append('image', imageFile as unknown as Blob);
    if (location) {
      formData.append('latitude', String(location.latitude));
      formData.append('longitude', String(location.longitude));
    }
    return client.post<ApiResponse<Scan>>('/scans/artwork', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Mode 1: Artwork + Label combined
  scanCombined: (
    artworkFile: { uri: string; type: string; name: string },
    labelFile: { uri: string; type: string; name: string },
    location?: { latitude: number; longitude: number },
  ) => {
    const formData = new FormData();
    formData.append('artwork', artworkFile as unknown as Blob);
    formData.append('label', labelFile as unknown as Blob);
    if (location) {
      formData.append('latitude', String(location.latitude));
      formData.append('longitude', String(location.longitude));
    }
    return client.post<ApiResponse<Scan>>('/scans/combined', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  correct: (id: string, data: { userCorrectedTitle?: string; userCorrectedArtist?: string; artworkId?: string }) =>
    client.put<ApiResponse<Scan>>(`/scans/${id}/correct`, data),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(`/scans/${id}`),
};

// ─── Collection ──────────────────────────────────────────

export const collectionApi = {
  getAll: () =>
    client.get<ApiResponse<Collection[]>>('/collections'),

  getById: (id: string) =>
    client.get<ApiResponse<Collection>>(`/collections/${id}`),

  create: (data: { name: string; description?: string }) =>
    client.post<ApiResponse<Collection>>('/collections', data),

  update: (id: string, data: { name?: string; description?: string | null; coverUrl?: string | null }) =>
    client.put<ApiResponse<Collection>>(`/collections/${id}`, data),

  delete: (id: string) =>
    client.delete<ApiResponse<null>>(`/collections/${id}`),
};

// ─── SavedArtwork ────────────────────────────────────────

export const savedArtworkApi = {
  getAll: () =>
    client.get<ApiResponse<SavedArtwork[]>>('/saved-artworks'),

  getByCollection: (collectionId: string) =>
    client.get<ApiResponse<SavedArtwork[]>>(`/saved-artworks/collection/${collectionId}`),

  getById: (id: string) =>
    client.get<ApiResponse<SavedArtwork>>(`/saved-artworks/${id}`),

  save: (data: {
    artworkId?: string;
    collectionId?: string;
    personalNote?: string;
    userPhotoUrl?: string;
    rating?: number;
    customTitle?: string;
    customArtist?: string;
    customYear?: number;
    customMedium?: string;
  }) =>
    client.post<ApiResponse<SavedArtwork>>('/saved-artworks', data),

  update: (id: string, data: {
    collectionId?: string;
    personalNote?: string | null;
    rating?: number | null;
  }) =>
    client.put<ApiResponse<SavedArtwork>>(`/saved-artworks/${id}`, data),

  remove: (id: string) =>
    client.delete<ApiResponse<null>>(`/saved-artworks/${id}`),
};

// ─── Museum ──────────────────────────────────────────────

export const museumApi = {
  nearby: (latitude: number, longitude: number, radius = 5000) =>
    client.get<ApiResponse<NearbyMuseum[]>>('/museums/nearby', { params: { latitude, longitude, radius } }),

  search: (q: string, latitude?: number, longitude?: number) =>
    client.get<ApiResponse<NearbyMuseum[]>>('/museums/search', { params: { q, latitude, longitude } }),

  getDetails: (placeId: string) =>
    client.get<ApiResponse<Museum>>(`/museums/place/${placeId}`),

  getById: (id: string) =>
    client.get<ApiResponse<Museum>>(`/museums/${id}`),
};

// ─── Upload ─────────────────────────────────────────────

export const uploadApi = {
  image: (imageFile: { uri: string; type: string; name: string }) => {
    const formData = new FormData();
    formData.append('image', imageFile as unknown as Blob);
    return client.post<ApiResponse<{ url: string }>>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
