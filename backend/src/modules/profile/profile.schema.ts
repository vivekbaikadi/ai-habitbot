
import { z } from "zod";

const dateOfBirthSchema = z
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
  }, "Date of birth must be a valid past date");

const primaryGoalSchema = z.enum([
  "WEIGHT_LOSS",
  "WEIGHT_MAINTENANCE",
  "MUSCLE_GAIN",
  "GENERAL_HEALTH",
]);

const activityLevelSchema = z.enum([
  "SEDENTARY",
  "LIGHT",
  "MODERATE",
  "VERY_ACTIVE",
  "EXTRA_ACTIVE",
]);

const sexSchema = z.enum([
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
]);

const dietTypeSchema = z.enum([
  "VEGETARIAN",
  "NON_VEGETARIAN",
  "EGGETARIAN",
  "VEGAN",
]);

export const completeOnboardingSchema = z.object({
  primaryGoal: primaryGoalSchema,

  activityLevel: activityLevelSchema,

  dateOfBirth: dateOfBirthSchema,

  sex: sexSchema,

  heightCm: z.number().min(50).max(300),

  weightKg: z.number().min(2).max(500),

  dietType: dietTypeSchema,

  dislikedFoodIds: z
    .array(z.string().uuid())
    .max(100)
    .default([]),
});

export type CompleteOnboardingInput =
  z.infer<typeof completeOnboardingSchema>;

// Profile update validation.
// All fields are optional so users can update individual details.

export const updateProfileSchema = z
  .object({
    primaryGoal: primaryGoalSchema.optional(),

    activityLevel: activityLevelSchema.optional(),

    dateOfBirth: dateOfBirthSchema.optional(),

    sex: sexSchema.optional(),

    heightCm: z.number().min(50).max(300).optional(),

    weightKg: z.number().min(2).max(500).optional(),

    dietType: dietTypeSchema.optional(),

    dislikedFoodIds: z
      .array(z.string().uuid())
      .max(100)
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one profile field must be provided"
  );

export type UpdateProfileInput =
  z.infer<typeof updateProfileSchema>;

// Existing activity-level update validation.

export const updateActivityLevelSchema = z.object({
  activityLevel: activityLevelSchema,
});

export type UpdateActivityLevelInput =
  z.infer<typeof updateActivityLevelSchema>;
