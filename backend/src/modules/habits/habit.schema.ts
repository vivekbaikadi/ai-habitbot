import { z } from "zod";

export const createHabitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Habit name must be at least 2 characters")
    .max(150, "Habit name must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Habit description must not exceed 1000 characters")
    .optional(),

  goalId: z
    .string()
    .uuid("Invalid goal ID")
    .optional(),

  targetValue: z
    .number()
    .positive("Target value must be greater than 0")
    .optional(),

  targetUnit: z
    .string()
    .trim()
    .max(50, "Target unit must not exceed 50 characters")
    .optional(),

  frequency: z.enum([
    "DAILY",
    "WEEKLY",
    "CUSTOM"
  ]).default("DAILY"),

  startDate: z.coerce.date(),

  endDate: z.coerce.date().optional()
}).superRefine((data, ctx) => {
  if (
    data.endDate &&
    data.endDate < data.startDate
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date cannot be before start date"
    });
  }
});

export const updateHabitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .optional(),

  goalId: z
    .string()
    .uuid()
    .nullable()
    .optional(),

  targetValue: z
    .number()
    .positive()
    .nullable()
    .optional(),

  targetUnit: z
    .string()
    .trim()
    .max(50)
    .nullable()
    .optional(),

  frequency: z
    .enum([
      "DAILY",
      "WEEKLY",
      "CUSTOM"
    ])
    .optional(),

  startDate: z
    .coerce.date()
    .optional(),

  endDate: z
    .coerce.date()
    .nullable()
    .optional(),

  isActive: z
    .boolean()
    .optional()
});

export type CreateHabitInput =
  z.infer<typeof createHabitSchema>;

export type UpdateHabitInput =
  z.infer<typeof updateHabitSchema>;