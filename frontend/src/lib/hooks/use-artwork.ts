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

export function useGenerateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (artworkId: string) => {
      const { data } = await artworkApi.generateStory(artworkId);
      return data.responseObject;
    },
    onSuccess: (_, artworkId) => {
      queryClient.invalidateQueries({ queryKey: ['artworks', artworkId] });
    },
  });
}
