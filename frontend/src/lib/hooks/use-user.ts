import type { User } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/services';

export function useMe() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data } = await userApi.getMe();
      return data.responseObject;
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<Pick<User, 'firstName' | 'lastName' | 'avatarUrl' | 'preferredLanguage' | 'notificationsOn'>>,
    ) => {
      const { data } = await userApi.updateMe(input);
      return data.responseObject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
