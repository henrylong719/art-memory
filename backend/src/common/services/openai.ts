import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/common/utils/envConfig";
import { logger } from "@/server";

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
	contextText: string | null;
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
	contextText: z.string().nullable(),
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
  "description": "A rich, engaging single-paragraph description of the artwork, its significance, style, and notable context",
  "confidence": 0.95
}

Rules:
- "confidence" is a float from 0.0 to 1.0 representing how certain you are about the identification
- If you cannot identify the artwork, set confidence below 0.3 and provide your best guess
- "description" should be substantially more detailed than a short caption: aim for roughly 100-150 words in one paragraph
- For recognized artworks, describe historical significance, artistic technique/style, and notable context in a warm, accessible tone
- For low-confidence or uncertain identifications, be honest and avoid invented facts; keep the description observational and clearly tentative
- "year" should be a number or null if unknown
- All string fields should be null if unknown
- Do NOT wrap the JSON in markdown code blocks`;

export async function identifyArtwork(
	imageBase64: string,
	mimeType: string = "image/jpeg",
): Promise<{ result: ArtworkIdentificationResult; rawResponse: object }> {
	const startTime = Date.now();

	const response = await openai.chat.completions.create({
		model: env.OPENAI_MODEL,
		max_tokens: 700,
		messages: [
			{
				role: "user",
				content: [
					{ type: "text", text: ARTWORK_IDENTIFICATION_PROMPT },
					{
						type: "image_url",
						image_url: {
							url: `data:${mimeType};base64,${imageBase64}`,
							detail: "high",
						},
					},
				],
			},
		],
	});

	const durationMs = Date.now() - startTime;
	const content = response.choices[0]?.message?.content || "";

	logger.info(`OpenAI artwork identification completed in ${durationMs}ms`);

	try {
		const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
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
		throw new Error(`Failed to parse artwork identification response: ${(parseError as Error).message}`);
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
  "museum": "The museum or gallery name if mentioned on the label",
  "contextText": "Any descriptive or curatorial text on the label that explains the artwork, preserving the original wording as closely as possible"
}

CRITICAL RULES:
- ONLY extract information that is EXPLICITLY written on the label
- Do NOT use your own knowledge to fill in missing fields
- If the year is not written on the label, return null — even if you know the answer
- If the medium is not written on the label, return null — even if you can guess from the image
- If the museum name is not on the label, return null
- If there is no descriptive or curatorial paragraph on the label, return null for "contextText"
- "extractedText" should contain ALL visible text from the label, word for word
- "contextText" should contain only the explanatory text from the label, not the title/artist/medium lines when you can distinguish them
- "year" should be a number or null
- All structured fields should be null if not explicitly found on the label
- Do NOT wrap the JSON in markdown code blocks
- When in doubt, return null — never guess or infer`;

export async function extractLabel(
	imageBase64: string,
	mimeType: string = "image/jpeg",
): Promise<{ result: LabelExtractionResult; rawResponse: object }> {
	const startTime = Date.now();

	const response = await openai.chat.completions.create({
		model: env.OPENAI_MODEL,
		max_tokens: 500,
		messages: [
			{
				role: "user",
				content: [
					{ type: "text", text: LABEL_EXTRACTION_PROMPT },
					{
						type: "image_url",
						image_url: {
							url: `data:${mimeType};base64,${imageBase64}`,
							detail: "high",
						},
					},
				],
			},
		],
	});

	const durationMs = Date.now() - startTime;
	const content = response.choices[0]?.message?.content || "";

	logger.info(`OpenAI label extraction completed in ${durationMs}ms`);

	try {
		const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
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
		throw new Error(`Failed to parse label extraction response: ${(parseError as Error).message}`);
	}
}

// ─── Artwork Story Generation ────────────────────────────
// Called after scan to generate a rich description

const STORY_GENERATION_PROMPT_HIGH_CONFIDENCE = `You are an expert art historian and storyteller.
Given the following artwork details, write a rich, engaging description that covers:
- The historical context and significance of the artwork
- The artist's life and circumstances when creating this piece
- The artistic techniques, style, and what makes this work notable
- Any interesting stories or facts about the artwork

Write in a warm, accessible tone that would engage a museum visitor.
The description should be 1-3 paragraphs (100-150 words).

Do NOT invent specific quotes or fabricate historical events.
Stick to well-established art historical facts.

Respond with ONLY the description text — no JSON, no markdown, no headers.`;

const STORY_GENERATION_PROMPT_LOW_CONFIDENCE = `You are an honest and helpful art assistant.
The following artwork details were provided by the user or identified with LOW confidence by AI — the image may not be a recognized artwork.

CRITICAL RULES:
- Do NOT fabricate art history, artist biographies, or historical context.
- Do NOT pretend this is a well-known artwork if you don't recognize it.
- If you recognize the artwork or artist, share what you know factually.
- If you do NOT recognize it, honestly say so and instead provide:
  - A brief, objective description of what the artwork appears to depict
  - Observations about the style, colors, or techniques visible
  - Any genuine context you can offer based on the provided details

Keep it to 1-2 short paragraphs (60-100 words). Be honest and helpful, not flowery.

Respond with ONLY the description text — no JSON, no markdown, no headers.`;

export async function generateArtworkStory(artwork: {
	title: string;
	artistName: string;
	year?: number | null;
	medium?: string | null;
	style?: string | null;
	confidence?: number | null;
}): Promise<{ story: string; rawResponse: object }> {
	const startTime = Date.now();

	const isHighConfidence = artwork.confidence !== null && artwork.confidence !== undefined && artwork.confidence >= 0.7;

	const prompt = isHighConfidence ? STORY_GENERATION_PROMPT_HIGH_CONFIDENCE : STORY_GENERATION_PROMPT_LOW_CONFIDENCE;

	const artworkInfo = [
		`Title: ${artwork.title}`,
		`Artist: ${artwork.artistName}`,
		artwork.year ? `Year: ${artwork.year}` : null,
		artwork.medium ? `Medium: ${artwork.medium}` : null,
		artwork.style ? `Style: ${artwork.style}` : null,
		artwork.confidence != null
			? `AI identification confidence: ${Math.round(artwork.confidence * 100)}%`
			: "AI identification confidence: unknown (user-provided details)",
	]
		.filter(Boolean)
		.join("\n");

	const response = await openai.chat.completions.create({
		model: env.OPENAI_MODEL,
		max_tokens: 320,
		messages: [
			{
				role: "user",
				content: `${prompt}\n\nArtwork details:\n${artworkInfo}`,
			},
		],
	});

	const durationMs = Date.now() - startTime;
	const story = response.choices[0]?.message?.content?.trim() || "";

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

export { extractOpenAIUsageInfo as extractUsageInfo } from "./openaiUsage";
