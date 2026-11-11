import { z } from "zod";

export const createGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Goal title must be at least 2 characters")
    .max(150, "Goal title must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Goal description must not exceed 1000 characters")
    .optional()
});

export const updateGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Goal title must be at least 2 characters")
    .max(150, "Goal title must not exceed 150 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Goal description must not exceed 1000 characters")
    .nullable()
    .optional(),

  isActive: z
    .boolean()
    .optional()
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;