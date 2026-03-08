-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ArtworkSource" AS ENUM ('AI_GENERATED', 'SEED_MET', 'SEED_AIC', 'SEED_WIKI', 'MANUAL');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('ARTWORK', 'LABEL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "planExpiresAt" TIMESTAMP(3),
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "notificationsOn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthYear" INTEGER,
    "deathYear" INTEGER,
    "nationality" TEXT,
    "biography" TEXT,
    "imageUrl" TEXT,
    "wikiUrl" TEXT,
    "source" "ArtworkSource" NOT NULL DEFAULT 'AI_GENERATED',
    "externalId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artworks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "medium" TEXT,
    "dimensions" TEXT,
    "style" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "wikiUrl" TEXT,
    "artistId" TEXT,
    "museumId" TEXT,
    "source" "ArtworkSource" NOT NULL DEFAULT 'AI_GENERATED',
    "externalId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "correctionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scanType" "ScanType" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "artworkId" TEXT,
    "confidence" DOUBLE PRECISION,
    "rawAiResult" JSONB,
    "extractedText" TEXT,
    "userCorrectedTitle" TEXT,
    "userCorrectedArtist" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_artworks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artworkId" TEXT,
    "collectionId" TEXT NOT NULL,
    "personalNote" TEXT,
    "userPhotoUrl" TEXT,
    "rating" INTEGER,
    "customTitle" TEXT,
    "customArtist" TEXT,
    "customYear" INTEGER,
    "customMedium" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_artworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "museums" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "websiteUrl" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "googlePlaceId" TEXT,
    "openingHours" JSONB,
    "admissionInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "museums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "artists_name_idx" ON "artists"("name");

-- CreateIndex
CREATE INDEX "artists_externalId_idx" ON "artists"("externalId");

-- CreateIndex
CREATE INDEX "artworks_title_idx" ON "artworks"("title");

-- CreateIndex
CREATE INDEX "artworks_artistId_idx" ON "artworks"("artistId");

-- CreateIndex
CREATE INDEX "artworks_museumId_idx" ON "artworks"("museumId");

-- CreateIndex
CREATE INDEX "artworks_source_idx" ON "artworks"("source");

-- CreateIndex
CREATE INDEX "artworks_verified_idx" ON "artworks"("verified");

-- CreateIndex
CREATE INDEX "artworks_externalId_idx" ON "artworks"("externalId");

-- CreateIndex
CREATE INDEX "scans_userId_idx" ON "scans"("userId");

-- CreateIndex
CREATE INDEX "scans_artworkId_idx" ON "scans"("artworkId");

-- CreateIndex
CREATE INDEX "scans_createdAt_idx" ON "scans"("createdAt");

-- CreateIndex
CREATE INDEX "collections_userId_idx" ON "collections"("userId");

-- CreateIndex
CREATE INDEX "saved_artworks_userId_idx" ON "saved_artworks"("userId");

-- CreateIndex
CREATE INDEX "saved_artworks_collectionId_idx" ON "saved_artworks"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_artworks_collectionId_artworkId_key" ON "saved_artworks"("collectionId", "artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "museums_googlePlaceId_key" ON "museums"("googlePlaceId");

-- CreateIndex
CREATE INDEX "museums_latitude_longitude_idx" ON "museums"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "museums_city_idx" ON "museums"("city");

-- CreateIndex
CREATE INDEX "museums_country_idx" ON "museums"("country");

-- CreateIndex
CREATE INDEX "ai_usage_logs_userId_idx" ON "ai_usage_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_logs_createdAt_idx" ON "ai_usage_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "museums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_artworks" ADD CONSTRAINT "saved_artworks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_artworks" ADD CONSTRAINT "saved_artworks_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_artworks" ADD CONSTRAINT "saved_artworks_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
