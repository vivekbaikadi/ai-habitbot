import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";

import request from "supertest";

import app from "../src/app.js";

import { prisma } from "../src/database/prisma.js";

import {
  cleanDatabase
} from "./helpers/db.js";

type AuthResult = {
  accessToken: string;
  userId: string;
};

async function createAuthenticatedUser(
  suffix: string
): Promise<AuthResult> {
  const email =
    `food-log-${suffix}-${Date.now()}@example.com`;

  const response =
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Food Log Test User",
        email,
        password: "Password123!"
      })
      .expect(201);

  return {
    accessToken:
      response.body.data.accessToken,

    userId:
      response.body.data.user.id
  };
}

async function getTestFood() {
  const food =
    await prisma.food.findFirst({
      where: {
        portions: {
          some: {}
        },

        nutritionProfiles: {
          some: {}
        }
      },

      include: {
        portions: true,

        nutritionProfiles: {
          include: {
            nutrients: {
              include: {
                nutrient: true
              }
            }
          }
        }
      }
    });

  if (!food) {
    throw new Error(
      "No food with portions and nutrition data found in test database"
    );
  }

  const portion = food.portions[0];

  if (!portion) {
    throw new Error(
      "Test food does not have a portion"
    );
  }

  return {
    food,
    portion
  };
}

async function getSecondTestFood(
  firstFoodId: string
) {
  const food =
    await prisma.food.findFirst({
      where: {
        id: {
          not: firstFoodId
        },

        portions: {
          some: {}
        },

        nutritionProfiles: {
          some: {}
        }
      },

      include: {
        portions: true,

        nutritionProfiles: {
          include: {
            nutrients: {
              include: {
                nutrient: true
              }
            }
          }
        }
      }
    });

  if (!food) {
    throw new Error(
      "A second food with portions and nutrition data is required"
    );
  }

  const portion = food.portions[0];

  if (!portion) {
    throw new Error(
      "Second test food does not have a portion"
    );
  }

  return {
    food,
    portion
  };
}

describe("Food Logs API", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/v1/food-logs", () => {
    it("requires authentication", async () => {
      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .send({
            eatenAt: new Date().toISOString(),
            mealType: "BREAKFAST",
            items: []
          });

      expect(response.status).toBe(401);

      expect(response.body.success)
        .toBe(false);
    });

    it("creates a food log with one food item", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "single"
      );

      const {
        food,
        portion
      } = await getTestFood();

      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "BREAKFAST",

            rawInput:
              `I ate 1 ${portion.name} of ${food.name}`,

            items: [
              {
                foodId: food.id,
                quantity: 1,
                unit: portion.name
              }
            ]
          })
          .expect(201);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.data.foodLog
      ).toBeDefined();

      expect(
        response.body.data.foodLog.items
      ).toHaveLength(1);

      expect(
        response.body.data.foodLog.items[0].food.id
      ).toBe(food.id);

      expect(
        response.body.data.foodLog.items[0].quantity
      ).toBe(1);

      expect(
        response.body.data.foodLog.items[0].unit
      ).toBe(portion.name);

      expect(
        Number(
          response.body.data.foodLog.items[0].grams
        )
      ).toBeGreaterThan(0);
    });

    it("creates a food log with multiple food items", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "multiple"
      );

      const first =
        await getTestFood();

      const second =
        await getSecondTestFood(
          first.food.id
        );

      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "LUNCH",

            items: [
              {
                foodId: first.food.id,
                quantity: 2,
                unit: first.portion.name
              },

              {
                foodId: second.food.id,
                quantity: 1,
                unit: second.portion.name
              }
            ]
          })
          .expect(201);

      expect(
        response.body.data.foodLog.items
      ).toHaveLength(2);
    });

    it("stores notes and raw input", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "metadata"
      );

      const {
        food,
        portion
      } = await getTestFood();

      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "DINNER",

            rawInput:
              "I had dinner",

            notes:
              "Home cooked meal",

            items: [
              {
                foodId: food.id,
                quantity: 1,
                unit: portion.name
              }
            ]
          })
          .expect(201);

      expect(
        response.body.data.foodLog.rawInput
      ).toBe("I had dinner");

      expect(
        response.body.data.foodLog.notes
      ).toBe("Home cooked meal");
    });

    it("rejects an unknown food", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "unknown-food"
      );

      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "BREAKFAST",

            items: [
              {
                foodId:
                  "00000000-0000-0000-0000-000000000000",

                quantity: 1,

                unit: "piece"
              }
            ]
          });

      expect(
        response.status
      ).toBe(404);

      expect(
        response.body.error.code
      ).toBe("FOOD_NOT_FOUND");
    });

    it("rejects an invalid food portion", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "invalid-portion"
      );

      const {
        food
      } = await getTestFood();

      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "BREAKFAST",

            items: [
              {
                foodId: food.id,

                quantity: 1,

                unit:
                  "THIS_PORTION_DOES_NOT_EXIST"
              }
            ]
          });

      expect(
        response.status
      ).toBe(400);

      expect(
        response.body.error.code
      ).toBe(
        "INVALID_FOOD_PORTION"
      );
    });

    it("rejects a zero quantity", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "zero-quantity"
      );

      const {
        food,
        portion
      } = await getTestFood();

      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "BREAKFAST",

            items: [
              {
                foodId: food.id,
                quantity: 0,
                unit: portion.name
              }
            ]
          });

      expect(
        response.status
      ).toBe(400);
    });

    it("rejects an empty items array", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "empty-items"
      );

      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "BREAKFAST",

            items: []
          });

      expect(
        response.status
      ).toBe(400);
    });

    it("calculates nutrition for the logged food", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "nutrition"
      );

      const {
        food,
        portion
      } = await getTestFood();

      const response =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "BREAKFAST",

            items: [
              {
                foodId: food.id,

                quantity: 2,

                unit: portion.name
              }
            ]
          })
          .expect(201);

      const item =
        response.body.data.foodLog.items[0];

      expect(
        Number(item.grams)
      ).toBeGreaterThan(0);

      expect(
        Number(item.calories)
      ).toBeGreaterThanOrEqual(0);

      expect(
        Number(item.protein)
      ).toBeGreaterThanOrEqual(0);

      expect(
        Number(item.carbohydrate)
      ).toBeGreaterThanOrEqual(0);

      expect(
        Number(item.fat)
      ).toBeGreaterThanOrEqual(0);

      expect(
        Number(item.fiber)
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /api/v1/food-logs", () => {
    it("requires authentication", async () => {
      const response =
        await request(app)
          .get("/api/v1/food-logs");

      expect(
        response.status
      ).toBe(401);
    });

    it("lists the user's food logs", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "list"
      );

      const {
        food,
        portion
      } = await getTestFood();

      await request(app)
        .post("/api/v1/food-logs")
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          eatenAt:
            new Date().toISOString(),

          mealType:
            "BREAKFAST",

          items: [
            {
              foodId: food.id,
              quantity: 1,
              unit: portion.name
            }
          ]
        })
        .expect(201);

      const response =
        await request(app)
          .get("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .expect(200);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.data.logs
      ).toHaveLength(1);

      expect(
        response.body.data.pagination
      ).toBeDefined();
    });

    it("filters logs by meal type", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "meal-filter"
      );

      const {
        food,
        portion
      } = await getTestFood();

      const headers = {
        Authorization:
          `Bearer ${accessToken}`
      };

      const item = {
        foodId: food.id,
        quantity: 1,
        unit: portion.name
      };

      await request(app)
        .post("/api/v1/food-logs")
        .set(headers)
        .send({
          eatenAt:
            new Date().toISOString(),

          mealType:
            "BREAKFAST",

          items: [item]
        })
        .expect(201);

      await request(app)
        .post("/api/v1/food-logs")
        .set(headers)
        .send({
          eatenAt:
            new Date().toISOString(),

          mealType:
            "DINNER",

          items: [item]
        })
        .expect(201);

      const response =
        await request(app)
          .get(
            "/api/v1/food-logs?mealType=BREAKFAST"
          )
          .set(headers)
          .expect(200);

      expect(
        response.body.data.logs
      ).toHaveLength(1);

      expect(
        response.body.data.logs[0].mealType
      ).toBe("BREAKFAST");
    });

    it("supports pagination", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "pagination"
      );

      const {
        food,
        portion
      } = await getTestFood();

      const headers = {
        Authorization:
          `Bearer ${accessToken}`
      };

      const item = {
        foodId: food.id,
        quantity: 1,
        unit: portion.name
      };

      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/v1/food-logs")
          .set(headers)
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "BREAKFAST",

            items: [item]
          })
          .expect(201);
      }

      const response =
        await request(app)
          .get(
            "/api/v1/food-logs?page=1&limit=2"
          )
          .set(headers)
          .expect(200);

      expect(
        response.body.data.logs
      ).toHaveLength(2);

      expect(
        response.body.data.pagination.page
      ).toBe(1);

      expect(
        response.body.data.pagination.limit
      ).toBe(2);

      expect(
        response.body.data.pagination.total
      ).toBe(3);

      expect(
        response.body.data.pagination.totalPages
      ).toBe(2);
    });

    it("rejects an invalid limit", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "invalid-limit"
      );

      const response =
        await request(app)
          .get(
            "/api/v1/food-logs?limit=101"
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(
        response.status
      ).toBe(400);
    });
  });

  describe("GET /api/v1/food-logs/:id", () => {
    it("returns a food log by ID", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "get-one"
      );

      const {
        food,
        portion
      } = await getTestFood();

      const createResponse =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "LUNCH",

            items: [
              {
                foodId: food.id,
                quantity: 1,
                unit: portion.name
              }
            ]
          })
          .expect(201);

      const foodLogId =
        createResponse.body.data.foodLog.id;

      const response =
        await request(app)
          .get(
            `/api/v1/food-logs/${foodLogId}`
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .expect(200);

      expect(
        response.body.data.foodLog.id
      ).toBe(foodLogId);

      expect(
        response.body.data.foodLog.items
      ).toHaveLength(1);
    });

    it("returns 404 for an unknown food log", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "unknown-log"
      );

      const response =
        await request(app)
          .get(
            "/api/v1/food-logs/00000000-0000-0000-0000-000000000000"
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(
        response.status
      ).toBe(404);

      expect(
        response.body.error.code
      ).toBe(
        "FOOD_LOG_NOT_FOUND"
      );
    });

    it("rejects an invalid food log ID", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "invalid-id"
      );

      const response =
        await request(app)
          .get(
            "/api/v1/food-logs/not-a-uuid"
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      /*
       * The current controller only checks that
       * the parameter exists. The service then
       * attempts the lookup and returns not found.
       */
      expect(
        response.status
      ).toBe(404);

      expect(
        response.body.error.code
      ).toBe(
        "FOOD_LOG_NOT_FOUND"
      );
    });
  });

  describe("DELETE /api/v1/food-logs/:id", () => {
    it("deletes a food log", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "delete"
      );

      const {
        food,
        portion
      } = await getTestFood();

      const createResponse =
        await request(app)
          .post("/api/v1/food-logs")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .send({
            eatenAt:
              new Date().toISOString(),

            mealType:
              "DINNER",

            items: [
              {
                foodId: food.id,
                quantity: 1,
                unit: portion.name
              }
            ]
          })
          .expect(201);

      const foodLogId =
        createResponse.body.data.foodLog.id;

      const deleteResponse =
        await request(app)
          .delete(
            `/api/v1/food-logs/${foodLogId}`
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          )
          .expect(200);

      expect(
        deleteResponse.body.success
      ).toBe(true);

      const getResponse =
        await request(app)
          .get(
            `/api/v1/food-logs/${foodLogId}`
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(
        getResponse.status
      ).toBe(404);
    });

    it("returns 404 when deleting an unknown food log", async () => {
      const {
        accessToken
      } = await createAuthenticatedUser(
        "delete-unknown"
      );

      const response =
        await request(app)
          .delete(
            "/api/v1/food-logs/00000000-0000-0000-0000-000000000000"
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(
        response.status
      ).toBe(404);

      expect(
        response.body.error.code
      ).toBe(
        "FOOD_LOG_NOT_FOUND"
      );
    });
  });
});