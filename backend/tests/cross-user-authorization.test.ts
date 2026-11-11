import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";

import request from "supertest";

import app from "../src/app.js";

import { prisma } from "../src/database/prisma.js";

import { cleanDatabase } from "./helpers/db.js";

import { hashPassword } from "../src/common/utils/password.js";

import { signAccessToken } from "../src/common/utils/jwt.js";

describe("Cross-user authorization", () => {
  let userAId: string;
  let userBId: string;

  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    await cleanDatabase();

    /*
     * ---------------------------------------------
     * Create User A
     * ---------------------------------------------
     */

    const passwordHash =
      await hashPassword(
        "TestPassword123!"
      );

    const userA =
      await prisma.user.create({
        data: {
          name: "User A",
          email: "user-a@habitbot.test",
          passwordHash
        }
      });

    userAId = userA.id;

    tokenA =
      signAccessToken(userAId);

    /*
     * ---------------------------------------------
     * Create User B
     * ---------------------------------------------
     */

    const userB =
      await prisma.user.create({
        data: {
          name: "User B",
          email: "user-b@habitbot.test",
          passwordHash
        }
      });

    userBId = userB.id;

    tokenB =
      signAccessToken(userBId);
  });

  /*
   * ==================================================
   * GOALS
   * ==================================================
   */

  describe("Goals", () => {
    it(
      "does not allow User B to read User A's goal",
      async () => {
        const goal =
          await prisma.userGoal.create({
            data: {
              userId: userAId,
              title: "User A Private Goal",
              description:
                "Private goal belonging to User A",
              isActive: true
            }
          });

        const response =
          await request(app)
            .get(
              `/api/v1/goals/${goal.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          response.body.error.code
        ).toBe(
          "GOAL_NOT_FOUND"
        );
      }
    );

    it(
      "does not allow User B to update User A's goal",
      async () => {
        const goal =
          await prisma.userGoal.create({
            data: {
              userId: userAId,
              title: "User A Private Goal",
              description:
                "Original description",
              isActive: true
            }
          });

        const response =
          await request(app)
            .patch(
              `/api/v1/goals/${goal.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            )
            .send({
              title:
                "Hacked Goal"
            });

        expect(
          response.status
        ).toBe(404);

        const unchanged =
          await prisma.userGoal.findUnique({
            where: {
              id: goal.id
            }
          });

        expect(
          unchanged?.title
        ).toBe(
          "User A Private Goal"
        );
      }
    );

    it(
      "does not allow User B to delete User A's goal",
      async () => {
        const goal =
          await prisma.userGoal.create({
            data: {
              userId: userAId,
              title: "User A Private Goal",
              isActive: true
            }
          });

        const response =
          await request(app)
            .delete(
              `/api/v1/goals/${goal.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        const existing =
          await prisma.userGoal.findUnique({
            where: {
              id: goal.id
            }
          });

        expect(
          existing
        ).not.toBeNull();

        expect(
          existing?.isActive
        ).toBe(true);
      }
    );

    it(
      "does not include User A's goals in User B's goal list",
      async () => {
        await prisma.userGoal.create({
          data: {
            userId: userAId,
            title: "User A Goal",
            isActive: true
          }
        });

        const response =
          await request(app)
            .get(
              "/api/v1/goals"
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data.goals
        ).toHaveLength(0);
      }
    );
  });

  /*
   * ==================================================
   * HABITS
   * ==================================================
   */

  describe("Habits", () => {
    it(
      "does not allow User B to read User A's habit",
      async () => {
        const habit =
          await prisma.habit.create({
            data: {
              userId: userAId,
              name: "User A Private Habit",
              frequency: "DAILY",
              startDate: new Date(),
              isActive: true
            }
          });

        const response =
          await request(app)
            .get(
              `/api/v1/habits/${habit.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.error.code
        ).toBe(
          "HABIT_NOT_FOUND"
        );
      }
    );

    it(
      "does not allow User B to update User A's habit",
      async () => {
        const habit =
          await prisma.habit.create({
            data: {
              userId: userAId,
              name: "User A Habit",
              frequency: "DAILY",
              startDate: new Date(),
              isActive: true
            }
          });

        const response =
          await request(app)
            .patch(
              `/api/v1/habits/${habit.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            )
            .send({
              name:
                "Hacked Habit"
            });

        expect(
          response.status
        ).toBe(404);

        const unchanged =
          await prisma.habit.findUnique({
            where: {
              id: habit.id
            }
          });

        expect(
          unchanged?.name
        ).toBe(
          "User A Habit"
        );
      }
    );

    it(
      "does not allow User B to delete User A's habit",
      async () => {
        const habit =
          await prisma.habit.create({
            data: {
              userId: userAId,
              name: "User A Habit",
              frequency: "DAILY",
              startDate: new Date(),
              isActive: true
            }
          });

        const response =
          await request(app)
            .delete(
              `/api/v1/habits/${habit.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        const existing =
          await prisma.habit.findUnique({
            where: {
              id: habit.id
            }
          });

        expect(
          existing?.isActive
        ).toBe(true);
      }
    );

    it(
      "does not include User A's habits in User B's habit list",
      async () => {
        await prisma.habit.create({
          data: {
            userId: userAId,
            name: "User A Habit",
            frequency: "DAILY",
            startDate: new Date(),
            isActive: true
          }
        });

        const response =
          await request(app)
            .get(
              "/api/v1/habits"
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data.habits
        ).toHaveLength(0);
      }
    );
  });

  /*
   * ==================================================
   * COMPLETIONS
   * ==================================================
   */

  describe("Completions", () => {
    it(
      "does not allow User B to create a completion for User A's habit",
      async () => {
        const habit =
          await prisma.habit.create({
            data: {
              userId: userAId,
              name: "User A Habit",
              frequency: "DAILY",
              startDate: new Date(
                "2026-01-01T00:00:00.000Z"
              ),
              isActive: true
            }
          });

        const response =
          await request(app)
            .post(
              `/api/v1/habits/${habit.id}/completions`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            )
            .send({
              completedAt:
                new Date().toISOString()
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.error.code
        ).toBe(
          "HABIT_NOT_FOUND"
        );

        const completions =
          await prisma.habitCompletion.count({
            where: {
              habitId: habit.id
            }
          });

        expect(
          completions
        ).toBe(0);
      }
    );

    it(
      "does not allow User B to read User A's completions",
      async () => {
        const habit =
          await prisma.habit.create({
            data: {
              userId: userAId,
              name: "User A Habit",
              frequency: "DAILY",
              startDate: new Date(
                "2026-01-01T00:00:00.000Z"
              ),
              isActive: true
            }
          });

        await prisma.habitCompletion.create({
          data: {
            habitId: habit.id,
            completedAt:
              new Date()
          }
        });

        const response =
          await request(app)
            .get(
              `/api/v1/habits/${habit.id}/completions`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.error.code
        ).toBe(
          "HABIT_NOT_FOUND"
        );
      }
    );

    it(
      "does not allow User B to read User A's habit statistics",
      async () => {
        const habit =
          await prisma.habit.create({
            data: {
              userId: userAId,
              name: "User A Habit",
              frequency: "DAILY",
              startDate: new Date(
                "2026-01-01T00:00:00.000Z"
              ),
              isActive: true
            }
          });

        const response =
          await request(app)
            .get(
              `/api/v1/habits/${habit.id}/stats`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.error.code
        ).toBe(
          "HABIT_NOT_FOUND"
        );
      }
    );
  });

  /*
   * ==================================================
   * FOOD LOGS
   * ==================================================
   */

  describe("Food logs", () => {
    it(
      "does not allow User B to read User A's food log",
      async () => {
        const food =
          await prisma.food.findFirst();

        expect(
          food
        ).not.toBeNull();

        if (!food) {
          return;
        }

        const portion =
          await prisma.foodPortion.findFirst({
            where: {
              foodId: food.id
            }
          });

        expect(
          portion
        ).not.toBeNull();

        if (!portion) {
          return;
        }

        const foodLog =
          await prisma.foodLog.create({
            data: {
              userId: userAId,
              eatenAt:
                new Date(),
              mealType:
                "BREAKFAST",
              items: {
                create: {
                  foodId:
                    food.id,
                  quantity: 1,
                  unit:
                    portion.name,
                  grams:
                    portion.grams
                }
              }
            }
          });

        const response =
          await request(app)
            .get(
              `/api/v1/food-logs/${foodLog.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.error.code
        ).toBe(
          "FOOD_LOG_NOT_FOUND"
        );
      }
    );

    it(
      "does not allow User B to delete User A's food log",
      async () => {
        const food =
          await prisma.food.findFirst();

        expect(
          food
        ).not.toBeNull();

        if (!food) {
          return;
        }

        const portion =
          await prisma.foodPortion.findFirst({
            where: {
              foodId: food.id
            }
          });

        expect(
          portion
        ).not.toBeNull();

        if (!portion) {
          return;
        }

        const foodLog =
          await prisma.foodLog.create({
            data: {
              userId: userAId,
              eatenAt:
                new Date(),
              mealType:
                "BREAKFAST",
              items: {
                create: {
                  foodId:
                    food.id,
                  quantity: 1,
                  unit:
                    portion.name,
                  grams:
                    portion.grams
                }
              }
            }
          });

        const response =
          await request(app)
            .delete(
              `/api/v1/food-logs/${foodLog.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        const existing =
          await prisma.foodLog.findUnique({
            where: {
              id: foodLog.id
            }
          });

        expect(
          existing
        ).not.toBeNull();
      }
    );

    it(
      "does not include User A's food logs in User B's list",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/v1/food-logs"
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data.logs
        ).toHaveLength(0);
      }
    );
  });

  /*
   * ==================================================
   * DASHBOARD
   * ==================================================
   */

  describe("Dashboard", () => {
    it(
      "does not expose User A's goals or habits to User B",
      async () => {
        await prisma.userGoal.create({
          data: {
            userId: userAId,
            title:
              "User A Secret Goal",
            isActive: true
          }
        });

        await prisma.habit.create({
          data: {
            userId: userAId,
            name:
              "User A Secret Habit",
            frequency: "DAILY",
            startDate:
              new Date(),
            isActive: true
          }
        });

        const response =
          await request(app)
            .get(
              "/api/v1/dashboard/today"
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data.goals
        ).toHaveLength(0);

        expect(
          response.body.data.habits
        ).toHaveLength(0);
      }
    );
  });

  /*
   * ==================================================
   * AI CONTEXT
   * ==================================================
   */

  describe("AI context", () => {
    it(
      "does not expose User A's data in User B's AI context",
      async () => {
        await prisma.userGoal.create({
          data: {
            userId: userAId,
            title:
              "User A Secret Goal",
            description:
              "Very private information",
            isActive: true
          }
        });

        await prisma.habit.create({
          data: {
            userId: userAId,
            name:
              "User A Secret Habit",
            frequency: "DAILY",
            startDate:
              new Date(),
            isActive: true
          }
        });

        const response =
          await request(app)
            .get(
              "/api/v1/ai/context"
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(200);

        const context =
          response.body.data.context;

        expect(
          context.user.id
        ).toBe(userBId);

        expect(
          context.user.id
        ).not.toBe(userAId);

        expect(
          context.goals
        ).toHaveLength(0);

        expect(
          context.habits
        ).toHaveLength(0);
      }
    );
  });

  /*
   * ==================================================
   * AI CONVERSATIONS
   * ==================================================
   */

  describe("AI conversations", () => {
    it(
      "does not allow User B to read User A's conversation",
      async () => {
        const conversation =
          await prisma.aIConversation.create({
            data: {
              userId: userAId
            }
          });

        await prisma.aIMessage.create({
          data: {
            conversationId:
              conversation.id,
            role: "USER",
            content:
              "User A's private AI conversation"
          }
        });

        const response =
          await request(app)
            .get(
              `/api/v1/ai/conversations/${conversation.id}`
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.error.code
        ).toBe(
          "CONVERSATION_NOT_FOUND"
        );
      }
    );

    it(
      "does not include User A's conversations in User B's list",
      async () => {
        await prisma.aIConversation.create({
          data: {
            userId: userAId
          }
        });

        const response =
          await request(app)
            .get(
              "/api/v1/ai/conversations"
            )
            .set(
              "Authorization",
              `Bearer ${tokenB}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data.conversations
        ).toHaveLength(0);
      }
    );
  });
});