export const analyticsPaths = {
  "/api/v1/analytics": {
    get: {
      tags: ["Analytics"],
      summary: "Get habit and nutrition analytics",

      description:
        "Returns habit performance and nutrition analytics for today, the current week, or the current calendar month.",

      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "period",
          in: "query",
          required: false,

          description:
            "Analytics period",

          schema: {
            type: "string",
            enum: [
              "today",
              "week",
              "month"
            ],
            default: "today"
          },

          example: "week"
        }
      ],

      responses: {
        "200": {
          description:
            "Analytics retrieved successfully",

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
                      period: {
                        type: "string",
                        enum: [
                          "today",
                          "week",
                          "month"
                        ]
                      },

                      dateRange: {
                        type: "object",

                        properties: {
                          start: {
                            type: "string",
                            format: "date"
                          },

                          end: {
                            type: "string",
                            format: "date"
                          },

                          timezone: {
                            type: "string",
                            example: "Asia/Kolkata"
                          }
                        }
                      },

                      habits: {
                        type: "object",

                        properties: {
                          total: {
                            type: "integer"
                          },

                          expected: {
                            type: "integer"
                          },

                          completed: {
                            type: "integer"
                          },

                          pending: {
                            type: "integer"
                          },

                          completionRate: {
                            type: "number",
                            example: 72.5
                          },

                          byHabit: {
                            type: "array",

                            items: {
                              type: "object",

                              properties: {
                                id: {
                                  type: "string",
                                  format: "uuid"
                                },

                                name: {
                                  type: "string"
                                },

                                frequency: {
                                  type: "string",
                                  enum: [
                                    "DAILY",
                                    "WEEKLY",
                                    "CUSTOM"
                                  ]
                                },

                                targetValue: {
                                  type: "number",
                                  nullable: true
                                },

                                targetUnit: {
                                  type: "string",
                                  nullable: true
                                },

                                expectedDays: {
                                  type: "integer"
                                },

                                completedDays: {
                                  type: "integer"
                                },

                                completionRate: {
                                  type: "number"
                                },

                                totalValue: {
                                  type: "number"
                                },

                                lastCompletedAt: {
                                  type: "string",
                                  format: "date-time",
                                  nullable: true
                                }
                              }
                            }
                          }
                        }
                      },

                      nutrition: {
                        type: "object",

                        properties: {
                          totals: {
                            $ref: "#/components/schemas/NutritionTotals"
                          },

                          averageDaily: {
                            $ref: "#/components/schemas/NutritionTotals"
                          },

                          mealsLogged: {
                            type: "integer"
                          }
                        }
                      },

                      daily: {
                        type: "array",

                        items: {
                          type: "object",

                          properties: {
                            date: {
                              type: "string",
                              format: "date"
                            },

                            habitsCompleted: {
                              type: "integer"
                            },

                            habitsExpected: {
                              type: "integer"
                            },

                            habitCompletionRate: {
                              type: "number"
                            },

                            nutrition: {
                              $ref: "#/components/schemas/NutritionTotals"
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

        "400": {
          description: "Invalid analytics period"
        },

        "401": {
          description: "Authentication required"
        }
      }
    }
  }
};