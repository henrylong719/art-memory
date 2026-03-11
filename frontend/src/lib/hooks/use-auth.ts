import type { LoginInput, RegisterInput, SocialLoginInput } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import { signIn, signOut } from '@/features/auth/use-auth-store';
import { setUser } from '@/features/auth/use-user-store';
import { authApi } from '@/lib/api/services';
import { getToken, removeToken } from '@/lib/auth/utils';

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await authApi.register(input);
      return data.responseObject;
    },
    onSuccess: (result) => {
      signIn({
        access: result.tokens.accessToken,
        refresh: result.tokens.refreshToken,
      });
      setUser(result.user);
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
      signIn({
        access: result.tokens.accessToken,
        refresh: result.tokens.refreshToken,
      });
      setUser(result.user);
    },
  });
}

export function useSocialLogin() {
  return useMutation({
    mutationFn: async (input: SocialLoginInput) => {
      const { data } = await authApi.socialLogin(input);
      return data.responseObject;
    },
    onSuccess: (result) => {
      signIn({
        access: result.tokens.accessToken,
        refresh: result.tokens.refreshToken,
      });
      setUser(result.user);
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

export function useLogoutAll() {
  return useMutation({
    mutationFn: async () => {
      await authApi.logoutAll();
    },
    onSettled: () => {
      removeToken();
      signOut();
    },
  });
}
