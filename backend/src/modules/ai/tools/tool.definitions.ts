import {
    Type
} from "@google/genai";

import type {
    FunctionDeclaration
} from "@google/genai";

export const habitStatsToolDefinition:
    FunctionDeclaration = {
    name: "get_habit_stats",

    description:
        "Get statistics for one of the user's habits, including current streak, longest streak, total completions, completion rate, and last completion date.",

    parameters: {
        type: Type.OBJECT,

        properties: {
            habitId: {
                type: Type.STRING,

                description:
                    "The ID of the user's habit."
            }
        },

        required: [
            "habitId"
        ]
    }
};

export const todayNutritionToolDefinition:
    FunctionDeclaration = {
    name: "get_today_nutrition",

    description:
        "Get the user's nutrition intake for today, including calories, protein, carbohydrates, fat, fiber, and logged meals.",

    parameters: {
        type: Type.OBJECT,

        properties: {}
    }
};

export const todayDashboardToolDefinition:
    FunctionDeclaration = {
    name: "get_today_dashboard",

    description:
        "Get the user's current dashboard for today, including active goals, habits, completion status, and today's progress.",

    parameters: {
        type: Type.OBJECT,

        properties: {}
    }
};

export const analyticsToolDefinition:
    FunctionDeclaration = {
    name: "get_analytics",

    description:
        "Get the user's historical performance analytics for today, this week, or this month. Includes habit completion performance, nutrition totals, average daily nutrition, meals logged, and daily trends. Use this when the user asks about their performance, progress, consistency, trends, or history over a period.",

    parameters: {
        type: Type.OBJECT,

        properties: {
            period: {
                type: Type.STRING,

                enum: [
                    "today",
                    "week",
                    "month"
                ],

                description:
                    "Analytics period. Use today for today's performance, week for the current calendar week, or month for the current calendar month."
            }
        },

        required: [
            "period"
        ]
    }
};

export const createHabitToolDefinition:
    FunctionDeclaration = {
    name: "create_habit",

    description:
        "Create a new habit for the authenticated user. Use this when the user explicitly asks you to create, add, or start a new habit.",

    parameters: {
        type: Type.OBJECT,

        properties: {
            name: {
                type: Type.STRING,

                description:
                    "Short name of the habit, such as 'Walk 8,000 steps' or 'Drink water'."
            },

            description: {
                type: Type.STRING,

                description:
                    "Optional detailed description of the habit."
            },

            goalId: {
                type: Type.STRING,

                description:
                    "Optional ID of an active goal belonging to the user."
            },

            targetValue: {
                type: Type.NUMBER,

                description:
                    "Optional positive target value for the habit."
            },

            targetUnit: {
                type: Type.STRING,

                description:
                    "Optional unit for the target, such as 'steps', 'liters', or 'minutes'."
            },

            frequency: {
                type: Type.STRING,

                enum: [
                    "DAILY",
                    "WEEKLY",
                    "CUSTOM"
                ],

                description:
                    "How frequently the habit should be performed."
            },

            startDate: {
                type: Type.STRING,

                description:
                    "Start date of the habit in ISO date format, for example 2026-08-27."
            },

            endDate: {
                type: Type.STRING,

                description:
                    "Optional end date of the habit in ISO date format."
            }
        },

        required: [
            "name",
            "startDate"
        ]
    }
};

export const completeHabitToolDefinition:
    FunctionDeclaration = {
    name: "complete_habit",

    description:
        "Mark one of the authenticated user's habits as completed. Use this when the user explicitly says they completed, finished, or did a habit.",

    parameters: {
        type: Type.OBJECT,

        properties: {
            habitId: {
                type: Type.STRING,

                description:
                    "The ID of the user's habit to mark as completed."
            },

            completedAt: {
                type: Type.STRING,

                description:
                    "Optional completion timestamp in ISO 8601 format. If omitted, the backend uses the current time."
            },

            value: {
                type: Type.NUMBER,

                description:
                    "Optional measured completion value, such as 8000 for 8,000 steps."
            },

            notes: {
                type: Type.STRING,

                description:
                    "Optional notes about the completion."
            }
        },

        required: [
            "habitId"
        ]
    }
};

export const searchFoodsToolDefinition:
  FunctionDeclaration = {
    name: "search_foods",

    description:
      "Search the user's available food database. Use this before logging food when you need to identify the correct food and valid portion names.",

    parameters: {
      type: Type.OBJECT,

      properties: {
        search: {
          type: Type.STRING,

          description:
            "Food name or description to search for, such as egg, paneer, rice, banana, or chicken."
        },

        foodType: {
          type: Type.STRING,

          description:
            "Optional food type: BASIC or PREPARED_DISH."
        },

        dietType: {
          type: Type.STRING,

          description:
            "Optional diet type: VEGETARIAN, NON_VEGETARIAN, EGGETARIAN, or VEGAN."
        },

        limit: {
          type: Type.NUMBER,

          description:
            "Maximum number of food results to return. Keep this small."
        }
      },

      required: [
        "search"
      ]
    }
  };


export const logFoodToolDefinition:
  FunctionDeclaration = {
    name: "log_food",

    description:
      "Log one or more foods that the authenticated user ate. Use search_foods first when the exact food ID or valid portion unit is unknown. Nutrition values are calculated by the backend from the food database.",

    parameters: {
      type: Type.OBJECT,

      properties: {
        eatenAt: {
          type: Type.STRING,

          description:
            "Optional ISO 8601 timestamp for when the food was eaten. If omitted, the current time is used."
        },

        mealType: {
          type: Type.STRING,

          description:
            "Meal type: BREAKFAST, MORNING_SNACK, LUNCH, EVENING_SNACK, DINNER, or OTHER."
        },

        rawInput: {
          type: Type.STRING,

          description:
            "The user's original food description."
        },

        notes: {
          type: Type.STRING,

          description:
            "Optional notes about the meal."
        },

        items: {
          type: Type.ARRAY,

          description:
            "Foods consumed in this meal. Each item must use a food ID and an exact portion name returned by search_foods.",

          items: {
            type: Type.OBJECT,

            properties: {
              foodId: {
                type: Type.STRING,

                description:
                  "ID of the food returned by search_foods."
              },

              quantity: {
                type: Type.NUMBER,

                description:
                  "Number of the selected portion consumed."
              },

              unit: {
                type: Type.STRING,

                description:
                  "Exact portion name returned by search_foods, such as '1 egg', '1 cup', or '100 g'."
              }
            },

            required: [
              "foodId",
              "quantity",
              "unit"
            ]
          }
        }
      },

      required: [
        "mealType",
        "items"
      ]
    }
  };