export const dashboardPaths = {
  "/api/v1/dashboard/today": {
    get: {
      tags: ["Dashboard"],
      summary: "Get today's dashboard",
      description:
        "Returns the authenticated user's active goals, active habits, and today's habit completion status.",

      security: [
        {
          bearerAuth: []
        }
      ],

      responses: {
        "200": {
          description: "Today's dashboard retrieved successfully",

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

                      user: {
                        type: "object",

                        properties: {
                          id: {
                            type: "string",
                            format: "uuid"
                          },

                          name: {
                            type: "string",
                            example: "testuser2"
                          },

                          timezone: {
                            type: "string",
                            example: "Asia/Kolkata"
                          }
                        }
                      },

                      goals: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Goal"
                        }
                      },

                      habits: {
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

                            description: {
                              type: "string",
                              nullable: true
                            },

                            goalId: {
                              type: "string",
                              format: "uuid",
                              nullable: true
                            },

                            targetValue: {
                              type: "number",
                              nullable: true
                            },

                            targetUnit: {
                              type: "string",
                              nullable: true
                            },

                            frequency: {
                              type: "string",
                              enum: [
                                "DAILY",
                                "WEEKLY",
                                "CUSTOM"
                              ]
                            },

                            today: {
                              type: "object",

                              properties: {
                                completed: {
                                  type: "boolean"
                                },

                                completionCount: {
                                  type: "integer"
                                },

                                value: {
                                  type: "number",
                                  nullable: true
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