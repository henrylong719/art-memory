/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx client errors (including 429)
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          (error as any).response?.status >= 400 &&
          (error as any).response?.status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 30, // 30s — reduces duplicate refetches
    },
    mutations: {
      retry: false,
    },
  },
});

export function APIProvider({ children }: { children: ReactNode }) {
  useReactQueryDevTools(queryClient);
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
