import { StatusCodes } from "http-status-codes";
import { ArtistRepository } from "@/api/artist/artistRepository";
import { ArtworkRepository } from "@/api/artwork/artworkRepository";
import { AiUsageLogRepository } from "@/api/scan/aiUsageLogRepository";
import { ScanRepository } from "@/api/scan/scanRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import {
	type ArtworkIdentificationResult,
	extractLabel,
	extractUsageInfo,
	identifyArtwork,
	type LabelExtractionResult,
} from "@/common/services/openai";
import { deleteFromS3, uploadToS3 } from "@/common/services/s3";
import { logger } from "@/server";

type ArtworkResolutionInput = {
	title: string;
	artistName: string;
	year?: number | null;
	medium?: string | null;
	style?: string | null;
	description?: string | null;
	imageUrl?: string | null;
	confidence: number;
	latitude?: number;
	longitude?: number;
};

function cleanNullableString(value: string | null | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function normalizeComparableText(value: string | null | undefined) {
	return (
		cleanNullableString(value)
			?.toLowerCase()
			.replace(/[^a-z0-9]+/g, " ")
			.trim() ?? ""
	);
}

function textsLikelyMatch(left: string | null | undefined, right: string | null | undefined) {
	const normalizedLeft = normalizeComparableText(left);
	const normalizedRight = normalizeComparableText(right);

	if (!normalizedLeft || !normalizedRight) {
		return null;
	}

	return (
		normalizedLeft === normalizedRight ||
		normalizedLeft.includes(normalizedRight) ||
		normalizedRight.includes(normalizedLeft)
	);
}

function clampConfidence(value: number) {
	return Math.max(0, Math.min(0.99, Number(value.toFixed(2))));
}

function choosePreferredString({
	labelValue,
	artworkValue,
	artworkConfidence,
}: {
	labelValue: string | null | undefined;
	artworkValue: string | null | undefined;
	artworkConfidence: number;
}) {
	const cleanLabelValue = cleanNullableString(labelValue);
	const cleanArtworkValue = cleanNullableString(artworkValue);

	if (cleanLabelValue && cleanArtworkValue) {
		const matches = textsLikelyMatch(cleanLabelValue, cleanArtworkValue);

		if (matches !== false) {
			return cleanLabelValue;
		}

		return artworkConfidence >= 0.8 ? cleanArtworkValue : cleanLabelValue;
	}

	return cleanLabelValue ?? cleanArtworkValue;
}

function joinClauses(clauses: string[]) {
	if (clauses.length <= 1) {
		return clauses[0] ?? "";
	}

	if (clauses.length === 2) {
		return `${clauses[0]} and ${clauses[1]}`;
	}

	const head = clauses.slice(0, -1).join(", ");
	const tail = clauses.at(-1);
	return `${head}, and ${tail}`;
}

function buildLabelMetadataSentence(labelResult: LabelExtractionResult | null) {
	if (!labelResult) {
		return null;
	}

	const clauses: string[] = [];

	if (labelResult.year != null) {
		clauses.push(`dates the work to ${labelResult.year}`);
	}

	if (cleanNullableString(labelResult.medium)) {
		clauses.push(`lists the medium as ${labelResult.medium}`);
	}

	if (cleanNullableString(labelResult.museum)) {
		clauses.push(`identifies the venue as ${labelResult.museum}`);
	}

	return clauses.length > 0 ? `Museum label details: It ${joinClauses(clauses)}.` : null;
}

function buildCombinedDescription({
	artworkDescription,
	labelResult,
}: {
	artworkDescription: string | null | undefined;
	labelResult: LabelExtractionResult | null;
}) {
	const descriptionParts: string[] = [];
	const cleanArtworkDescription = cleanNullableString(artworkDescription);
	const cleanContextText = cleanNullableString(labelResult?.contextText);
	const labelMetadataSentence = buildLabelMetadataSentence(labelResult);

	if (cleanArtworkDescription) {
		descriptionParts.push(cleanArtworkDescription);
	}

	if (cleanContextText) {
		descriptionParts.push(`Museum label notes: ${cleanContextText}`);
	}

	if (labelMetadataSentence) {
		descriptionParts.push(labelMetadataSentence);
	}

	return descriptionParts.length > 0 ? descriptionParts.join("\n\n") : null;
}

function computeCombinedConfidence({
	artworkResult,
	labelResult,
}: {
	artworkResult: ArtworkIdentificationResult | null;
	labelResult: LabelExtractionResult | null;
}) {
	const artworkConfidence = artworkResult?.confidence ?? 0;
	const hasLabelTitle = !!cleanNullableString(labelResult?.title);
	const hasLabelArtist = !!cleanNullableString(labelResult?.artistName);
	const titleAgreement = artworkResult ? textsLikelyMatch(labelResult?.title, artworkResult.title) : null;
	const artistAgreement = artworkResult ? textsLikelyMatch(labelResult?.artistName, artworkResult.artistName) : null;
	const hasConflict = titleAgreement === false || artistAgreement === false;
	const hasAgreement = titleAgreement === true || artistAgreement === true;

	if (hasLabelTitle && hasLabelArtist) {
		if (hasAgreement && !hasConflict) {
			return clampConfidence(Math.max(artworkConfidence, 0.97));
		}

		if (hasConflict) {
			return clampConfidence(artworkConfidence >= 0.8 ? artworkConfidence * 0.8 : 0.62);
		}

		return clampConfidence(artworkResult ? Math.max(artworkConfidence, 0.86) : 0.88);
	}

	if (hasLabelTitle || hasLabelArtist) {
		if (hasAgreement && !hasConflict) {
			return clampConfidence(Math.max(artworkConfidence, 0.9));
		}

		if (hasConflict) {
			return clampConfidence(artworkConfidence >= 0.8 ? artworkConfidence * 0.75 : 0.52);
		}

		return clampConfidence(artworkResult ? Math.max(artworkConfidence, 0.68) : 0.65);
	}

	if (cleanNullableString(labelResult?.contextText)) {
		return clampConfidence(artworkResult ? Math.max(artworkConfidence, 0.45) : 0.25);
	}

	return clampConfidence(artworkConfidence);
}

function mergeCombinedScanResults({
	artworkResult,
	labelResult,
}: {
	artworkResult: ArtworkIdentificationResult | null;
	labelResult: LabelExtractionResult | null;
}): ArtworkResolutionInput {
	const artworkConfidence = artworkResult?.confidence ?? 0;

	return {
		title:
			choosePreferredString({
				labelValue: labelResult?.title,
				artworkValue: artworkResult?.title,
				artworkConfidence,
			}) ?? "",
		artistName:
			choosePreferredString({
				labelValue: labelResult?.artistName,
				artworkValue: artworkResult?.artistName,
				artworkConfidence,
			}) ?? "",
		year: labelResult?.year ?? artworkResult?.year ?? null,
		medium: cleanNullableString(labelResult?.medium) ?? cleanNullableString(artworkResult?.medium),
		style: cleanNullableString(artworkResult?.style),
		description: buildCombinedDescription({
			artworkDescription: artworkResult?.description,
			labelResult,
		}),
		confidence: computeCombinedConfidence({ artworkResult, labelResult }),
	};
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}

export class ScanService {
	private scanRepository: ScanRepository;
	private aiUsageLogRepository: AiUsageLogRepository;
	private artworkRepository: ArtworkRepository;
	private artistRepository: ArtistRepository;

	constructor(
		scanRepository: ScanRepository = new ScanRepository(),
		aiUsageLogRepository: AiUsageLogRepository = new AiUsageLogRepository(),
		artworkRepository: ArtworkRepository = new ArtworkRepository(),
		artistRepository: ArtistRepository = new ArtistRepository(),
	) {
		this.scanRepository = scanRepository;
		this.aiUsageLogRepository = aiUsageLogRepository;
		this.artworkRepository = artworkRepository;
		this.artistRepository = artistRepository;
	}

	// ─── Scan History ────────────────────────────────────────

	async findByUser(userId: string) {
		try {
			const scans = await this.scanRepository.findByUser(userId);
			return ServiceResponse.success("Scans found", scans);
		} catch (ex) {
			logger.error(`Error finding scans for user ${userId}: ${(ex as Error).message}`);
			return ServiceResponse.failure(
				"An error occurred while retrieving scans.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findById(id: string, userId: string) {
		try {
			const scan = await this.scanRepository.findById(id);
			if (!scan) {
				return ServiceResponse.failure("Scan not found", null, StatusCodes.NOT_FOUND);
			}

			if (scan.userId !== userId) {
				return ServiceResponse.failure("Scan not found", null, StatusCodes.NOT_FOUND);
			}

			return ServiceResponse.success("Scan found", scan);
		} catch (ex) {
			logger.error(`Error finding scan ${id}: ${(ex as Error).message}`);
			return ServiceResponse.failure("An error occurred while finding scan.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	// ─── Mode 1: Artwork Only ───────────────────────────────

	async scanArtwork(
		userId: string,
		artworkFile: Express.Multer.File,
		options: { latitude?: number; longitude?: number },
	) {
		// Step 1: Upload artwork image to S3 (outside try so a total failure is still possible)
		const imageUrl = await uploadToS3(
			artworkFile.buffer,
			artworkFile.originalname,
			"scans/artworks",
			artworkFile.mimetype,
		);

		try {
			// Step 2: Send to OpenAI for identification
			const artworkBase64 = artworkFile.buffer.toString("base64");
			const { result: aiResult, rawResponse } = await identifyArtwork(artworkBase64, artworkFile.mimetype);

			// Step 3: Log AI usage
			await this.logSuccessfulUsage(userId, "openai/vision/artwork", rawResponse);

			// Step 4: Find or create artwork + artist
			const artworkId = await this.resolveArtwork({
				...aiResult,
				imageUrl: imageUrl,
				latitude: options.latitude,
				longitude: options.longitude,
			});

			// Step 5: Create scan record
			const scan = await this.scanRepository.create({
				userId,
				scanType: "ARTWORK",
				imageUrl,
				artworkId,
				confidence: aiResult.confidence,
				rawAiResult: rawResponse as object,
				latitude: options.latitude,
				longitude: options.longitude,
			});

			const isLowConfidence = aiResult.confidence < 0.5;
			return ServiceResponse.success(
				isLowConfidence
					? "Scan saved but artwork could not be confidently identified. Details may be inaccurate."
					: "Artwork scanned successfully",
				{
					...scan,
					lowConfidence: isLowConfidence,
				},
				StatusCodes.CREATED,
			);
		} catch (ex) {
			const errorMessage = (ex as Error).message;
			logger.error(`Error scanning artwork: ${errorMessage}`);

			await this.logFailedUsage(userId, "openai/vision/artwork", errorMessage);

			// Still create a scan record so the image appears in scan history
			const scan = await this.scanRepository.create({
				userId,
				scanType: "ARTWORK",
				imageUrl,
				confidence: 0,
				latitude: options.latitude,
				longitude: options.longitude,
			});

			return ServiceResponse.success("Scan saved but identification failed", scan, StatusCodes.CREATED);
		}
	}

	// ─── Mode 2: Artwork + Label Combined ───────────────────
	// Analyze the artwork photo and the label/details photo separately, then merge them.

	async scanCombined(
		userId: string,
		artworkFile: Express.Multer.File,
		labelFile: Express.Multer.File,
		options: { latitude?: number; longitude?: number },
	) {
		// Step 1: Upload both images to S3 in parallel (outside try so images are always persisted)
		const [imageUrl, labelImageUrl] = await Promise.all([
			uploadToS3(artworkFile.buffer, artworkFile.originalname, "scans/artworks", artworkFile.mimetype),
			uploadToS3(labelFile.buffer, labelFile.originalname, "scans/labels", labelFile.mimetype),
		]);

		try {
			// Step 2: Analyze the artwork photo and OCR the label in parallel
			const artworkBase64 = artworkFile.buffer.toString("base64");
			const labelBase64 = labelFile.buffer.toString("base64");
			const [artworkAnalysis, labelAnalysis] = await Promise.allSettled([
				identifyArtwork(artworkBase64, artworkFile.mimetype),
				extractLabel(labelBase64, labelFile.mimetype),
			]);

			if (artworkAnalysis.status === "fulfilled") {
				await this.logSuccessfulUsage(userId, "openai/vision/artwork", artworkAnalysis.value.rawResponse);
			} else {
				await this.logFailedUsage(userId, "openai/vision/artwork", getErrorMessage(artworkAnalysis.reason));
			}

			if (labelAnalysis.status === "fulfilled") {
				await this.logSuccessfulUsage(userId, "openai/vision/label", labelAnalysis.value.rawResponse);
			} else {
				await this.logFailedUsage(userId, "openai/vision/label", getErrorMessage(labelAnalysis.reason));
			}

			if (artworkAnalysis.status === "rejected" && labelAnalysis.status === "rejected") {
				throw new Error("Artwork identification and label extraction both failed.");
			}

			const artworkResult = artworkAnalysis.status === "fulfilled" ? artworkAnalysis.value.result : null;
			const labelResult = labelAnalysis.status === "fulfilled" ? labelAnalysis.value.result : null;
			const mergedResult = mergeCombinedScanResults({
				artworkResult,
				labelResult,
			});

			// Step 3: Find or create artwork from the merged result
			const artworkId = await this.resolveArtwork({
				...mergedResult,
				imageUrl,
				latitude: options.latitude,
				longitude: options.longitude,
			});

			// Step 4: Create scan record
			const scan = await this.scanRepository.create({
				userId,
				scanType: "COMBINED",
				imageUrl,
				labelImageUrl,
				artworkId,
				confidence: mergedResult.confidence,
				rawAiResult: {
					artwork: artworkAnalysis.status === "fulfilled" ? artworkAnalysis.value.rawResponse : null,
					artworkError: artworkAnalysis.status === "rejected" ? getErrorMessage(artworkAnalysis.reason) : null,
					label: labelAnalysis.status === "fulfilled" ? labelAnalysis.value.rawResponse : null,
					labelError: labelAnalysis.status === "rejected" ? getErrorMessage(labelAnalysis.reason) : null,
					merged: mergedResult,
				} as object,
				extractedText: labelResult?.extractedText,
				latitude: options.latitude,
				longitude: options.longitude,
			});

			const isLowConfidence = mergedResult.confidence < 0.5;
			return ServiceResponse.success(
				isLowConfidence
					? "Scan saved but combined analysis could not confidently identify the artwork."
					: "Artwork and details scanned successfully",
				{
					...scan,
					lowConfidence: isLowConfidence,
				},
				StatusCodes.CREATED,
			);
		} catch (ex) {
			const errorMessage = (ex as Error).message;
			logger.error(`Error scanning combined: ${errorMessage}`);

			// Still create a scan record so the image appears in scan history
			const scan = await this.scanRepository.create({
				userId,
				scanType: "COMBINED",
				imageUrl,
				labelImageUrl,
				confidence: 0,
				latitude: options.latitude,
				longitude: options.longitude,
			});

			return ServiceResponse.success("Scan saved but identification failed", scan, StatusCodes.CREATED);
		}
	}

	// ─── User Corrections ───────────────────────────────────

	async correctScan(
		id: string,
		userId: string,
		data: {
			userCorrectedTitle?: string;
			userCorrectedArtist?: string;
			artworkId?: string;
		},
	) {
		try {
			const scan = await this.scanRepository.findById(id);
			if (!scan) {
				return ServiceResponse.failure("Scan not found", null, StatusCodes.NOT_FOUND);
			}

			if (scan.userId !== userId) {
				return ServiceResponse.failure("Scan not found", null, StatusCodes.NOT_FOUND);
			}

			const updatedScan = await this.scanRepository.update(id, data);

			// Increment correction count on the linked artwork
			if (scan.artworkId) {
				await this.artworkRepository.incrementCorrectionCount(scan.artworkId);
			}

			return ServiceResponse.success("Scan corrected", updatedScan);
		} catch (ex) {
			logger.error(`Error correcting scan ${id}: ${(ex as Error).message}`);
			return ServiceResponse.failure(
				"An error occurred while correcting scan.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// ─── Delete Scan ────────────────────────────────────────

	async deleteScan(id: string, userId: string) {
		try {
			const scan = await this.scanRepository.findById(id);
			if (!scan) {
				return ServiceResponse.failure("Scan not found", null, StatusCodes.NOT_FOUND);
			}

			if (scan.userId !== userId) {
				return ServiceResponse.failure("Scan not found", null, StatusCodes.NOT_FOUND);
			}

			// Delete S3 images
			try {
				await deleteFromS3(scan.imageUrl);
				if (scan.labelImageUrl) {
					await deleteFromS3(scan.labelImageUrl);
				}
			} catch (ex) {
				logger.error(`Failed to delete S3 images for scan ${id}: ${(ex as Error).message}`);
			}

			await this.scanRepository.delete(id);

			return ServiceResponse.success("Scan deleted", null);
		} catch (ex) {
			logger.error(`Error deleting scan ${id}: ${(ex as Error).message}`);
			return ServiceResponse.failure("An error occurred while deleting scan.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	// ─── Private Helpers ─────────────────────────────────────

	/**
	 * Takes an AI result and finds or creates the artwork + artist in the database.
	 * Returns the artworkId or undefined if confidence is too low.
	 */
	private async resolveArtwork(aiResult: ArtworkResolutionInput): Promise<string | undefined> {
		if (aiResult.confidence < 0.3 || !aiResult.title || !aiResult.artistName) {
			return undefined;
		}

		// Find or create the artist
		const artist = await this.artistRepository.findOrCreate(aiResult.artistName, {
			source: "AI_GENERATED",
		});

		// Check if artwork already exists
		const existingArtwork = await this.artworkRepository.findByTitleAndArtist(aiResult.title, artist.id);

		if (existingArtwork) {
			const shouldUpgradeDescription = !!(
				aiResult.description &&
				existingArtwork.source === "AI_GENERATED" &&
				!existingArtwork.verified &&
				(!existingArtwork.description || aiResult.description.length > existingArtwork.description.length + 40)
			);
			const updateData = {
				year: existingArtwork.year == null && aiResult.year != null ? aiResult.year : undefined,
				medium: existingArtwork.medium == null && aiResult.medium ? aiResult.medium : undefined,
				style: existingArtwork.style == null && aiResult.style ? aiResult.style : undefined,
				description:
					shouldUpgradeDescription || (!existingArtwork.description && aiResult.description)
						? (aiResult.description ?? undefined)
						: undefined,
				imageUrl: existingArtwork.imageUrl == null && aiResult.imageUrl ? aiResult.imageUrl : undefined,
			};
			const hasUpdates = Object.values(updateData).some((value) => value !== undefined);

			if (hasUpdates) {
				await this.artworkRepository.update(existingArtwork.id, updateData);
			}

			return existingArtwork.id;
		}

		// Create new artwork
		const newArtwork = await this.artworkRepository.create({
			title: aiResult.title,
			year: aiResult.year ?? undefined,
			medium: aiResult.medium ?? undefined,
			style: aiResult.style ?? undefined,
			description: aiResult.description ?? undefined,
			imageUrl: aiResult.imageUrl ?? undefined,
			artistId: artist.id,
			source: "AI_GENERATED",
			latitude: aiResult.latitude,
			longitude: aiResult.longitude,
		});

		return newArtwork.id;
	}

	private async logSuccessfulUsage(userId: string, endpoint: string, rawResponse: object) {
		const usageInfo = extractUsageInfo(rawResponse);

		await this.aiUsageLogRepository.create({
			userId,
			endpoint,
			model: usageInfo.model,
			tokensIn: usageInfo.tokensIn,
			tokensOut: usageInfo.tokensOut,
			costUsd: usageInfo.costUsd,
			durationMs: usageInfo.durationMs,
			success: true,
		});
	}

	private async logFailedUsage(userId: string, endpoint: string, errorMsg: string) {
		await this.aiUsageLogRepository
			.create({
				userId,
				endpoint,
				model: "unknown",
				success: false,
				errorMsg,
			})
			.catch(() => {}); // Don't fail if logging fails
	}
}

export const scanService = new ScanService();
