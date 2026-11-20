-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Preserve access for users who already have accounts.
UPDATE "User"
SET "onboardingCompleted" = true;