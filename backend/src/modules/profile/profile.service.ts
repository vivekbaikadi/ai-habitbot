
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../common/errors/app.error.js";

import type {
  CompleteOnboardingInput,
  UpdateActivityLevelInput,
} from "./profile.schema.js";

export async function saveOnboardingDetails(
  userId: string,
  input: CompleteOnboardingInput
) {
  return prisma.$transaction(async (tx) => {
    // Remove duplicate food IDs.
    const dislikedFoodIds = [
      ...new Set(input.dislikedFoodIds),
    ];

    // Verify that all selected foods exist.
    if (dislikedFoodIds.length > 0) {
      const existingFoods = await tx.food.count({
        where: {
          id: {
            in: dislikedFoodIds,
          },
        },
      });

      if (existingFoods !== dislikedFoodIds.length) {
        throw new AppError(
          "One or more selected foods do not exist",
          400,
          "INVALID_FOOD_IDS"
        );
      }
    }

    // Prepare profile data without overwriting omitted fields.
    const profileData = {
      primaryGoal: input.primaryGoal,
      activityLevel: input.activityLevel,
      ...(input.dateOfBirth !== undefined && {
        dateOfBirth: new Date(
          `${input.dateOfBirth}T00:00:00.000Z`
        ),
      }),
      ...(input.sex !== undefined && {
        sex: input.sex,
      }),
      ...(input.heightCm !== undefined && {
        heightCm: input.heightCm,
      }),
      ...(input.weightKg !== undefined && {
        weightKg: input.weightKg,
      }),
    };

    await tx.userProfile.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        ...profileData,
      },
      update: profileData,
    });

    // Save dietary preference.
    await tx.dietaryPreference.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        dietType: input.dietType,
      },
      update: {
        dietType: input.dietType,
      },
    });

    // Replace disliked foods.
    await tx.userFoodDislike.deleteMany({
      where: {
        userId,
      },
    });

    if (dislikedFoodIds.length > 0) {
      await tx.userFoodDislike.createMany({
        data: dislikedFoodIds.map((foodId) => ({
          userId,
          foodId,
        })),
      });
    }

    // Mark onboarding as completed.
    const user = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        onboardingCompleted: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        onboardingCompleted: true,
      },
    });

    return user;
  });
}

export async function saveActivityLevel(
  userId: string,
  input: UpdateActivityLevelInput
) {
  const profile = await prisma.userProfile.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      activityLevel: input.activityLevel,
    },
    update: {
      activityLevel: input.activityLevel,
    },
    select: {
      activityLevel: true,
    },
  });

  return profile;
}
