import OpenAI from 'openai';
import { z } from 'zod';
import { env } from '@/common/utils/envConfig';
import { logger } from '@/server';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// ─── Types ───────────────────────────────────────────────

export interface ArtworkIdentificationResult {
  title: string;
  artistName: string;
  year: number | null;
  medium: string | null;
  style: string | null;
  description: string | null;
  confidence: number;
}

export interface LabelExtractionResult {
  extractedText: string;
  title: string | null;
  artistName: string | null;
  year: number | null;
  medium: string | null;
  museum: string | null;
}

const ArtworkIdentificationResultSchema = z.object({
  title: z.string().min(1),
  artistName: z.string().min(1),
  year: z.number().int().nullable(),
  medium: z.string().nullable(),
  style: z.string().nullable(),
  description: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

const LabelExtractionResultSchema = z.object({
  extractedText: z.string(),
  title: z.string().nullable(),
  artistName: z.string().nullable(),
  year: z.number().int().nullable(),
  medium: z.string().nullable(),
  museum: z.string().nullable(),
});

// ─── Mode 2: Artwork-Only Identification ─────────────────
// Used when user only has a photo of the artwork (no label)

const ARTWORK_IDENTIFICATION_PROMPT = `You are an expert art historian and artwork identification system. 
Analyze this image of an artwork and identify it.

Respond ONLY with a valid JSON object (no markdown, no backticks, no extra text):
{
  "title": "The exact title of the artwork",
  "artistName": "Full name of the artist",
  "year": 1889,
  "medium": "Oil on canvas",
  "style": "Post-Impressionism",
  "description": "A brief 2-3 sentence description of the artwork and its significance",
  "confidence": 0.95
}

Rules:
- "confidence" is a float from 0.0 to 1.0 representing how certain you are about the identification
- If you cannot identify the artwork, set confidence below 0.3 and provide your best guess
- "year" should be a number or null if unknown
- All string fields should be null if unknown
- Do NOT wrap the JSON in markdown code blocks`;

export async function identifyArtwork(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
): Promise<{ result: ArtworkIdentificationResult; rawResponse: object }> {
  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: ARTWORK_IDENTIFICATION_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
  });

  const durationMs = Date.now() - startTime;
  const content = response.choices[0]?.message?.content || '';

  logger.info(`OpenAI artwork identification completed in ${durationMs}ms`);

  try {
    const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const result = ArtworkIdentificationResultSchema.parse(parsed);

    return {
      result,
      rawResponse: {
        model: response.model,
        usage: response.usage,
        durationMs,
        content,
      },
    };
  } catch (parseError) {
    logger.error(`Failed to parse or validate OpenAI response: ${content}`);
    throw new Error(
      `Failed to parse artwork identification response: ${(parseError as Error).message}`,
    );
  }
}

// ─── Mode 1: Label OCR Extraction ────────────────────────
// Used when user has a photo of the museum label

const LABEL_EXTRACTION_PROMPT = `You are a strict OCR text extraction system specialized in museum artwork labels.
Your ONLY job is to read and extract text that is physically written on the label. Nothing more.

Extract ALL text from this museum label image, then parse out structured fields.

Respond ONLY with a valid JSON object (no markdown, no backticks, no extra text):
{
  "extractedText": "The complete raw text from the label, preserving line breaks as \\n",
  "title": "The artwork title if found on the label",
  "artistName": "The artist name if found on the label",
  "year": 1889,
  "medium": "The medium/materials if mentioned on the label",
  "museum": "The museum or gallery name if mentioned on the label"
}

CRITICAL RULES:
- ONLY extract information that is EXPLICITLY written on the label
- Do NOT use your own knowledge to fill in missing fields
- If the year is not written on the label, return null — even if you know the answer
- If the medium is not written on the label, return null — even if you can guess from the image
- If the museum name is not on the label, return null
- "extractedText" should contain ALL visible text from the label, word for word
- "year" should be a number or null
- All structured fields should be null if not explicitly found on the label
- Do NOT wrap the JSON in markdown code blocks
- When in doubt, return null — never guess or infer`;

export async function extractLabel(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
): Promise<{ result: LabelExtractionResult; rawResponse: object }> {
  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: LABEL_EXTRACTION_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
  });

  const durationMs = Date.now() - startTime;
  const content = response.choices[0]?.message?.content || '';

  logger.info(`OpenAI label extraction completed in ${durationMs}ms`);

  try {
    const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const result = LabelExtractionResultSchema.parse(parsed);

    return {
      result,
      rawResponse: {
        model: response.model,
        usage: response.usage,
        durationMs,
        content,
      },
    };
  } catch (parseError) {
    logger.error(`Failed to parse or validate OpenAI response: ${content}`);
    throw new Error(
      `Failed to parse label extraction response: ${(parseError as Error).message}`,
    );
  }
}

// ─── Artwork Story Generation ────────────────────────────
// Called after scan to generate a rich description

const STORY_GENERATION_PROMPT = `You are an expert art historian and storyteller.
Given the following artwork details, write a rich, engaging description that covers:
- The historical context and significance of the artwork
- The artist's life and circumstances when creating this piece
- The artistic techniques, style, and what makes this work notable
- Any interesting stories or facts about the artwork

Write in a warm, accessible tone that would engage a museum visitor.
The description should be 2-3 paragraphs (150-250 words).

Do NOT invent specific quotes or fabricate historical events.
Stick to well-established art historical facts.

Respond with ONLY the description text — no JSON, no markdown, no headers.`;

export async function generateArtworkStory(artwork: {
  title: string;
  artistName: string;
  year?: number | null;
  medium?: string | null;
  style?: string | null;
}): Promise<{ story: string; rawResponse: object }> {
  const startTime = Date.now();

  const artworkInfo = [
    `Title: ${artwork.title}`,
    `Artist: ${artwork.artistName}`,
    artwork.year ? `Year: ${artwork.year}` : null,
    artwork.medium ? `Medium: ${artwork.medium}` : null,
    artwork.style ? `Style: ${artwork.style}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `${STORY_GENERATION_PROMPT}\n\nArtwork details:\n${artworkInfo}`,
      },
    ],
  });

  const durationMs = Date.now() - startTime;
  const story = response.choices[0]?.message?.content?.trim() || '';

  logger.info(`OpenAI story generation completed in ${durationMs}ms`);

  return {
    story,
    rawResponse: {
      model: response.model,
      usage: response.usage,
      durationMs,
      content: story,
    },
  };
}

// ─── Usage tracking helper ───────────────────────────────

// Pricing per 1M tokens (USD) — update when models change
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-2024-11-20': { input: 2.5, output: 10.0 },
  'gpt-4o-2024-08-06': { input: 2.5, output: 10.0 },
  'gpt-4o-2024-05-13': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
};

function calculateCost(
  model: string,
  tokensIn: number | null,
  tokensOut: number | null,
): number | undefined {
  // Try exact match first, then prefix match (e.g. 'gpt-4o-2025-...' → 'gpt-4o')
  const pricing =
    MODEL_PRICING[model] ||
    Object.entries(MODEL_PRICING).find(([key]) => model.startsWith(key))?.[1];

  if (!pricing || (!tokensIn && !tokensOut)) return undefined;

  const inputCost = ((tokensIn ?? 0) / 1_000_000) * pricing.input;
  const outputCost = ((tokensOut ?? 0) / 1_000_000) * pricing.output;

  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal places
}

export function extractUsageInfo(rawResponse: any) {
  const model = rawResponse.model || env.OPENAI_MODEL;
  const tokensIn = rawResponse.usage?.prompt_tokens || null;
  const tokensOut = rawResponse.usage?.completion_tokens || null;
  const durationMs = rawResponse.durationMs || null;
  const costUsd = calculateCost(model, tokensIn, tokensOut);

  return {
    model,
    tokensIn,
    tokensOut,
    durationMs,
    costUsd,
  };
}
