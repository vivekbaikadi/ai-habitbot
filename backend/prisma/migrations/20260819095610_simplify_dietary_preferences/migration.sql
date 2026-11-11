/*
  Warnings:

  - You are about to drop the `DietaryRestriction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DietaryRestrictionCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DietaryRestrictionFood` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FoodCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RestrictionSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserFoodPreference` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN');

-- DropForeignKey
ALTER TABLE "DietaryRestriction" DROP CONSTRAINT "DietaryRestriction_userId_fkey";

-- DropForeignKey
ALTER TABLE "DietaryRestrictionCategory" DROP CONSTRAINT "DietaryRestrictionCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "DietaryRestrictionCategory" DROP CONSTRAINT "DietaryRestrictionCategory_restrictionId_fkey";

-- DropForeignKey
ALTER TABLE "DietaryRestrictionFood" DROP CONSTRAINT "DietaryRestrictionFood_foodId_fkey";

-- DropForeignKey
ALTER TABLE "DietaryRestrictionFood" DROP CONSTRAINT "DietaryRestrictionFood_restrictionId_fkey";

-- DropForeignKey
ALTER TABLE "RestrictionSchedule" DROP CONSTRAINT "RestrictionSchedule_restrictionId_fkey";

-- DropForeignKey
ALTER TABLE "UserFoodPreference" DROP CONSTRAINT "UserFoodPreference_foodId_fkey";

-- DropForeignKey
ALTER TABLE "UserFoodPreference" DROP CONSTRAINT "UserFoodPreference_userId_fkey";

-- DropTable
DROP TABLE "DietaryRestriction";

-- DropTable
DROP TABLE "DietaryRestrictionCategory";

-- DropTable
DROP TABLE "DietaryRestrictionFood";

-- DropTable
DROP TABLE "FoodCategory";

-- DropTable
DROP TABLE "RestrictionSchedule";

-- DropTable
DROP TABLE "UserFoodPreference";

-- DropEnum
DROP TYPE "DayOfWeek";

-- DropEnum
DROP TYPE "FoodFrequency";

-- DropEnum
DROP TYPE "MealType";

-- DropEnum
DROP TYPE "PreferenceType";

-- DropEnum
DROP TYPE "RestrictionType";

-- CreateTable
CREATE TABLE "DietaryPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietType" "DietType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietaryPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFoodDislike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFoodDislike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietaryPreference_userId_key" ON "DietaryPreference"("userId");

-- CreateIndex
CREATE INDEX "UserFoodDislike_userId_idx" ON "UserFoodDislike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFoodDislike_userId_foodId_key" ON "UserFoodDislike"("userId", "foodId");

-- AddForeignKey
ALTER TABLE "DietaryPreference" ADD CONSTRAINT "DietaryPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFoodDislike" ADD CONSTRAINT "UserFoodDislike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFoodDislike" ADD CONSTRAINT "UserFoodDislike_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
