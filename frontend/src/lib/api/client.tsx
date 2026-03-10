import type { InternalAxiosRequestConfig } from 'axios';
import type { TokenType } from '@/lib/auth/utils';
import axios from 'axios';
import Constants from 'expo-constants';
import Env from 'env';
import { signOut } from '@/features/auth/use-auth-store';
import { getToken, removeToken, setToken } from '@/lib/auth/utils';

// In development, derive the API host from the Metro bundler connection so the
// correct LAN IP is always used regardless of network changes. Falls back to the
// explicitly configured URL (required for preview/production builds).
function getBaseUrl(): string {
  if (__DEV__) {
    const metroHost = Constants.expoConfig?.hostUri?.split(':').shift();
    if (metroHost) return `http://${metroHost}:8080`;
  }
  return Env.EXPO_PUBLIC_API_URL ?? '';
}

const BASE_URL = getBaseUrl();

export const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach access token ────────────
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token?.access) {
      config.headers.Authorization = `Bearer ${token.access}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// ─── Response Interceptor: Auto-refresh on 401 ──────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    }
    else {
      promise.reject(error);
    }
  });
  failedQueue = [];
}

client.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints
    const isAuthEndpoint
      = originalRequest?.url?.includes('/auth/login')
        || originalRequest?.url?.includes('/auth/register')
        || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status !== 401 || isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(client(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const currentToken = getToken();

      if (!currentToken?.refresh) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint directly (bypass interceptors)
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        { refreshToken: currentToken.refresh },
      );

      if (!data.success) {
        throw new Error('Refresh failed');
      }

      const newTokens: TokenType = {
        access: data.responseObject.tokens.accessToken,
        refresh: data.responseObject.tokens.refreshToken,
      };

      // Store new tokens
      setToken(newTokens);

      // Process queued requests
      processQueue(null, newTokens.access);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
      return client(originalRequest);
    }
    catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — sign out the user
      removeToken();
      signOut();
      return Promise.reject(refreshError);
    }
    finally {
      isRefreshing = false;
    }
  },
);
