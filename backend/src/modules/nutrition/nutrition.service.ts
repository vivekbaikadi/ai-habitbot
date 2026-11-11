import { prisma } from "../../database/prisma.js";

import {
  getUserDayRange
} from "../../common/utils/date.utils.js";

export async function getTodayNutrition(
  userId: string
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId
      },

      select: {
        profile: {
          select: {
            timezone: true
          }
        }
      }
    });

  const timezone =
    user?.profile?.timezone ??
    "Asia/Kolkata";

  const {
    startOfDay,
    endOfDay,
    date
  } = getUserDayRange(timezone);

  const logs =
    await prisma.foodLog.findMany({
      where: {
        userId,

        eatenAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },

      include: {
        items: {
          include: {
            food: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },

      orderBy: {
        eatenAt: "asc"
      }
    });

  const totals = {
    calories: 0,
    protein: 0,
    carbohydrate: 0,
    fat: 0,
    fiber: 0
  };

  for (const log of logs) {
    for (const item of log.items) {
      totals.calories +=
        Number(item.calories ?? 0);

      totals.protein +=
        Number(item.protein ?? 0);

      totals.carbohydrate +=
        Number(
          item.carbohydrate ?? 0
        );

      totals.fat +=
        Number(item.fat ?? 0);

      totals.fiber +=
        Number(item.fiber ?? 0);
    }
  }

  const meals = logs.map((log) => {
    const mealTotals = {
      calories: 0,
      protein: 0,
      carbohydrate: 0,
      fat: 0,
      fiber: 0
    };

    for (const item of log.items) {
      mealTotals.calories +=
        Number(item.calories ?? 0);

      mealTotals.protein +=
        Number(item.protein ?? 0);

      mealTotals.carbohydrate +=
        Number(
          item.carbohydrate ?? 0
        );

      mealTotals.fat +=
        Number(item.fat ?? 0);

      mealTotals.fiber +=
        Number(item.fiber ?? 0);
    }

    return {
      id: log.id,
      mealType: log.mealType,
      eatenAt: log.eatenAt,

      totals: mealTotals,

      items: log.items.map(
        (item) => ({
          id: item.id,
          foodId: item.foodId,
          foodName:
            item.food.name,

          quantity:
            Number(item.quantity),

          unit: item.unit,

          grams:
            Number(item.grams),

          calories:
            Number(
              item.calories ?? 0
            ),

          protein:
            Number(
              item.protein ?? 0
            ),

          carbohydrate:
            Number(
              item.carbohydrate ?? 0
            ),

          fat:
            Number(
              item.fat ?? 0
            ),

          fiber:
            Number(
              item.fiber ?? 0
            )
        })
      )
    };
  });

  return {
    date,

    totals,

    meals
  };
}