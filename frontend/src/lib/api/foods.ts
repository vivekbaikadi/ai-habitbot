import apiClient from "./client";

export type FoodType = "BASIC" | "PREPARED_DISH";

export type DietType =
  | "VEGETARIAN"
  | "NON_VEGETARIAN"
  | "EGGETARIAN"
  | "VEGAN";

export interface FoodPortion {
  id: string;
  name?: string;
  label?: string;
  unit?: string;
  grams?: number | string;
  weightInGrams?: number | string;
  [key: string]: unknown;
}

export interface FoodCategory {
  id: string;
  name: string;
}

export interface Food {
  id: string;
  name: string;
  description?: string | null;
  foodType?: FoodType;
  category?: FoodCategory | null;
  aliases?: Array<{ id?: string; alias: string }>;
  portions?: FoodPortion[];
  [key: string]: unknown;
}

export interface FoodSearchParams {
  search?: string;
  foodType?: FoodType;
  dietType?: DietType;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface FoodSearchResult {
  foods: Food[];
  pagination: {
    page: number;
    limit: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export async function searchFoods(
  params: FoodSearchParams = {}
): Promise<FoodSearchResult> {
  const response = await apiClient.get<{
    success: boolean;
    data: FoodSearchResult;
  }>("/foods", { params });

  return response.data.data;
}

export async function getFoodById(foodId: string): Promise<Food> {
  const response = await apiClient.get<{
    success: boolean;
    data: { food: Food };
  }>(`/foods/${foodId}`);

  return response.data.data.food;
}