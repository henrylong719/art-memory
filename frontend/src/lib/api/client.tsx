import type { InternalAxiosRequestConfig } from 'axios';
import type { TokenType } from '@/lib/auth/utils';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Env from 'env';
import { signOut } from '@/features/auth/use-auth-store';
import { clearUser } from '@/features/auth/use-user-store';
import { getToken, removeToken, setToken } from '@/lib/auth/utils';

export const client = axios.create({
  baseURL: Env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Token refresh helpers ──────────────────────────────
let isRefreshing = false;
let refreshPromise: Promise<TokenType> | null = null;

function shouldSignOutOnRefreshError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 401 || status === 403;
}

/**
 * Returns true if the access token will expire within the given buffer (ms).
 * Defaults to 60 seconds — enough time to complete a request before expiry.
 */
function isTokenExpiringSoon(accessToken: string, bufferMs = 60_000): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(accessToken);
    return exp * 1000 - Date.now() < bufferMs;
  } catch {
    return true; // treat decode failures as expired
  }
}

async function doRefresh(refreshToken: string): Promise<TokenType> {
  const { data } = await axios.post(
    `${Env.EXPO_PUBLIC_API_URL}/auth/refresh`,
    { refreshToken },
  );

  if (!data.success) {
    throw new Error('Refresh failed');
  }

  const newTokens: TokenType = {
    access: data.responseObject.tokens.accessToken,
    refresh: data.responseObject.tokens.refreshToken,
  };

  setToken(newTokens);
  return newTokens;
}

/**
 * Ensures we have a valid (non-expiring) access token.
 * Deduplicates concurrent refresh attempts via a shared promise.
 */
async function ensureFreshToken(): Promise<string | null> {
  const token = getToken();
  if (!token?.access) return null;

  // Token still fresh — use it as-is
  if (!isTokenExpiringSoon(token.access)) {
    return token.access;
  }

  // Need to refresh — deduplicate concurrent callers
  if (!isRefreshing) {
    isRefreshing = true;

    if (!token.refresh) {
      isRefreshing = false;
      return null;
    }

    refreshPromise = doRefresh(token.refresh).finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }

  try {
    const newTokens = await refreshPromise!;
    return newTokens.access;
  } catch (error) {
    if (shouldSignOutOnRefreshError(error)) {
      removeToken();
      signOut();
      clearUser();
      return null;
    }

    // Preserve the session on transient refresh failures (network/server).
    // The request may still fail, but the user should not be logged out.
    return token.access;
  }
}

// ─── Request Interceptor: Attach fresh access token ─────
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token logic for auth endpoints
    const url = config.url ?? '';
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')
    ) {
      return config;
    }

    const accessToken = await ensureFreshToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: Fallback refresh on 401 ──────
// This catches edge cases where the token expired between the
// preemptive check and the server receiving the request.
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (
      error.response?.status !== 401 ||
      isAuthEndpoint ||
      originalRequest._retry
    ) {
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

      const newTokens = await doRefresh(currentToken.refresh);

      // Process queued requests
      processQueue(null, newTokens.access);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Only sign out when the refresh token is actually invalid.
      if (shouldSignOutOnRefreshError(refreshError)) {
        removeToken();
        signOut();
        clearUser();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
