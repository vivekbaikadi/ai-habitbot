export const foodPaths = {
  "/api/v1/foods": {
    get: {
      tags: ["Foods"],
      summary: "Search and list foods",
      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "search",
          in: "query",
          required: false,
          description: "Search by food name or alias",
          schema: {
            type: "string",
            maxLength: 100
          },
          example: "paneer"
        },
        {
          name: "foodType",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["BASIC", "PREPARED_DISH"]
          }
        },
        {
          name: "dietType",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "VEGETARIAN",
              "NON_VEGETARIAN",
              "EGGETARIAN",
              "VEGAN"
            ]
          }
        },
        {
          name: "categoryId",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "uuid"
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
          description: "Foods retrieved successfully"
        },
        "400": {
          description: "Invalid query parameters"
        },
        "401": {
          description: "Authentication required"
        }
      }
    }
  },

  "/api/v1/foods/{id}": {
    get: {
      tags: ["Foods"],
      summary: "Get a food",
      security: [{ bearerAuth: [] }],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Food ID",
          schema: {
            type: "string",
            format: "uuid"
          }
        }
      ],

      responses: {
        "200": {
          description: "Food retrieved successfully"
        },
        "404": {
          description: "Food not found"
        }
      }
    }
  }
};