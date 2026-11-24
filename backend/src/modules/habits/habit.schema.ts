
import { z } from "zod";

const habitWeekdaySchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
]);

const weeklyTargetSchema = z
  .number()
  .int("Weekly target must be a whole number")
  .min(1, "Weekly target must be at least 1")
  .max(7, "Weekly target cannot exceed 7");

const customDaysSchema = z
  .array(habitWeekdaySchema)
  .min(1, "Select at least one day")
  .max(7, "You cannot select more than 7 days")
  .refine(
    (days) => new Set(days).size === days.length,
    "Duplicate weekdays are not allowed"
  );

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

  weeklyTarget: weeklyTargetSchema.optional(),

  customDays: z
    .array(habitWeekdaySchema)
    .max(7, "You cannot select more than 7 days")
    .refine(
      (days) => new Set(days).size === days.length,
      "Duplicate weekdays are not allowed"
    )
    .optional(),

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

  if (
    data.frequency === "WEEKLY" &&
    data.weeklyTarget === undefined
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["weeklyTarget"],
      message: "Weekly target is required for weekly habits"
    });
  }

  if (
    data.frequency === "CUSTOM" &&
    (!data.customDays || data.customDays.length === 0)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["customDays"],
      message: "Select at least one day for custom habits"
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

  weeklyTarget: weeklyTargetSchema.optional(),

  customDays: z
    .array(habitWeekdaySchema)
    .max(7, "You cannot select more than 7 days")
    .refine(
      (days) => new Set(days).size === days.length,
      "Duplicate weekdays are not allowed"
    )
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
}).superRefine((data, ctx) => {
  if (
    data.frequency === "WEEKLY" &&
    data.weeklyTarget === undefined
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["weeklyTarget"],
      message: "Weekly target is required when changing frequency to weekly"
    });
  }

  if (
    data.frequency === "CUSTOM" &&
    (!data.customDays || data.customDays.length === 0)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["customDays"],
      message: "Select at least one day when changing frequency to custom"
    });
  }
});

export type CreateHabitInput =
  z.infer<typeof createHabitSchema>;

export type UpdateHabitInput =
  z.infer<typeof updateHabitSchema>;
