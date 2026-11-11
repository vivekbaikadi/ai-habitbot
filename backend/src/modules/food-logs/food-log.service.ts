import { prisma } from "../../database/prisma.js";
import { AppError } from "../../common/errors/app.error.js";

import type {
  CreateFoodLogInput,
  FoodLogQuery
} from "./food-log.schema.js";

export async function createFoodLog(
  userId: string,
  input: CreateFoodLogInput
) {
  /*
   * Load all requested foods and their portions/nutrition
   * in one database query.
   */
  const foodIds = [
    ...new Set(
      input.items.map((item) => item.foodId)
    )
  ];

  const foods = await prisma.food.findMany({
    where: {
      id: {
        in: foodIds
      }
    },

    include: {
      portions: true,

      nutritionProfiles: {
        where: {
          sourceId: {
            not: null
          }
        },

        include: {
          nutrients: {
            include: {
              nutrient: true
            }
          }
        }
      }
    }
  });

  if (foods.length !== foodIds.length) {
    throw new AppError(
      "One or more foods were not found",
      404,
      "FOOD_NOT_FOUND"
    );
  }

  const foodMap = new Map(
    foods.map((food) => [
      food.id,
      food
    ])
  );

  /*
   * Resolve every requested food item.
   */
  const calculatedItems = input.items.map(
    (item) => {
      const food = foodMap.get(item.foodId);

      if (!food) {
        throw new AppError(
          "Food not found",
          404,
          "FOOD_NOT_FOUND"
        );
      }

      const portion = food.portions.find(
        (candidate) =>
          candidate.name.toLowerCase() ===
          item.unit.toLowerCase()
      );

      if (!portion) {
        throw new AppError(
          `Portion "${item.unit}" is not available for ${food.name}`,
          400,
          "INVALID_FOOD_PORTION"
        );
      }

      const grams =
        Number(portion.grams) *
        item.quantity;

      /*
       * Nutrition profiles are based on 100g.
       */
      const profile =
        food.nutritionProfiles[0];

      if (!profile) {
        throw new AppError(
          `Nutrition information is unavailable for ${food.name}`,
          400,
          "NUTRITION_DATA_UNAVAILABLE"
        );
      }

      const nutrition = {
        calories: 0,
        protein: 0,
        carbohydrate: 0,
        fat: 0,
        fiber: 0
      };

      for (const item of profile.nutrients) {
        const valuePerBasis =
          Number(item.value);

        const multiplier =
          grams /
          Number(profile.basisGrams);

        const value =
          valuePerBasis * multiplier;

        switch (item.nutrient.code) {
          case "CALORIES":
            nutrition.calories = value;
            break;

          case "PROTEIN":
            nutrition.protein = value;
            break;

          case "CARBOHYDRATE":
            nutrition.carbohydrate = value;
            break;

          case "FAT":
            nutrition.fat = value;
            break;

          case "FIBER":
            nutrition.fiber = value;
            break;
        }
      }

      return {
        foodId: food.id,
        quantity: item.quantity,
        unit: item.unit,
        grams,

        calories: nutrition.calories,
        protein: nutrition.protein,
        carbohydrate:
          nutrition.carbohydrate,
        fat: nutrition.fat,
        fiber: nutrition.fiber
      };
    }
  );

  /*
   * Create the meal and all items atomically.
   */
  return prisma.$transaction(
    async (tx) => {
      const foodLog =
        await tx.foodLog.create({
          data: {
            userId,
            eatenAt: input.eatenAt,
            mealType: input.mealType,

            ...(input.rawInput !== undefined && {
              rawInput: input.rawInput
            }),

            ...(input.notes !== undefined && {
              notes: input.notes
            }),

            items: {
              create: calculatedItems
            }
          },

          include: {
            items: {
              include: {
                food: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        });

      return {
        ...foodLog,

        items: foodLog.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          grams: Number(item.grams),
          calories: Number(item.calories),
          protein: Number(item.protein),
          carbohydrate: Number(item.carbohydrate),
          fat: Number(item.fat),
          fiber: Number(item.fiber)
        }))
      };
    }
  );
}

export async function getFoodLogs(
  userId: string,
  query: FoodLogQuery
) {
  const {
    from,
    to,
    mealType,
    page,
    limit
  } = query;

  const skip = (page - 1) * limit;

  const where = {
    userId,

    ...(mealType && {
      mealType
    }),

    ...(from || to
      ? {
        eatenAt: {
          ...(from && {
            gte: from
          }),

          ...(to && {
            lte: to
          })
        }
      }
      : {})
  };

  const [logs, total] =
    await Promise.all([
      prisma.foodLog.findMany({
        where,

        skip,
        take: limit,

        include: {
          items: {
            include: {
              food: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        },

        orderBy: {
          eatenAt: "desc"
        }
      }),

      prisma.foodLog.count({
        where
      })
    ]);

  return {
    logs,

    pagination: {
      page,
      limit,
      total,
      totalPages:
        Math.ceil(total / limit)
    }
  };
}

export async function getFoodLogById(
  userId: string,
  foodLogId: string
) {
  const foodLog =
    await prisma.foodLog.findFirst({
      where: {
        id: foodLogId,
        userId
      },

      include: {
        items: {
          include: {
            food: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

  if (!foodLog) {
    throw new AppError(
      "Food log not found",
      404,
      "FOOD_LOG_NOT_FOUND"
    );
  }

  return foodLog;
}

export async function deleteFoodLog(
  userId: string,
  foodLogId: string
) {
  const foodLog =
    await getFoodLogById(
      userId,
      foodLogId
    );

  await prisma.foodLog.delete({
    where: {
      id: foodLog.id
    }
  });
}