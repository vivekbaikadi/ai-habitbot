import { z } from "zod";

import {
  createCompletion
} from "../../completions/completion.service.js";

const completeHabitInputSchema =
  z.object({
    habitId: z
      .string()
      .uuid("Invalid habit ID"),

    completedAt: z
      .coerce
      .date()
      .optional(),

    value: z
      .number()
      .nonnegative(
        "Completion value cannot be negative"
      )
      .optional(),

    notes: z
      .string()
      .trim()
      .max(
        1000,
        "Notes must not exceed 1000 characters"
      )
      .optional()
  });

export async function completeHabitTool(
  userId: string,
  input: unknown
) {
  const parsed =
    completeHabitInputSchema.parse(input);

  const completedAt =
    parsed.completedAt ?? new Date();

  const completion =
    await createCompletion(
      userId,
      parsed.habitId,
      {
        completedAt,

        ...(parsed.value !== undefined && {
          value: parsed.value
        }),

        ...(parsed.notes !== undefined && {
          notes: parsed.notes
        })
      }
    );

  return {
    success: true,

    completion: {
      id: completion.id,

      habitId:
        completion.habitId,

      completedAt:
        completion.completedAt,

      value:
        completion.value !== null
          ? Number(completion.value)
          : null,

      notes:
        completion.notes
    }
  };
}