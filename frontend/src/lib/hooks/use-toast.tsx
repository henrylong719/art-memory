import { useEffect, useRef, useState } from 'react';

export type ToastVariant = 'success' | 'error';

type ToastState = {
  visible: boolean;
  text: string;
  variant: ToastVariant;
};

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    text: '',
    variant: 'success',
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (text: string, variant: ToastVariant = 'success') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({
      visible: true,
      text,
      variant,
    });

    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    toast,
    showToast,
    hideToast: () => setToast((prev) => ({ ...prev, visible: false })),
  };
}
