
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../common/errors/app.error.js";

import type {
  CompleteOnboardingInput,
  UpdateActivityLevelInput,
  UpdateProfileInput,
} from "./profile.schema.js";

// Shared profile selection for GET and PUT responses.
const profileInclude = {
  profile: true,
  dietaryPreference: true,
  foodDislikes: {
    include: {
      food: {
        select: {
          id: true,
          name: true,
          dietType: true,
        },
      },
    },
  },
} as const;

// Retrieve the complete profile of an authenticated user.
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profile: true,
      dietaryPreference: true,
      foodDislikes: {
        include: {
          food: {
            select: {
              id: true,
              name: true,
              dietType: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(
      "User profile not found",
      404,
      "PROFILE_NOT_FOUND"
    );
  }

  return user;
}

// Update only the profile fields supplied by the user.
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
) {
  return prisma.$transaction(async (tx) => {
    const {
      primaryGoal,
      activityLevel,
      dateOfBirth,
      sex,
      heightCm,
      weightKg,
      dietType,
      dislikedFoodIds,
    } = input;

    // Validate disliked food IDs if provided.
    if (dislikedFoodIds !== undefined) {
      const uniqueFoodIds = [...new Set(dislikedFoodIds)];

      if (uniqueFoodIds.length > 0) {
        const existingFoods = await tx.food.count({
          where: {
            id: {
              in: uniqueFoodIds,
            },
          },
        });

        if (existingFoods !== uniqueFoodIds.length) {
          throw new AppError(
            "One or more selected foods do not exist",
            400,
            "INVALID_FOOD_IDS"
          );
        }
      }

      await tx.userFoodDislike.deleteMany({
        where: {
          userId,
        },
      });

      if (uniqueFoodIds.length > 0) {
        await tx.userFoodDislike.createMany({
          data: uniqueFoodIds.map((foodId) => ({
            userId,
            foodId,
          })),
        });
      }
    }

    // Update personal and fitness information.
    const profileData = {
      ...(primaryGoal !== undefined && { primaryGoal }),
      ...(activityLevel !== undefined && { activityLevel }),
      ...(dateOfBirth !== undefined && {
        dateOfBirth: new Date(
          `${dateOfBirth}T00:00:00.000Z`
        ),
      }),
      ...(sex !== undefined && { sex }),
      ...(heightCm !== undefined && { heightCm }),
      ...(weightKg !== undefined && { weightKg }),
    };

    if (Object.keys(profileData).length > 0) {
      await tx.userProfile.update({
        where: {
          userId,
        },
        data: profileData,
      });
    }

    // Update dietary preference only when provided.
    if (dietType !== undefined) {
      await tx.dietaryPreference.update({
        where: {
          userId,
        },
        data: {
          dietType,
        },
      });
    }

    // Return the updated profile.
    return tx.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: true,
        dietaryPreference: true,
        foodDislikes: {
          include: {
            food: {
              select: {
                id: true,
                name: true,
                dietType: true,
              },
            },
          },
        },
      },
    });
  });
}

// Existing onboarding functionality.
export async function saveOnboardingDetails(
  userId: string,
  input: CompleteOnboardingInput
) {
  return prisma.$transaction(async (tx) => {
    const dislikedFoodIds = [
      ...new Set(input.dislikedFoodIds),
    ];

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

    const profileData = {
      primaryGoal: input.primaryGoal,
      activityLevel: input.activityLevel,
      dateOfBirth: new Date(
        `${input.dateOfBirth}T00:00:00.000Z`
      ),
      sex: input.sex,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
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

// Existing activity-level functionality.
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
