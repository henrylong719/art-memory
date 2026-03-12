-- Rename the `token` column to `tokenHash`.
-- Existing plaintext tokens become invalid after this migration;
-- all users will need to re-authenticate.
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "tokenHash";
