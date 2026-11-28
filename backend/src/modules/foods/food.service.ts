
import { prisma } from "../../database/prisma.js";

import type {
  FoodQuery,
  FoodHistoryQuery
} from "./food.schema.js";

import { AppError } from "../../common/errors/app.error.js";

const foodHistoryInclude = {
  category: true,
  aliases: true,
  portions: true
} as const;

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

    ...(foodType ? { foodType } : {}),
    ...(dietType ? { dietType } : {}),
    ...(categoryId ? { categoryId } : {})
  };

  const [foods, total] = await Promise.all([
    prisma.food.findMany({
      where,
      skip,
      take: limit,
      include: foodHistoryInclude,
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

export async function getRecentFoods(
  userId: string,
  limit: FoodHistoryQuery["limit"]
) {
  const recentItems = await prisma.foodLogItem.findMany({
    where: {
      foodLog: {
        userId
      }
    },

    distinct: ["foodId"],

    orderBy: [
      {
        foodLog: {
          eatenAt: "desc"
        }
      },
      {
        foodId: "asc"
      }
    ],

    take: limit,

    select: {
      food: {
        include: foodHistoryInclude
      }
    }
  });

  return recentItems.map((item) => item.food);
}

export async function getFrequentFoods(
  userId: string,
  limit: FoodHistoryQuery["limit"]
) {
  const frequentItems = await prisma.foodLogItem.groupBy({
    by: ["foodId"],

    where: {
      foodLog: {
        userId
      }
    },

    _count: {
      foodId: true
    },

    orderBy: [
      {
        _count: {
          foodId: "desc"
        }
      },
      {
        foodId: "asc"
      }
    ],

    take: limit
  });

  if (frequentItems.length === 0) {
    return [];
  }

  const foods = await prisma.food.findMany({
    where: {
      id: {
        in: frequentItems.map((item) => item.foodId)
      }
    },

    include: foodHistoryInclude
  });

  const foodMap = new Map(
    foods.map((food) => [food.id, food])
  );

  return frequentItems.flatMap((item) => {
    const food = foodMap.get(item.foodId);

    if (!food) {
      return [];
    }

    return [{
      ...food,
      consumptionCount: item._count.foodId
    }];
  });
}
