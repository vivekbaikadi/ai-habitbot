import { prisma } from "../../database/prisma.js";

import type {
  FoodQuery
} from "./food.schema.js";

import { AppError } from "../../common/errors/app.error.js";

export async function searchFoods(
  query: FoodQuery
) {
  const {
    search,
    foodType,
    dietType,
    categoryId,
    page,
    limit
  } = query;

  const skip = (page - 1) * limit;

  const where = {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const
              }
            },
            {
              aliases: {
                some: {
                  alias: {
                    contains: search,
                    mode: "insensitive" as const
                  }
                }
              }
            }
          ]
        }
      : {}),

    ...(foodType
      ? {
          foodType
        }
      : {}),

    ...(dietType
      ? {
          dietType
        }
      : {}),

    ...(categoryId
      ? {
          categoryId
        }
      : {})
  };

  const [foods, total] = await Promise.all([
    prisma.food.findMany({
      where,
      skip,
      take: limit,

      include: {
        category: true,

        aliases: true,

        portions: true
      },

      orderBy: {
        name: "asc"
      }
    }),

    prisma.food.count({
      where
    })
  ]);

  return {
    foods,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getFoodById(
  foodId: string
) {
  const food = await prisma.food.findUnique({
    where: {
      id: foodId
    },

    include: {
      category: true,

      aliases: true,

      portions: true,

      nutritionProfiles: {
        include: {
          source: true,

          nutrients: {
            include: {
              nutrient: true
            }
          }
        }
      }
    }
  });

  if (!food) {
    throw new AppError(
      "Food not found",
      404,
      "FOOD_NOT_FOUND"
    );
  }

  return food;
}