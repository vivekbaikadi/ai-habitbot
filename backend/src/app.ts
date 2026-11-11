import express from "express";
import cors from "cors";
import helmet from "helmet";

import { prisma } from "./database/prisma.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./common/middleware/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import goalRoutes from "./modules/goals/goal.routes.js";
import habitRoutes from "./modules/habits/habit.routes.js";
import completionRoutes from "./modules/completions/completion.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import foodRoutes from "./modules/foods/food.routes.js";
import foodLogRoutes from "./modules/food-logs/food-log.routes.js";
import nutritionRoutes from "./modules/nutrition/nutrition.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";


import swaggerUi from "swagger-ui-express";

import {
  openapiDocument
} from "./docs/openapi.js";


const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: "AI HabitBot API",
      version: "v1",
      status: "running"
    }
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok"
    }
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        database: "connected"
      }
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(503).json({
      success: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Database connection failed"
      }
    });
  }
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/habits", habitRoutes);
app.use("/api/v1", completionRoutes);
app.use(
  "/api/v1/dashboard",
  dashboardRoutes
);
app.use("/api/v1/foods", foodRoutes);
app.use("/api/v1/food-logs", foodLogRoutes);
app.use("/api/v1/nutrition", nutritionRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/analytics", analyticsRoutes);


app.use(errorMiddleware);

export default app;