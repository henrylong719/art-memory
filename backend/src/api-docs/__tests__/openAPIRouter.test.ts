import { StatusCodes } from "http-status-codes";
import request from "supertest";

vi.mock("@/common/db/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    museum: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    artwork: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    artist: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    collection: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    savedArtwork: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    scanHistory: { findMany: vi.fn(), create: vi.fn() },
    aiUsageLog: { create: vi.fn() },
  },
}));

vi.mock("@/common/utils/envConfig", () => ({
  env: {
    NODE_ENV: "test",
    HOST: "localhost",
    PORT: 3000,
    CORS_ORIGIN: "http://localhost:3000",
    DATABASE_URL: "postgresql://u:p@localhost:5432/db",
    JWT_SECRET: "test-secret",
    JWT_EXPIRES_IN: "7d",
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "test",
    AWS_SECRET_ACCESS_KEY: "test",
    S3_BUCKET_NAME: "test",
    OPENAI_API_KEY: "test",
    GOOGLE_PLACES_API_KEY: "test",
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    AUTH_RATE_LIMIT_MAX_REQUESTS: 10,
    AI_DAILY_TOKEN_LIMIT: 100000,
    API_BASE_URL: "http://localhost:3000",
    isProduction: false,
  },
}));

import { app } from "@/server";

import { generateOpenAPIDocument } from "../openAPIDocumentGenerator";

describe("OpenAPI Router", () => {
	describe("Swagger JSON route", () => {
		it("should return Swagger JSON content", async () => {
			// Arrange
			const expectedResponse = generateOpenAPIDocument();

			// Act
			const response = await request(app).get("/swagger.json");

			// Assert
			expect(response.status).toBe(StatusCodes.OK);
			expect(response.type).toBe("application/json");
			expect(response.body).toEqual(expectedResponse);
		});

		it("should serve the Swagger UI", async () => {
			// Act
			const response = await request(app).get("/");

			// Assert
			expect(response.status).toBe(StatusCodes.OK);
			expect(response.text).toContain("swagger-ui");
		});
	});
});
