import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it
} from "vitest";

import request from "supertest";

import crypto from "node:crypto";

import app from "../src/app.js";
import { prisma } from "../src/database/prisma.js";
import { hashPassword } from "../src/common/utils/password.js";



let accessToken: string;

let foodId: string;
let categoryId: string;

const testUser = {
  name: "Food Test User",
  email: "food-tests@example.com",
  password: "Password123!"
};

async function createTestUser(): Promise<void> {
  await prisma.user.deleteMany({
    where: {
      email: testUser.email
    }
  });

  const passwordHash =
    await hashPassword(testUser.password);

  await prisma.user.create({
    data: {
      name: testUser.name,
      email: testUser.email,
      passwordHash
    }
  });
}

async function loginTestUser(): Promise<void> {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: testUser.email,
      password: testUser.password
    });

  expect(response.status).toBe(200);

  accessToken =
    response.body.data.accessToken;
}

async function createTestFood(): Promise<void> {
  categoryId =
    crypto.randomUUID();

  const category =
    await prisma.foodCategory.create({
      data: {
        id: categoryId,
        name: "Test Fruits",
        slug: `test-fruits-${crypto.randomUUID()}`
      }
    });

  const food =
    await prisma.food.create({
      data: {
        name: "Test Banana",
        slug: `test-banana-${crypto.randomUUID()}`,
        description: "A test banana",
        foodType: "BASIC",
        dietType: "VEGETARIAN",
        categoryId: category.id,

        aliases: {
          create: [
            {
              alias: "test banana fruit"
            },
            {
              alias: "yellow fruit"
            }
          ]
        },

        portions: {
          create: [
            {
              name: "100 g",
              grams: 100
            },
            {
              name: "1 medium banana",
              grams: 118
            }
          ]
        }
      }
    });

  foodId = food.id;
}

describe("Foods API", () => {
  beforeAll(async () => {
    await createTestUser();
    await loginTestUser();
    await createTestFood();
  });

  afterAll(async () => {
    await prisma.foodAlias.deleteMany({
      where: {
        foodId
      }
    });

    await prisma.foodPortion.deleteMany({
      where: {
        foodId
      }
    });

    await prisma.food.delete({
      where: {
        id: foodId
      }
    });

    await prisma.foodCategory.delete({
      where: {
        id: categoryId
      }
    });

    await prisma.user.delete({
      where: {
        email: testUser.email
      }
    });
  });

  describe("GET /api/v1/foods", () => {
    it("requires authentication", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods");

      expect(response.status)
        .toBe(401);

      expect(
        response.body.error.code
      ).toBe(
        "AUTHENTICATION_REQUIRED"
      );
    });

    it("lists foods", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        Array.isArray(
          response.body.data.foods
        )
      ).toBe(true);

      expect(
        response.body.data.pagination
      ).toMatchObject({
        page: 1,
        limit: 20
      });
    });

    it("searches foods by name", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .query({
            search: "Test Banana"
          })
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.foods
      ).toHaveLength(1);

      expect(
        response.body.data.foods[0].name
      ).toBe("Test Banana");
    });

    it("searches foods by alias", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .query({
            search: "yellow fruit"
          })
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.foods
      ).toHaveLength(1);

      expect(
        response.body.data.foods[0].id
      ).toBe(foodId);
    });

    it("filters foods by food type", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .query({
            foodType: "BASIC"
          })
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.foods.length
      ).toBeGreaterThan(0);

      for (
        const food
        of response.body.data.foods
      ) {
        expect(food.foodType)
          .toBe("BASIC");
      }
    });

    it("filters foods by diet type", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .query({
            dietType: "VEGETARIAN"
          })
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.foods.length
      ).toBeGreaterThan(0);

      for (
        const food
        of response.body.data.foods
      ) {
        expect(food.dietType)
          .toBe("VEGETARIAN");
      }
    });

    it("filters foods by category", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .query({
            categoryId
          })
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.foods
      ).toHaveLength(1);

      expect(
        response.body.data.foods[0].id
      ).toBe(foodId);

      expect(
        response.body.data.foods[0].category.id
      ).toBe(categoryId);
    });

    it("supports pagination", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .query({
            page: 1,
            limit: 1
          })
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.pagination.page
      ).toBe(1);

      expect(
        response.body.data.pagination.limit
      ).toBe(1);

      expect(
        response.body.data.foods.length
      ).toBeLessThanOrEqual(1);

      expect(
        response.body.data.pagination.totalPages
      ).toBeGreaterThanOrEqual(1);
    });

    it("rejects an invalid limit", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .query({
            limit: 101
          })
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBeGreaterThanOrEqual(400);
    });

    it("returns an empty result for an unknown food", async () => {
      const response =
        await request(app)
          .get("/api/v1/foods")
          .query({
            search:
              "this-food-definitely-does-not-exist"
          })
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.foods
      ).toHaveLength(0);

      expect(
        response.body.data.pagination.total
      ).toBe(0);

      expect(
        response.body.data.pagination.totalPages
      ).toBe(0);
    });
  });

  describe("GET /api/v1/foods/:id", () => {
    it("returns a food by ID", async () => {
      const response =
        await request(app)
          .get(
            `/api/v1/foods/${foodId}`
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.data.food.id
      ).toBe(foodId);

      expect(
        response.body.data.food.name
      ).toBe("Test Banana");

      expect(
        response.body.data.food.foodType
      ).toBe("BASIC");

      expect(
        response.body.data.food.dietType
      ).toBe("VEGETARIAN");
    });

    it("returns category information", async () => {
      const response =
        await request(app)
          .get(
            `/api/v1/foods/${foodId}`
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.food.category
      ).toBeTruthy();

      expect(
        response.body.data.food.category.id
      ).toBe(categoryId);
    });

    it("returns aliases", async () => {
      const response =
        await request(app)
          .get(
            `/api/v1/foods/${foodId}`
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.food.aliases
      ).toHaveLength(2);

      const aliases =
        response.body.data.food.aliases
          .map(
            (alias: {
              alias: string
            }) => alias.alias
          );

      expect(aliases).toContain(
        "test banana fruit"
      );

      expect(aliases).toContain(
        "yellow fruit"
      );
    });

    it("returns food portions", async () => {
      const response =
        await request(app)
          .get(
            `/api/v1/foods/${foodId}`
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(200);

      expect(
        response.body.data.food.portions
      ).toHaveLength(2);

      const portionNames =
        response.body.data.food.portions
          .map(
            (portion: {
              name: string
            }) => portion.name
          );

      expect(portionNames).toContain(
        "100 g"
      );

      expect(portionNames).toContain(
        "1 medium banana"
      );
    });

    it("returns 404 for an unknown food", async () => {
      const response =
        await request(app)
          .get(
            `/api/v1/foods/${crypto.randomUUID()}`
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(404);

      expect(
        response.body.error.code
      ).toBe("FOOD_NOT_FOUND");
    });

    it("rejects an invalid food ID", async () => {
      const response =
        await request(app)
          .get(
            "/api/v1/foods/not-a-valid-id"
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`
          );

      expect(response.status)
        .toBe(404);
    });
  });
});