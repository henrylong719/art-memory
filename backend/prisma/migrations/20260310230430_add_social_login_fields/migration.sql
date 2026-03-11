-- AlterTable: make passwordHash optional for social login users
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AddColumn: social login provider IDs
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
ALTER TABLE "users" ADD COLUMN "facebookId" TEXT;

-- CreateIndex: unique constraints for social IDs
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "users_facebookId_key" ON "users"("facebookId");
