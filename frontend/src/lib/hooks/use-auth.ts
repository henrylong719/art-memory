import type { LoginInput, RegisterInput } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import { signIn, signOut } from '@/features/auth/use-auth-store';
import { authApi } from '@/lib/api/services';
import { getToken, removeToken } from '@/lib/auth/utils';

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await authApi.register(input);
      return data.responseObject;
    },
    onSuccess: (result) => {
      const tokens = {
        access: result.tokens.accessToken,
        refresh: result.tokens.refreshToken,
      };
      signIn(tokens);
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await authApi.login(input);
      return data.responseObject;
    },
    onSuccess: (result) => {
      const tokens = {
        access: result.tokens.accessToken,
        refresh: result.tokens.refreshToken,
      };
      signIn(tokens);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      if (token?.refresh) {
        await authApi.logout(token.refresh).catch(() => {});
      }
    },
    onSettled: () => {
      removeToken();
      signOut();
    },
  });
}
