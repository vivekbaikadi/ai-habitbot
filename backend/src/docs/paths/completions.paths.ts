export const completionPaths = {
  "/api/v1/habits/{id}/completions": {
    post: {
      tags: ["Completions"],
      summary: "Complete a habit",
      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Habit ID",
          schema: {
            type: "string",
            format: "uuid"
          }
        }
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: ["completedAt"],

              properties: {
                completedAt: {
                  type: "string",
                  format: "date-time",
                  example: "2026-08-27T18:30:00.000Z"
                },

                value: {
                  type: "number",
                  minimum: 0,
                  example: 8000
                },

                notes: {
                  type: "string",
                  maxLength: 1000,
                  example: "Completed my step target"
                }
              }
            }
          }
        }
      },

      responses: {
        "201": {
          description: "Habit completion created successfully"
        },

        "400": {
          description: "Invalid completion"
        },

        "404": {
          description: "Habit not found"
        }
      }
    },

    get: {
      tags: ["Completions"],
      summary: "Get habit completions",
      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Habit ID",
          schema: {
            type: "string",
            format: "uuid"
          }
        },

        {
          name: "from",
          in: "query",
          required: false,
          description: "Return completions from this timestamp",
          schema: {
            type: "string",
            format: "date-time"
          }
        },

        {
          name: "to",
          in: "query",
          required: false,
          description: "Return completions until this timestamp",
          schema: {
            type: "string",
            format: "date-time"
          }
        }
      ],

      responses: {
        "200": {
          description: "Habit completions retrieved successfully"
        },

        "404": {
          description: "Habit not found"
        }
      }
    }
  },

  "/api/v1/habits/{id}/stats": {
    get: {
      tags: ["Completions"],
      summary: "Get habit statistics",
      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Habit ID",
          schema: {
            type: "string",
            format: "uuid"
          }
        }
      ],

      responses: {
        "200": {
          description: "Habit statistics retrieved successfully",

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
                      currentStreak: {
                        type: "integer",
                        example: 7
                      },

                      longestStreak: {
                        type: "integer",
                        example: 14
                      },

                      totalCompletions: {
                        type: "integer",
                        example: 35
                      },

                      completionRate: {
                        type: "number",
                        example: 82.35
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
        },

        "404": {
          description: "Habit not found"
        }
      }
    }
  }
};