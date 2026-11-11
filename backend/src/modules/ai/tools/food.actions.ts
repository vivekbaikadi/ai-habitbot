import { z } from "zod";

import {
  searchFoods
} from "../../foods/food.service.js";

import {
  createFoodLog
} from "../../food-logs/food-log.service.js";

const searchFoodsInputSchema = z.object({
  search: z
    .string()
    .trim()
    .min(1)
    .max(100),

  foodType: z
    .enum(["BASIC", "PREPARED_DISH"])
    .optional(),

  dietType: z
    .enum([
      "VEGETARIAN",
      "NON_VEGETARIAN",
      "EGGETARIAN",
      "VEGAN"
    ])
    .optional(),

  limit: z
    .number()
    .int()
    .positive()
    .max(20)
    .default(10)
});

export async function searchFoodsTool(
  input: unknown
) {
  const parsed =
    searchFoodsInputSchema.parse(input);

  const result = await searchFoods({
    search: parsed.search,
    foodType: parsed.foodType,
    dietType: parsed.dietType,
    page: 1,
    limit: parsed.limit
  });

  return {
    foods: result.foods.map((food) => ({
      id: food.id,
      name: food.name,
      description: food.description,
      foodType: food.foodType,
      dietType: food.dietType,

      aliases: food.aliases.map(
        (alias) => alias.alias
      ),

      portions: food.portions.map(
        (portion) => ({
          name: portion.name,
          grams: Number(portion.grams)
        })
      )
    }))
  };
}

const logFoodInputSchema =
  z.object({
    eatenAt: z
      .coerce
      .date()
      .optional(),

    mealType: z.enum([
      "BREAKFAST",
      "MORNING_SNACK",
      "LUNCH",
      "EVENING_SNACK",
      "DINNER",
      "OTHER"
    ]),

    rawInput: z
      .string()
      .trim()
      .max(2000)
      .optional(),

    notes: z
      .string()
      .trim()
      .max(2000)
      .optional(),

    items: z
      .array(
        z.object({
          foodId: z
            .string()
            .uuid(),

          quantity: z
            .number()
            .positive(),

          unit: z
            .string()
            .trim()
            .min(1)
            .max(100)
        })
      )
      .min(1)
      .max(50)
  });

export async function logFoodTool(
  userId: string,
  input: unknown
) {
  const parsed =
    logFoodInputSchema.parse(input);

  const foodLog =
    await createFoodLog(
      userId,
      {
        eatenAt:
          parsed.eatenAt ?? new Date(),

        mealType:
          parsed.mealType,

        ...(parsed.rawInput !== undefined && {
          rawInput:
            parsed.rawInput
        }),

        ...(parsed.notes !== undefined && {
          notes:
            parsed.notes
        }),

        items: parsed.items
      }
    );

  return {
    success: true,

    foodLog: {
      id: foodLog.id,
      eatenAt: foodLog.eatenAt,
      mealType: foodLog.mealType,

      items: foodLog.items.map(
        (item) => ({
          id: item.id,
          foodId: item.foodId,
          foodName: item.food.name,
          quantity:
            Number(item.quantity),
          unit: item.unit,
          grams:
            Number(item.grams),
          calories:
            Number(item.calories ?? 0),
          protein:
            Number(item.protein ?? 0),
          carbohydrate:
            Number(
              item.carbohydrate ?? 0
            ),
          fat:
            Number(item.fat ?? 0),
          fiber:
            Number(item.fiber ?? 0)
        })
      )
    }
  };
}