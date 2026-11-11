/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Food` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dietType` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foodType` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Food` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('BASIC', 'PREPARED_DISH');

-- CreateEnum
CREATE TYPE "NutrientCategory" AS ENUM ('MACRONUTRIENT', 'VITAMIN', 'MINERAL', 'OTHER');

-- CreateEnum
CREATE TYPE "FoodLogMealType" AS ENUM ('BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'EVENING_SNACK', 'DINNER', 'OTHER');

-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dietType" "DietType" NOT NULL,
ADD COLUMN     "foodType" "FoodType" NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "FoodCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodAlias" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPortion" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grams" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodPortion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nutrient" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" "NutrientCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionProfile" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "sourceId" TEXT,
    "basisGrams" DECIMAL(8,2) NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionProfileItem" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "NutritionProfileItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eatenAt" TIMESTAMP(3) NOT NULL,
    "mealType" "FoodLogMealType" NOT NULL,
    "rawInput" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLogItem" (
    "id" TEXT NOT NULL,
    "foodLogId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "grams" DECIMAL(10,2) NOT NULL,
    "calories" DECIMAL(12,4),
    "protein" DECIMAL(12,4),
    "carbohydrate" DECIMAL(12,4),
    "fat" DECIMAL(12,4),
    "fiber" DECIMAL(12,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodCategory_slug_key" ON "FoodCategory"("slug");

-- CreateIndex
CREATE INDEX "FoodCategory_parentId_idx" ON "FoodCategory"("parentId");

-- CreateIndex
CREATE INDEX "FoodAlias_alias_idx" ON "FoodAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "FoodAlias_foodId_alias_key" ON "FoodAlias"("foodId", "alias");

-- CreateIndex
CREATE INDEX "FoodPortion_foodId_idx" ON "FoodPortion"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodPortion_foodId_name_key" ON "FoodPortion"("foodId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Nutrient_code_key" ON "Nutrient"("code");

-- CreateIndex
CREATE INDEX "NutritionProfile_foodId_idx" ON "NutritionProfile"("foodId");

-- CreateIndex
CREATE INDEX "NutritionProfile_sourceId_idx" ON "NutritionProfile"("sourceId");

-- CreateIndex
CREATE INDEX "NutritionProfileItem_nutrientId_idx" ON "NutritionProfileItem"("nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionProfileItem_profileId_nutrientId_key" ON "NutritionProfileItem"("profileId", "nutrientId");

-- CreateIndex
CREATE INDEX "FoodLog_userId_eatenAt_idx" ON "FoodLog"("userId", "eatenAt");

-- CreateIndex
CREATE INDEX "FoodLog_userId_mealType_idx" ON "FoodLog"("userId", "mealType");

-- CreateIndex
CREATE INDEX "FoodLogItem_foodLogId_idx" ON "FoodLogItem"("foodLogId");

-- CreateIndex
CREATE INDEX "FoodLogItem_foodId_idx" ON "FoodLogItem"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "Food_slug_key" ON "Food"("slug");

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food"("name");

-- CreateIndex
CREATE INDEX "Food_dietType_idx" ON "Food"("dietType");

-- CreateIndex
CREATE INDEX "Food_foodType_idx" ON "Food"("foodType");

-- CreateIndex
CREATE INDEX "Food_categoryId_idx" ON "Food"("categoryId");

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FoodCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodCategory" ADD CONSTRAINT "FoodCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FoodCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodAlias" ADD CONSTRAINT "FoodAlias_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodPortion" ADD CONSTRAINT "FoodPortion_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProfile" ADD CONSTRAINT "NutritionProfile_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProfile" ADD CONSTRAINT "NutritionProfile_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NutritionSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProfileItem" ADD CONSTRAINT "NutritionProfileItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NutritionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProfileItem" ADD CONSTRAINT "NutritionProfileItem_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogItem" ADD CONSTRAINT "FoodLogItem_foodLogId_fkey" FOREIGN KEY ("foodLogId") REFERENCES "FoodLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogItem" ADD CONSTRAINT "FoodLogItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
