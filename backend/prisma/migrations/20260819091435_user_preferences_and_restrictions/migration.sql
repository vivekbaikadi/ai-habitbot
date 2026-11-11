/*
  Warnings:

  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE');

-- CreateEnum
CREATE TYPE "PrimaryGoal" AS ENUM ('WEIGHT_LOSS', 'WEIGHT_MAINTENANCE', 'MUSCLE_GAIN', 'GENERAL_HEALTH');

-- CreateEnum
CREATE TYPE "PreferenceType" AS ENUM ('PREFERRED', 'ALLOWED', 'DISLIKE', 'AVOID');

-- CreateEnum
CREATE TYPE "FoodFrequency" AS ENUM ('VERY_OFTEN', 'OFTEN', 'SOMETIMES', 'RARELY', 'NEVER');

-- CreateEnum
CREATE TYPE "RestrictionType" AS ENUM ('FOOD', 'CATEGORY');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "sex" "Sex",
    "heightCm" DECIMAL(5,2),
    "weightKg" DECIMAL(5,2),
    "activityLevel" "ActivityLevel",
    "primaryGoal" "PrimaryGoal",
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFoodPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "preference" "PreferenceType" NOT NULL DEFAULT 'ALLOWED',
    "frequency" "FoodFrequency" NOT NULL DEFAULT 'SOMETIMES',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFoodPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietaryRestriction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RestrictionType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietaryRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietaryRestrictionFood" (
    "restrictionId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,

    CONSTRAINT "DietaryRestrictionFood_pkey" PRIMARY KEY ("restrictionId","foodId")
);

-- CreateTable
CREATE TABLE "DietaryRestrictionCategory" (
    "restrictionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "DietaryRestrictionCategory_pkey" PRIMARY KEY ("restrictionId","categoryId")
);

-- CreateTable
CREATE TABLE "RestrictionSchedule" (
    "id" TEXT NOT NULL,
    "restrictionId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek",
    "mealType" "MealType",
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestrictionSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserFoodPreference_userId_idx" ON "UserFoodPreference"("userId");

-- CreateIndex
CREATE INDEX "UserFoodPreference_foodId_idx" ON "UserFoodPreference"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFoodPreference_userId_foodId_key" ON "UserFoodPreference"("userId", "foodId");

-- CreateIndex
CREATE INDEX "DietaryRestriction_userId_active_idx" ON "DietaryRestriction"("userId", "active");

-- CreateIndex
CREATE INDEX "DietaryRestriction_validFrom_validUntil_idx" ON "DietaryRestriction"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "DietaryRestrictionFood_foodId_idx" ON "DietaryRestrictionFood"("foodId");

-- CreateIndex
CREATE INDEX "DietaryRestrictionCategory_categoryId_idx" ON "DietaryRestrictionCategory"("categoryId");

-- CreateIndex
CREATE INDEX "RestrictionSchedule_restrictionId_idx" ON "RestrictionSchedule"("restrictionId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFoodPreference" ADD CONSTRAINT "UserFoodPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFoodPreference" ADD CONSTRAINT "UserFoodPreference_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryRestriction" ADD CONSTRAINT "DietaryRestriction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryRestrictionFood" ADD CONSTRAINT "DietaryRestrictionFood_restrictionId_fkey" FOREIGN KEY ("restrictionId") REFERENCES "DietaryRestriction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryRestrictionFood" ADD CONSTRAINT "DietaryRestrictionFood_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryRestrictionCategory" ADD CONSTRAINT "DietaryRestrictionCategory_restrictionId_fkey" FOREIGN KEY ("restrictionId") REFERENCES "DietaryRestriction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietaryRestrictionCategory" ADD CONSTRAINT "DietaryRestrictionCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FoodCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestrictionSchedule" ADD CONSTRAINT "RestrictionSchedule_restrictionId_fkey" FOREIGN KEY ("restrictionId") REFERENCES "DietaryRestriction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
