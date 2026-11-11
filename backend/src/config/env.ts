import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),

  JWT_REFRESH_SECRET: z.string().min(16),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  FRONTEND_URL: z.string().url(),

  GEMINI_API_KEY: z
    .string()
    .min(1),

  GEMINI_MODEL: z
    .string()
    .default("gemini-3.6-flash")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;