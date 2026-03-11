import {
  calculateOpenAICostUsd,
  getOpenAIPricingMetadata,
} from './openaiPricing';
import { env } from '@/common/utils/envConfig';

type RawUsageResponse = {
  model?: string;
  usage?: {
    prompt_tokens?: number | null;
    completion_tokens?: number | null;
    prompt_tokens_details?: {
      cached_tokens?: number | null;
    } | null;
  } | null;
  durationMs?: number | null;
};

export function extractOpenAIUsageInfo(rawResponse: RawUsageResponse) {
  const model = rawResponse.model || env.OPENAI_MODEL;
  const tokensIn = rawResponse.usage?.prompt_tokens ?? null;
  const tokensOut = rawResponse.usage?.completion_tokens ?? null;
  const cachedInputTokens =
    rawResponse.usage?.prompt_tokens_details?.cached_tokens ?? null;
  const durationMs = rawResponse.durationMs ?? null;

  const costUsd = calculateOpenAICostUsd({
    model,
    inputTokens: tokensIn,
    outputTokens: tokensOut,
    cachedInputTokens,
  });

  const pricingMeta = getOpenAIPricingMetadata(model);

  return {
    model,
    tokensIn,
    tokensOut,
    cachedInputTokens,
    durationMs,
    costUsd,
    pricingVersion: pricingMeta.pricingVersion,
    pricingFound: pricingMeta.pricingFound,
  };
}
