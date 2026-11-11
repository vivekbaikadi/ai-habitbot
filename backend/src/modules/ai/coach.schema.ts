import { z } from "zod";

export const coachRequestSchema = z.object({
  conversationId: z
    .string()
    .uuid()
    .optional(),

  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(
      2000,
      "Message must not exceed 2000 characters"
    )
});

export const coachResponseSchema = z
  .object({
    message: z
      .string()
      .min(1),

    priorities: z
      .array(
        z.object({
          type: z.enum([
            "HABIT",
            "NUTRITION",
            "GOAL",
            "GENERAL"
          ]),

          title: z.string().min(1),

          reason: z.string().min(1)
        })
      )
      .max(5)
  })
  .strict();

export type CoachRequest =
  z.infer<typeof coachRequestSchema>;

export type CoachResponse =
  z.infer<typeof coachResponseSchema>;