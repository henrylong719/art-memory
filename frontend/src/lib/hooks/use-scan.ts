import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scanApi } from '@/lib/api/services';

export function useScanHistory() {
  return useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      const { data } = await scanApi.getAll();
      return data.responseObject;
    },
  });
}

export function useScan(id: string) {
  return useQuery({
    queryKey: ['scans', id],
    queryFn: async () => {
      const { data } = await scanApi.getById(id);
      return data.responseObject;
    },
    enabled: !!id,
  });
}

export function useScanArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      imageFile,
      location,
    }: {
      imageFile: { uri: string; type: string; name: string };
      location?: { latitude: number; longitude: number };
    }) => {
      const { data } = await scanApi.scanArtwork(imageFile, location);
      return data.responseObject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
    },
  });
}

export function useScanCombined() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      artworkFile,
      labelFile,
      location,
    }: {
      artworkFile: { uri: string; type: string; name: string };
      labelFile: { uri: string; type: string; name: string };
      location?: { latitude: number; longitude: number };
    }) => {
      const { data } = await scanApi.scanCombined(artworkFile, labelFile, location);
      return data.responseObject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
    },
  });
}

export function useDeleteScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await scanApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export function useCorrectScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { userCorrectedTitle?: string; userCorrectedArtist?: string; artworkId?: string };
    }) => {
      const { data: response } = await scanApi.correct(id, data);
      return response.responseObject;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scans', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}
