import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collectionApi, savedArtworkApi } from '@/lib/api/services';

// ─── Collections ─────────────────────────────────────────

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data } = await collectionApi.getAll();
      return data.responseObject;
    },
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ['collections', id],
    queryFn: async () => {
      const { data } = await collectionApi.getById(id);
      return data.responseObject;
    },
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data } = await collectionApi.create(input);
      return data.responseObject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await collectionApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

// ─── Saved Artworks ──────────────────────────────────────

export function useSavedArtworks() {
  return useQuery({
    queryKey: ['saved-artworks'],
    queryFn: async () => {
      const { data } = await savedArtworkApi.getAll();
      return data.responseObject;
    },
  });
}

export function useSavedArtworksByCollection(collectionId: string) {
  return useQuery({
    queryKey: ['saved-artworks', 'collection', collectionId],
    queryFn: async () => {
      const { data } = await savedArtworkApi.getByCollection(collectionId);
      return data.responseObject;
    },
    enabled: !!collectionId,
  });
}

export function useSaveArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      artworkId?: string;
      collectionId?: string;
      personalNote?: string;
      userPhotoUrl?: string;
      rating?: number;
      customTitle?: string;
      customArtist?: string;
      customYear?: number;
      customMedium?: string;
    }) => {
      const { data } = await savedArtworkApi.save(input);
      return data.responseObject;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['saved-artworks'] });

      const previousSaved = queryClient.getQueryData(['saved-artworks']);

      // Optimistically add a placeholder entry
      queryClient.setQueryData<any[]>(['saved-artworks'], (old) => [
        ...(old ?? []),
        {
          id: `optimistic-${Date.now()}`,
          artworkId: input.artworkId,
          collectionId: input.collectionId,
          createdAt: new Date().toISOString(),
        },
      ]);

      return { previousSaved };
    },
    onError: (_err, _input, context) => {
      if (context?.previousSaved) {
        queryClient.setQueryData(['saved-artworks'], context.previousSaved);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-artworks'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useRemoveSavedArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await savedArtworkApi.remove(id);
    },
    onMutate: async (removedId) => {
      await queryClient.cancelQueries({ queryKey: ['saved-artworks'] });

      const previousSaved = queryClient.getQueryData(['saved-artworks']);

      // Optimistically remove from list
      queryClient.setQueryData<any[]>(['saved-artworks'], (old) =>
        old?.filter((s) => s.id !== removedId),
      );

      return { previousSaved };
    },
    onError: (_err, _id, context) => {
      if (context?.previousSaved) {
        queryClient.setQueryData(['saved-artworks'], context.previousSaved);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-artworks'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
