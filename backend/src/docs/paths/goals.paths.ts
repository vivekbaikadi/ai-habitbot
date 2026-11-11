export const goalPaths = {
  "/api/v1/goals": {
    post: {
      tags: ["Goals"],
      summary: "Create a goal",

      security: [
        {
          bearerAuth: []
        }
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: ["title"],

              properties: {
                title: {
                  type: "string",
                  minLength: 2,
                  maxLength: 150,
                  example: "Lose 5 kg"
                },

                description: {
                  type: "string",
                  maxLength: 1000,
                  example:
                    "Build healthier daily habits"
                }
              }
            }
          }
        }
      },

      responses: {
        "201": {
          description: "Goal created"
        },
        "400": {
          description: "Validation error"
        }
      }
    },

    get: {
      tags: ["Goals"],
      summary: "List user's goals",

      security: [
        {
          bearerAuth: []
        }
      ],

      responses: {
        "200": {
          description: "Goals retrieved successfully"
        }
      }
    }
  },

  "/api/v1/goals/{id}": {
    get: {
      tags: ["Goals"],
      summary: "Get a goal",

      security: [
        {
          bearerAuth: []
        }
      ],

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
          description: "Goal retrieved"
        },
        "404": {
          description: "Goal not found"
        }
      }
    },

    patch: {
      tags: ["Goals"],
      summary: "Update a goal",

      security: [
        {
          bearerAuth: []
        }
      ],

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

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                title: {
                  type: "string",
                  minLength: 2,
                  maxLength: 150
                },

                description: {
                  type: "string",
                  nullable: true
                },

                isActive: {
                  type: "boolean"
                }
              }
            }
          }
        }
      },

      responses: {
        "200": {
          description: "Goal updated"
        },
        "404": {
          description: "Goal not found"
        }
      }
    },

    delete: {
      tags: ["Goals"],
      summary: "Delete a goal",

      security: [
        {
          bearerAuth: []
        }
      ],

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
          description: "Goal deleted"
        },
        "404": {
          description: "Goal not found"
        }
      }
    }
  }
};