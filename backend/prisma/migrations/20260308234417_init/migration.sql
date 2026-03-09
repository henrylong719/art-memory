/*
  Warnings:

  - The values [LABEL] on the enum `ScanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScanType_new" AS ENUM ('ARTWORK', 'COMBINED');
ALTER TABLE "scans" ALTER COLUMN "scanType" TYPE "ScanType_new" USING ("scanType"::text::"ScanType_new");
ALTER TYPE "ScanType" RENAME TO "ScanType_old";
ALTER TYPE "ScanType_new" RENAME TO "ScanType";
DROP TYPE "public"."ScanType_old";
COMMIT;

-- AlterTable
ALTER TABLE "scans" ADD COLUMN     "labelImageUrl" TEXT;
