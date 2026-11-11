import { z } from "zod";

export const foodQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

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

  categoryId: z
    .string()
    .uuid()
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

export type FoodQuery = z.infer<
  typeof foodQuerySchema
>;