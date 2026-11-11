import apiClient from "./client";

export type MealType =
  | "BREAKFAST"
  | "MORNING_SNACK"
  | "LUNCH"
  | "EVENING_SNACK"
  | "DINNER"
  | "OTHER";

export interface CreateFoodLogItemInput {
  foodId: string;
  quantity: number;
  unit: string;
}

export interface CreateFoodLogInput {
  eatenAt: string;
  mealType: MealType;
  rawInput?: string;
  notes?: string;
  items: CreateFoodLogItemInput[];
}

export interface FoodLogItem {
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

export interface FoodLog {
  id: string;
  mealType: MealType;
  eatenAt: string;
  totals?: {
    calories: number;
    protein: number;
    carbohydrate: number;
    fat: number;
    fiber: number;
  };
  items: FoodLogItem[];
  [key: string]: unknown;
}

export interface FoodLogQuery {
  from?: string;
  to?: string;
  mealType?: MealType;
  page?: number;
  limit?: number;
}

export async function createFoodLog(
  input: CreateFoodLogInput
): Promise<FoodLog> {
  const response = await apiClient.post<{
    success: boolean;
    data: { foodLog: FoodLog };
  }>("/food-logs", input);

  return response.data.data.foodLog;
}

export async function getFoodLogs(
  params: FoodLogQuery = {}
): Promise<{
  foodLogs: FoodLog[];
  pagination?: Record<string, unknown>;
}> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      foodLogs: FoodLog[];
      pagination?: Record<string, unknown>;
    };
  }>("/food-logs", { params });

  return response.data.data;
}

export async function getFoodLog(foodLogId: string): Promise<FoodLog> {
  const response = await apiClient.get<{
    success: boolean;
    data: { foodLog: FoodLog };
  }>(`/food-logs/${foodLogId}`);

  return response.data.data.foodLog;
}

export async function deleteFoodLog(foodLogId: string): Promise<void> {
  await apiClient.delete(`/food-logs/${foodLogId}`);
}