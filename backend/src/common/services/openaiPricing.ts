// Verified manually against official OpenAI pricing page.
// Update this file when model pricing changes.

type ModelPricing = {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
};

type PricingCatalog = Record<string, ModelPricing>;

export const OPENAI_PRICING_VERSION = '2026-03-11';

const OPENAI_PRICING: PricingCatalog = {
  'gpt-4o': {
    inputPer1M: 2.5,
    outputPer1M: 10.0,
    cachedInputPer1M: 1.25,
  },
  'gpt-4o-mini': {
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    cachedInputPer1M: 0.075,
  },
  'gpt-4-turbo': {
    inputPer1M: 10.0,
    outputPer1M: 30.0,
  },
  'gpt-4': {
    inputPer1M: 30.0,
    outputPer1M: 60.0,
  },
  'gpt-3.5-turbo': {
    inputPer1M: 0.5,
    outputPer1M: 1.5,
  },
};

function roundUsd(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function resolveModelPricing(model: string): ModelPricing | null {
  if (!model) return null;

  if (OPENAI_PRICING[model]) {
    return OPENAI_PRICING[model];
  }

  const matchedEntry = Object.entries(OPENAI_PRICING).find(([key]) =>
    model.startsWith(key),
  );

  return matchedEntry?.[1] ?? null;
}

export function calculateOpenAICostUsd(args: {
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cachedInputTokens?: number | null;
}): number | undefined {
  const pricing = resolveModelPricing(args.model);

  if (!pricing) return undefined;

  const inputTokens = args.inputTokens ?? 0;
  const outputTokens = args.outputTokens ?? 0;
  const cachedInputTokens = args.cachedInputTokens ?? 0;

  if (inputTokens === 0 && outputTokens === 0 && cachedInputTokens === 0) {
    return undefined;
  }

  const billableInputTokens = Math.max(inputTokens - cachedInputTokens, 0);

  const inputCost = (billableInputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  const cachedInputCost =
    pricing.cachedInputPer1M != null
      ? (cachedInputTokens / 1_000_000) * pricing.cachedInputPer1M
      : 0;

  return roundUsd(inputCost + outputCost + cachedInputCost);
}

export function getOpenAIPricingMetadata(model: string) {
  return {
    pricingVersion: OPENAI_PRICING_VERSION,
    pricingFound: resolveModelPricing(model) != null,
  };
}
