import { z } from "zod";

const foodLogItemSchema = z.object({
  foodId: z
    .string()
    .uuid("Invalid food ID"),

  quantity: z
    .number()
    .positive("Quantity must be greater than 0"),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(100, "Unit must not exceed 100 characters")
});

export const createFoodLogSchema = z.object({
  eatenAt: z.coerce.date(),

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
    .array(foodLogItemSchema)
    .min(1, "At least one food item is required")
    .max(50, "A meal cannot contain more than 50 items")
});

export const foodLogQuerySchema = z.object({
  from: z.coerce.date().optional(),

  to: z.coerce.date().optional(),

  mealType: z
    .enum([
      "BREAKFAST",
      "MORNING_SNACK",
      "LUNCH",
      "EVENING_SNACK",
      "DINNER",
      "OTHER"
    ])
    .optional(),

  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
});

export type CreateFoodLogInput =
  z.infer<typeof createFoodLogSchema>;

export type FoodLogQuery =
  z.infer<typeof foodLogQuerySchema>;