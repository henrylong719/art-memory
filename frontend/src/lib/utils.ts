import type { AxiosError } from 'axios';
import type { StoreApi, UseBoundStore } from 'zustand';
import { Linking } from 'react-native';

/**
 * Extract a user-friendly error message from an unknown error.
 * Handles Axios errors, standard Error objects, and network failures.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error) return fallback;

  const axiosErr = error as AxiosError<{
    message?: string;
    responseObject?: { message?: string };
  }>;
  const serverMessage =
    axiosErr?.response?.data?.message ??
    axiosErr?.response?.data?.responseObject?.message;

  if (axiosErr?.code === 'ERR_NETWORK' || axiosErr?.message === 'Network Error') {
    return 'No internet connection. Please check your network and try again.';
  }
  if (axiosErr?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }
  if (axiosErr?.response?.status === 401) {
    return serverMessage || 'Your session has expired. Please sign in again.';
  }
  if (axiosErr?.response?.status === 403) {
    return serverMessage || "You don't have permission to do that.";
  }
  if (axiosErr?.response?.status === 404) {
    return serverMessage || "We couldn't find what you were looking for.";
  }
  if (axiosErr?.response?.status && axiosErr.response.status >= 500) {
    return serverMessage || 'The server is having trouble right now. Please try again.';
  }
  if (serverMessage) {
    return serverMessage;
  }

  // Standard Error
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then(canOpen => canOpen && Linking.openURL(url));
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export function createSelectors<S extends UseBoundStore<StoreApi<object>>>(_store: S) {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store(s => s[k as keyof typeof s]);
  }

  return store;
}
