export const nutritionPaths = {
  "/api/v1/nutrition/today": {
    get: {
      tags: ["Nutrition"],
      summary: "Get today's nutrition",
      description:
        "Returns today's nutrition totals and all meals logged today using the user's configured timezone.",

      security: [{ bearerAuth: [] }],

      responses: {
        "200": {
          description: "Today's nutrition retrieved successfully",

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  success: {
                    type: "boolean",
                    example: true
                  },

                  data: {
                    type: "object",

                    properties: {
                      date: {
                        type: "string",
                        format: "date",
                        example: "2026-08-27"
                      },

                      totals: {
                        $ref: "#/components/schemas/NutritionTotals"
                      },

                      meals: {
                        type: "array",

                        items: {
                          type: "object",

                          properties: {
                            id: {
                              type: "string",
                              format: "uuid"
                            },

                            mealType: {
                              type: "string",
                              enum: [
                                "BREAKFAST",
                                "MORNING_SNACK",
                                "LUNCH",
                                "EVENING_SNACK",
                                "DINNER",
                                "OTHER"
                              ]
                            },

                            eatenAt: {
                              type: "string",
                              format: "date-time"
                            },

                            totals: {
                              $ref: "#/components/schemas/NutritionTotals"
                            },

                            items: {
                              type: "array",

                              items: {
                                type: "object",

                                properties: {
                                  id: {
                                    type: "string",
                                    format: "uuid"
                                  },

                                  foodId: {
                                    type: "string",
                                    format: "uuid"
                                  },

                                  foodName: {
                                    type: "string"
                                  },

                                  quantity: {
                                    type: "number"
                                  },

                                  unit: {
                                    type: "string"
                                  },

                                  grams: {
                                    type: "number"
                                  },

                                  calories: {
                                    type: "number"
                                  },

                                  protein: {
                                    type: "number"
                                  },

                                  carbohydrate: {
                                    type: "number"
                                  },

                                  fat: {
                                    type: "number"
                                  },

                                  fiber: {
                                    type: "number"
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        "401": {
          description: "Authentication required"
        }
      }
    }
  }
};