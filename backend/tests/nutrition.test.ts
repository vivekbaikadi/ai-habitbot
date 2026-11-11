import {
  describe,
  expect,
  it,
  beforeEach
} from "vitest";

import request from "supertest";

import app from "../src/app.js";

import { prisma } from "../src/database/prisma.js";

import { cleanDatabase } from "./helpers/db.js";

import {
  hashPassword
} from "../src/common/utils/password.js";

import {
  signAccessToken
} from "../src/common/utils/jwt.js";

describe("Nutrition API", () => {
  let userId: string;
  let accessToken: string;
  let foodId: string;

  beforeEach(async () => {
    await cleanDatabase();

    /*
     * Create test user.
     */
    const passwordHash =
      await hashPassword(
        "TestPassword123!"
      );

    const user =
      await prisma.user.create({
        data: {
          name: "Nutrition Test User",
          email:
            "nutrition-test@habitbot.dev",
          passwordHash
        }
      });

    userId = user.id;

    /*
     * Create user profile with a
     * deterministic timezone.
     */
    await prisma.userProfile.create({
      data: {
        userId,
        timezone: "Asia/Kolkata"
      }
    });

    accessToken =
      signAccessToken(userId);

    /*
     * Find a seeded food that has
     * portions and nutrition data.
     */
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
          portions: true
        }
      });

    if (!food) {
      throw new Error(
        "No seeded food with portions and nutrition data found"
      );
    }

    foodId = food.id;

    const portion = food.portions[0];

    if (!portion) {
      throw new Error(
        "Seeded food has no portion"
      );
    }

  });

  describe(
    "GET /api/v1/nutrition/today",
    () => {
      it(
        "requires authentication",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              );

          expect(
            response.status
          ).toBe(401);

          expect(
            response.body.success
          ).toBe(false);
        }
      );

      it(
        "returns today's nutrition",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.success
          ).toBe(true);

          expect(
            response.body.data
          ).toHaveProperty("date");

          expect(
            response.body.data
          ).toHaveProperty("totals");

          expect(
            response.body.data
          ).toHaveProperty("meals");
        }
      );

      it(
        "returns zero totals when no food has been logged today",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.totals
          ).toEqual({
            calories: 0,
            protein: 0,
            carbohydrate: 0,
            fat: 0,
            fiber: 0
          });

          expect(
            response.body.data.meals
          ).toEqual([]);
        }
      );

      it(
        "includes a food log created today",
        async () => {
          const now =
            new Date();

          await prisma.foodLog.create({
            data: {
              userId,
              eatenAt: now,
              mealType: "BREAKFAST",

              items: {
                create: {
                  foodId,

                  quantity: 1,

                  unit: "100g",

                  grams: 100,

                  calories: 250,

                  protein: 20,

                  carbohydrate: 10,

                  fat: 15,

                  fiber: 5
                }
              }
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.meals
          ).toHaveLength(1);

          expect(
            response.body.data.meals[0].mealType
          ).toBe("BREAKFAST");
        }
      );

      it(
        "calculates today's nutrition totals",
        async () => {
          await prisma.foodLog.create({
            data: {
              userId,

              eatenAt: new Date(),

              mealType: "LUNCH",

              items: {
                create: [
                  {
                    foodId,

                    quantity: 1,

                    unit: "100g",

                    grams: 100,

                    calories: 300,

                    protein: 25,

                    carbohydrate: 30,

                    fat: 10,

                    fiber: 6
                  },
                  {
                    foodId,

                    quantity: 1,

                    unit: "100g",

                    grams: 100,

                    calories: 200,

                    protein: 15,

                    carbohydrate: 20,

                    fat: 8,

                    fiber: 4
                  }
                ]
              }
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.totals
          ).toEqual({
            calories: 500,
            protein: 40,
            carbohydrate: 50,
            fat: 18,
            fiber: 10
          });
        }
      );

      it(
        "aggregates nutrition across multiple meals",
        async () => {
          await prisma.foodLog.create({
            data: {
              userId,

              eatenAt: new Date(),

              mealType: "BREAKFAST",

              items: {
                create: {
                  foodId,

                  quantity: 1,

                  unit: "100g",

                  grams: 100,

                  calories: 300,

                  protein: 20,

                  carbohydrate: 30,

                  fat: 10,

                  fiber: 5
                }
              }
            }
          });

          await prisma.foodLog.create({
            data: {
              userId,

              eatenAt: new Date(),

              mealType: "DINNER",

              items: {
                create: {
                  foodId,

                  quantity: 1,

                  unit: "100g",

                  grams: 100,

                  calories: 500,

                  protein: 30,

                  carbohydrate: 40,

                  fat: 20,

                  fiber: 8
                }
              }
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.meals
          ).toHaveLength(2);

          expect(
            response.body.data.totals
          ).toEqual({
            calories: 800,
            protein: 50,
            carbohydrate: 70,
            fat: 30,
            fiber: 13
          });
        }
      );

      it(
        "does not include food logs from another user",
        async () => {
          const otherUser =
            await prisma.user.create({
              data: {
                name: "Other Nutrition User",

                email:
                  "other-nutrition@habitbot.dev",

                passwordHash:
                  await hashPassword(
                    "TestPassword123!"
                  )
              }
            });

          await prisma.userProfile.create({
            data: {
              userId:
                otherUser.id,

              timezone:
                "Asia/Kolkata"
            }
          });

          await prisma.foodLog.create({
            data: {
              userId:
                otherUser.id,

              eatenAt: new Date(),

              mealType: "LUNCH",

              items: {
                create: {
                  foodId,

                  quantity: 1,

                  unit: "100g",

                  grams: 100,

                  calories: 999,

                  protein: 999,

                  carbohydrate: 999,

                  fat: 999,

                  fiber: 999
                }
              }
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.totals
          ).toEqual({
            calories: 0,
            protein: 0,
            carbohydrate: 0,
            fat: 0,
            fiber: 0
          });

          expect(
            response.body.data.meals
          ).toEqual([]);
        }
      );

      it(
        "does not include a food log from the previous day",
        async () => {
          const yesterday =
            new Date();

          yesterday.setDate(
            yesterday.getDate() - 1
          );

          await prisma.foodLog.create({
            data: {
              userId,

              eatenAt: yesterday,

              mealType: "DINNER",

              items: {
                create: {
                  foodId,

                  quantity: 1,

                  unit: "100g",

                  grams: 100,

                  calories: 500,

                  protein: 50,

                  carbohydrate: 50,

                  fat: 50,

                  fiber: 50
                }
              }
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.totals
          ).toEqual({
            calories: 0,
            protein: 0,
            carbohydrate: 0,
            fat: 0,
            fiber: 0
          });

          expect(
            response.body.data.meals
          ).toEqual([]);
        }
      );

      it(
        "returns meal-level nutrition totals",
        async () => {
          await prisma.foodLog.create({
            data: {
              userId,

              eatenAt: new Date(),

              mealType: "BREAKFAST",

              items: {
                create: [
                  {
                    foodId,

                    quantity: 1,

                    unit: "100g",

                    grams: 100,

                    calories: 200,

                    protein: 15,

                    carbohydrate: 20,

                    fat: 5,

                    fiber: 3
                  },
                  {
                    foodId,

                    quantity: 1,

                    unit: "100g",

                    grams: 100,

                    calories: 150,

                    protein: 10,

                    carbohydrate: 15,

                    fat: 4,

                    fiber: 2
                  }
                ]
              }
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/nutrition/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          const meal =
            response.body.data.meals[0];

          expect(
            meal.totals
          ).toEqual({
            calories: 350,
            protein: 25,
            carbohydrate: 35,
            fat: 9,
            fiber: 5
          });
        }
      );
    }
  );
});