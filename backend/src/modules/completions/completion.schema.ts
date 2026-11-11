import { z } from "zod";

export const createCompletionSchema = z.object({
  completedAt: z.coerce.date(),

  value: z
    .number()
    .nonnegative("Completion value cannot be negative")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional()
});

export const completionQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
}).superRefine((data, ctx) => {
  if (data.from && data.to && data.from > data.to) {
    ctx.addIssue({
      code: "custom",
      path: ["from"],
      message: "From date cannot be after to date"
    });
  }
});

export type CreateCompletionInput =
  z.infer<typeof createCompletionSchema>;

export type CompletionQuery =
  z.infer<typeof completionQuerySchema>;