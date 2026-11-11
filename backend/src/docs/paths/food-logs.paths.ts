export const foodLogPaths = {
  "/api/v1/food-logs": {
    post: {
      tags: ["Food Logs"],
      summary: "Log a meal",
      security: [{ bearerAuth: [] }],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: [
                "eatenAt",
                "mealType",
                "items"
              ],

              properties: {
                eatenAt: {
                  type: "string",
                  format: "date-time",
                  example: "2026-08-27T08:30:00.000Z"
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
                  ],
                  example: "BREAKFAST"
                },

                rawInput: {
                  type: "string",
                  maxLength: 2000,
                  example: "2 eggs and 100 g paneer"
                },

                notes: {
                  type: "string",
                  maxLength: 2000
                },

                items: {
                  type: "array",
                  minItems: 1,
                  maxItems: 50,

                  items: {
                    type: "object",

                    required: [
                      "foodId",
                      "quantity",
                      "unit"
                    ],

                    properties: {
                      foodId: {
                        type: "string",
                        format: "uuid"
                      },

                      quantity: {
                        type: "number",
                        exclusiveMinimum: 0,
                        example: 1
                      },

                      unit: {
                        type: "string",
                        example: "100 g"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      responses: {
        "201": {
          description: "Food log created successfully"
        },

        "400": {
          description: "Invalid food portion or validation error"
        },

        "404": {
          description: "Food not found"
        }
      }
    },

    get: {
      tags: ["Food Logs"],
      summary: "List food logs",
      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          description: "Start timestamp",
          schema: {
            type: "string",
            format: "date-time"
          }
        },

        {
          name: "to",
          in: "query",
          required: false,
          description: "End timestamp",
          schema: {
            type: "string",
            format: "date-time"
          }
        },

        {
          name: "mealType",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "BREAKFAST",
              "MORNING_SNACK",
              "LUNCH",
              "EVENING_SNACK",
              "DINNER",
              "OTHER"
            ]
          }
        },

        {
          name: "page",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            default: 1
          }
        },

        {
          name: "limit",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20
          }
        }
      ],

      responses: {
        "200": {
          description: "Food logs retrieved successfully"
        }
      }
    }
  },

  "/api/v1/food-logs/{id}": {
    get: {
      tags: ["Food Logs"],
      summary: "Get a food log",
      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid"
          }
        }
      ],

      responses: {
        "200": {
          description: "Food log retrieved successfully"
        },

        "404": {
          description: "Food log not found"
        }
      }
    },

    delete: {
      tags: ["Food Logs"],
      summary: "Delete a food log",
      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid"
          }
        }
      ],

      responses: {
        "200": {
          description: "Food log deleted successfully"
        },

        "404": {
          description: "Food log not found"
        }
      }
    }
  }
};