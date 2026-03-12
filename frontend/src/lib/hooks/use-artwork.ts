import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { artworkApi } from '@/lib/api/services';

export function useArtworks() {
  return useQuery({
    queryKey: ['artworks'],
    queryFn: async () => {
      const { data } = await artworkApi.getAll();
      return data.responseObject;
    },
  });
}

export function useArtwork(id: string) {
  return useQuery({
    queryKey: ['artworks', id],
    queryFn: async () => {
      const { data } = await artworkApi.getById(id);
      return data.responseObject;
    },
    enabled: !!id,
  });
}

export function useSearchArtworks(query: string) {
  return useQuery({
    queryKey: ['artworks', 'search', query],
    queryFn: async () => {
      const { data } = await artworkApi.search(query);
      return data.responseObject;
    },
    enabled: query.length > 0,
  });
}

export function useCreateArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      artistName?: string;
      year?: number;
      medium?: string;
      imageUrl?: string;
      source?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      const { data } = await artworkApi.create(input);
      return data.responseObject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
    },
  });
}

export function useUpdateArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      title?: string;
      year?: number | null;
      medium?: string | null;
      description?: string | null;
    }) => {
      const { data } = await artworkApi.update(id, input);
      return data.responseObject;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artworks', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['saved-artworks'] });
    },
  });
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await artworkApi.delete(id);
      return id;
    },
    onSuccess: (_data, deletedId) => {
      // Remove the individual artwork query so the detail screen
      // doesn't flash a "not found" state during navigation.
      queryClient.removeQueries({ queryKey: ['artworks', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['saved-artworks'] });
    },
  });
}

export type StoryMeta = {
  used: number;
  limit: number;
  remaining: number;
  cooldownSeconds: number;
  plan: string;
};

export type StoryLimitError = {
  type: 'cooldown' | 'daily_limit';
  message: string;
  cooldownRemaining?: number;
  used?: number;
  limit?: number;
  plan?: string;
};

export function useGenerateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (artworkId: string) => {
      try {
        const { data } = await artworkApi.generateStory(artworkId);
        return data.responseObject as typeof data.responseObject & {
          _storyMeta?: StoryMeta;
        };
      } catch (error: any) {
        // Extract structured error info from 429 responses
        const responseData = error?.response?.data;
        if (error?.response?.status === 429 && responseData?.responseObject) {
          const obj = responseData.responseObject;
          const limitError: StoryLimitError = obj.cooldownRemaining
            ? {
                type: 'cooldown',
                message: responseData.message,
                cooldownRemaining: obj.cooldownRemaining,
              }
            : {
                type: 'daily_limit',
                message: responseData.message,
                used: obj.used,
                limit: obj.limit,
                plan: obj.plan,
              };
          throw limitError;
        }
        throw error;
      }
    },
    onSuccess: (_, artworkId) => {
      queryClient.invalidateQueries({ queryKey: ['artworks', artworkId] });
    },
  });
}
