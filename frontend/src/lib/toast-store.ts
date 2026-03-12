import { create } from 'zustand';

type ToastVariant = 'success' | 'error';

type ToastStore = {
  visible: boolean;
  text: string;
  variant: ToastVariant;
  show: (text: string, variant?: ToastVariant) => void;
  hide: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  visible: false,
  text: '',
  variant: 'success',
  show: (text, variant = 'success') => {
    set({ visible: true, text, variant });
  },
  hide: () => {
    set({ visible: false });
  },
}));

/**
 * Show a global toast that persists across screen navigations.
 * Call from anywhere — no hook context needed.
 */
export const showGlobalToast = (text: string, variant: ToastVariant = 'success') => {
  useToastStore.getState().show(text, variant);
};
