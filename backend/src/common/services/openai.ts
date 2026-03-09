import OpenAI from 'openai';
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
    const result = JSON.parse(cleaned) as ArtworkIdentificationResult;

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
    logger.error(`Failed to parse OpenAI response: ${content}`);
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
    const result = JSON.parse(cleaned) as LabelExtractionResult;

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
    logger.error(`Failed to parse OpenAI label response: ${content}`);
    throw new Error(
      `Failed to parse label extraction response: ${(parseError as Error).message}`,
    );
  }
}

// ─── Usage tracking helper ───────────────────────────────

export function extractUsageInfo(rawResponse: any) {
  return {
    model: rawResponse.model || env.OPENAI_MODEL,
    tokensIn: rawResponse.usage?.prompt_tokens || null,
    tokensOut: rawResponse.usage?.completion_tokens || null,
    durationMs: rawResponse.durationMs || null,
  };
}
