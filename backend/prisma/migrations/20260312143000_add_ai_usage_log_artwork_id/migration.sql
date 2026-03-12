ALTER TABLE "ai_usage_logs"
ADD COLUMN "artworkId" TEXT;

CREATE INDEX "ai_usage_logs_userId_artworkId_endpoint_createdAt_idx"
ON "ai_usage_logs"("userId", "artworkId", "endpoint", "createdAt");
