import { z } from "zod";

export const analyticsQuerySchema = z.object({
  period: z
    .enum([
      "today",
      "week",
      "month"
    ])
    .default("today")
});

export type AnalyticsQuery =
  z.infer<typeof analyticsQuerySchema>;