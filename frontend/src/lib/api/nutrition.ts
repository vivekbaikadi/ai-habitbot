import apiClient from "./client";
import type { MealType } from "./food-logs";

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber: number;
}

export interface TodayNutritionItem {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
  grams: number;
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber: number;
}

export interface TodayNutritionMeal {
  id: string;
  mealType: MealType;
  eatenAt: string;
  totals: NutritionTotals;
  items: TodayNutritionItem[];
}

export interface TodayNutrition {
  date: string;
  totals: NutritionTotals;
  meals: TodayNutritionMeal[];
}

export async function getTodayNutrition(): Promise<TodayNutrition> {
  const response = await apiClient.get<{
    success: boolean;
    data: TodayNutrition;
  }>("/nutrition/today");

  return response.data.data;
}