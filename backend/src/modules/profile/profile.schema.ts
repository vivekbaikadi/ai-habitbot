
import { z } from "zod";

export const completeOnboardingSchema = z.object({
  primaryGoal: z.enum([
    "WEIGHT_LOSS",
    "WEIGHT_MAINTENANCE",
    "MUSCLE_GAIN",
    "GENERAL_HEALTH"
  ]),

  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "VERY_ACTIVE",
    "EXTRA_ACTIVE"
  ]),

  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .refine((value) => {
      const [year, month, day] = value.split("-").map(Number);

      const date = new Date(
        Date.UTC(year!, month! - 1, day!)
      );

      const isValidDate =
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month! - 1 &&
        date.getUTCDate() === day;

      return (
        isValidDate &&
        value < new Date().toISOString().slice(0, 10)
      );
    }, "Date of birth must be a valid past date"),

  sex: z.enum([
    "MALE",
    "FEMALE",
    "OTHER",
    "PREFER_NOT_TO_SAY"
  ]),

  heightCm: z.number().min(50).max(300),

  weightKg: z.number().min(2).max(500),

  dietType: z.enum([
    "VEGETARIAN",
    "NON_VEGETARIAN",
    "EGGETARIAN",
    "VEGAN"
  ]),

  dislikedFoodIds: z
    .array(z.string().uuid())
    .max(100)
    .default([])
});

export type CompleteOnboardingInput =
  z.infer<typeof completeOnboardingSchema>;


export const updateActivityLevelSchema = z.object({
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "VERY_ACTIVE",
    "EXTRA_ACTIVE"
  ])
});

export type UpdateActivityLevelInput =
  z.infer<typeof updateActivityLevelSchema>;
