import { getTodayNutrition } from "../../nutrition/nutrition.service.js";

export async function getTodayNutritionTool(
  userId: string
) {
  const nutrition =
    await getTodayNutrition(userId);

  return {
    date: nutrition.date,

    totals: {
      calories:
        nutrition.totals.calories,

      protein:
        nutrition.totals.protein,

      carbohydrate:
        nutrition.totals.carbohydrate,

      fat:
        nutrition.totals.fat,

      fiber:
        nutrition.totals.fiber
    },

    meals: nutrition.meals
  };
}