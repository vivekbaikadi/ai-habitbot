import type { OpenAPIV3 } from "openapi-types";

import { authPaths } from "./paths/auth.paths.js";
import { goalPaths } from "./paths/goals.paths.js";
import { habitPaths } from "./paths/habits.paths.js";
import { completionPaths } from "./paths/completions.paths.js";
import { dashboardPaths } from "./paths/dashboard.paths.js";
import { foodPaths } from "./paths/foods.paths.js";
import { foodLogPaths } from "./paths/food-logs.paths.js";
import { nutritionPaths } from "./paths/nutrition.paths.js";
import { analyticsPaths } from "./paths/analytics.paths.js";
import { aiPaths } from "./paths/ai.paths.js";

export const openapiDocument: OpenAPIV3.Document = {
    openapi: "3.0.3",

    info: {
        title: "AI HabitBot API",
        version: "1.0.0",
        description:
            "API for AI HabitBot — an AI-powered habit and nutrition tracking application."
    },

    servers: [
        {
            url: "http://localhost:5000",
            description: "Local development server"
        }
    ],

    tags: [
        {
            name: "Auth",
            description: "Authentication and user sessions"
        },
        {
            name: "Goals",
            description: "User goals"
        },
        {
            name: "Habits",
            description: "User habits"
        },
        {
            name: "Completions",
            description: "Habit completions and statistics"
        },
        {
            name: "Dashboard",
            description: "Today's dashboard"
        },
        {
            name: "Foods",
            description: "Food database"
        },
        {
            name: "Food Logs",
            description: "Food consumption logs"
        },
        {
            name: "Nutrition",
            description: "Nutrition tracking"
        },
        {
            name: "Analytics",
            description: "Habit and nutrition analytics"
        },
        {
            name: "AI Coach",
            description: "AI HabitBot coaching"
        }
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },

        schemas: {
            Error: {
                type: "object",

                properties: {
                    success: {
                        type: "boolean",
                        example: false
                    },

                    error: {
                        type: "object",

                        properties: {
                            code: {
                                type: "string",
                                example: "HABIT_NOT_FOUND"
                            },

                            message: {
                                type: "string",
                                example: "Habit not found"
                            }
                        },

                        required: [
                            "code",
                            "message"
                        ]
                    }
                },

                required: [
                    "success",
                    "error"
                ]
            }
        }
    },

    paths: {
        ...authPaths,
        ...goalPaths,
        ...habitPaths,
        ...completionPaths,
        ...dashboardPaths,
        ...foodPaths,
        ...foodLogPaths,
        ...nutritionPaths,
        ...analyticsPaths,
        ...aiPaths
    } as unknown as OpenAPIV3.PathsObject
};