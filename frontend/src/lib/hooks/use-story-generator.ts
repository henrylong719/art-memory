import { useCallback, useEffect, useRef, useState } from 'react';
import { useGenerateStory, type StoryLimitError } from './use-artwork';

type UseStoryGeneratorOptions = {
  artworkId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: StoryLimitError | Error) => void;
};

export function useStoryGenerator({
  artworkId,
  onSuccess,
  onError,
}: UseStoryGeneratorOptions) {
  const generateStory = useGenerateStory();

  // Cooldown state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Limit state
  const [limitInfo, setLimitInfo] = useState<{
    used: number;
    limit: number;
    remaining: number;
    plan: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tick down the cooldown every second
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldownRemaining]);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownRemaining(seconds);
  }, []);

  const generate = useCallback(() => {
    if (cooldownRemaining > 0) return;

    setErrorMessage(null);

    generateStory.mutate(artworkId, {
      onSuccess: (result) => {
        // Start cooldown from the meta returned by the backend
        const meta = (result as any)?._storyMeta;
        if (meta) {
          setLimitInfo({
            used: meta.used,
            limit: meta.limit,
            remaining: meta.remaining,
            plan: meta.plan,
          });
          startCooldown(meta.cooldownSeconds);
        } else {
          // Fallback: start a default 60s cooldown
          startCooldown(60);
        }
        onSuccess?.(result);
      },
      onError: (error: any) => {
        const limitError = error as StoryLimitError;

        if (limitError?.type === 'cooldown') {
          startCooldown(limitError.cooldownRemaining ?? 60);
          setErrorMessage(limitError.message);
        } else if (limitError?.type === 'daily_limit') {
          setLimitInfo({
            used: limitError.used ?? 0,
            limit: limitError.limit ?? 0,
            remaining: 0,
            plan: limitError.plan ?? 'FREE',
          });
          setErrorMessage(limitError.message);
        } else {
          setErrorMessage('Failed to generate story. Please try again.');
        }

        onError?.(limitError);
      },
    });
  }, [
    artworkId,
    cooldownRemaining,
    generateStory,
    onSuccess,
    onError,
    startCooldown,
  ]);

  const isOnCooldown = cooldownRemaining > 0;
  const isAtLimit = limitInfo !== null && limitInfo.remaining <= 0;
  const isDisabled = generateStory.isPending || isOnCooldown || isAtLimit;

  return {
    generate,
    isPending: generateStory.isPending,
    isOnCooldown,
    isAtLimit,
    isDisabled,
    cooldownRemaining,
    limitInfo,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
}
