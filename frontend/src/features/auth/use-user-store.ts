import type { AuthUser } from '@/lib/api/types';
import { create } from 'zustand';
import { createSelectors } from '@/lib/utils';

type UserState = {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

const _useUserStore = create<UserState>(set => ({
  user: null,
  setUser: user => set({ user }),
  clearUser: () => set({ user: null }),
}));

export const useUserStore = createSelectors(_useUserStore);
export const setUser = (user: AuthUser) => _useUserStore.getState().setUser(user);
export const clearUser = () => _useUserStore.getState().clearUser();
