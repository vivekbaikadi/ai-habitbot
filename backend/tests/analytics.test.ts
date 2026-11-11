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

describe("Analytics API", () => {
  let userId: string;
  let accessToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    const passwordHash =
      await hashPassword(
        "TestPassword123!"
      );

    const user =
      await prisma.user.create({
        data: {
          name: "Analytics Test User",
          email:
            "analytics-test@habitbot.dev",
          passwordHash
        }
      });

    userId = user.id;

    await prisma.userProfile.create({
      data: {
        userId,
        timezone: "Asia/Kolkata"
      }
    });

    accessToken =
      signAccessToken(userId);
  });

  describe(
    "GET /api/v1/analytics",
    () => {
      it(
        "requires authentication",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/analytics"
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
        "returns today's analytics by default",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/analytics"
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
            response.body.data.period
          ).toBe("today");

          expect(
            response.body.data
          ).toHaveProperty(
            "dateRange"
          );

          expect(
            response.body.data
          ).toHaveProperty(
            "habits"
          );

          expect(
            response.body.data
          ).toHaveProperty(
            "nutrition"
          );

          expect(
            response.body.data
          ).toHaveProperty(
            "daily"
          );
        }
      );

      it(
        "supports the week period",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/analytics?period=week"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.period
          ).toBe("week");

          expect(
            response.body.data.daily
          ).toHaveLength(7);

          expect(
            response.body.data.dateRange.start
          ).toBeDefined();

          expect(
            response.body.data.dateRange.end
          ).toBeDefined();

          expect(
            response.body.data.dateRange.timezone
          ).toBe("Asia/Kolkata");
        }
      );

      it(
        "supports the month period",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/analytics?period=month"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.period
          ).toBe("month");

          expect(
            response.body.data.daily.length
          ).toBeGreaterThanOrEqual(28);

          expect(
            response.body.data.daily.length
          ).toBeLessThanOrEqual(31);
        }
      );

      it(
        "rejects an invalid period",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/analytics?period=year"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(400);

          expect(
            response.body.success
          ).toBe(false);
        }
      );

      it(
        "returns empty analytics for a new user",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/analytics"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          const data =
            response.body.data;

          expect(
            data.habits.total
          ).toBe(0);

          expect(
            data.habits.expected
          ).toBe(0);

          expect(
            data.habits.completed
          ).toBe(0);

          expect(
            data.habits.pending
          ).toBe(0);

          expect(
            data.habits.completionRate
          ).toBe(0);

          expect(
            data.habits.byHabit
          ).toEqual([]);

          expect(
            data.nutrition.totals
          ).toEqual({
            calories: 0,
            protein: 0,
            carbohydrate: 0,
            fat: 0,
            fiber: 0
          });

          expect(
            data.nutrition.mealsLogged
          ).toBe(0);
        }
      );

      it(
        "includes active habits in analytics",
        async () => {
          const habit =
            await prisma.habit.create({
              data: {
                userId,
                name: "Drink Water",
                targetValue: 3,
                targetUnit: "liters",
                frequency: "DAILY",
                startDate: new Date(
                  Date.now() -
                    2 * 86400000
                ),
                isActive: true
              }
            });

          const response =
            await request(app)
              .get(
                "/api/v1/analytics"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.habits.total
          ).toBe(1);

          expect(
            response.body.data.habits.byHabit[0].id
          ).toBe(habit.id);

          expect(
            response.body.data.habits.byHabit[0].name
          ).toBe("Drink Water");

          expect(
            response.body.data.habits.byHabit[0].frequency
          ).toBe("DAILY");

          expect(
            response.body.data.habits.byHabit[0].targetValue
          ).toBe(3);

          expect(
            response.body.data.habits.byHabit[0].targetUnit
          ).toBe("liters");
        }
      );

      it(
        "calculates daily habit completion rate",
        async () => {
          const habit =
            await prisma.habit.create({
              data: {
                userId,
                name: "Daily Exercise",
                frequency: "DAILY",
                startDate: new Date(
                  Date.now()
                ),
                isActive: true
              }
            });

          await prisma.habitCompletion.create({
            data: {
              habitId: habit.id,
              completedAt: new Date(),
              value: 30
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/analytics?period=today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          const data =
            response.body.data;

          expect(
            data.habits.total
          ).toBe(1);

          expect(
            data.habits.expected
          ).toBe(1);

          expect(
            data.habits.completed
          ).toBe(1);

          expect(
            data.habits.pending
          ).toBe(0);

          expect(
            data.habits.completionRate
          ).toBe(100);

          const habitAnalytics =
            data.habits.byHabit[0];

          expect(
            habitAnalytics.expectedDays
          ).toBe(1);

          expect(
            habitAnalytics.completedDays
          ).toBe(1);

          expect(
            habitAnalytics.completionRate
          ).toBe(100);

          expect(
            habitAnalytics.totalValue
          ).toBe(30);

          expect(
            habitAnalytics.lastCompletedAt
          ).not.toBeNull();
        }
      );

      it(
        "calculates pending daily habits",
        async () => {
          await prisma.habit.create({
            data: {
              userId,
              name: "Read Book",
              frequency: "DAILY",
              startDate: new Date(),
              isActive: true
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/analytics?period=today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.habits.total
          ).toBe(1);

          expect(
            response.body.data.habits.expected
          ).toBe(1);

          expect(
            response.body.data.habits.completed
          ).toBe(0);

          expect(
            response.body.data.habits.pending
          ).toBe(1);

          expect(
            response.body.data.habits.completionRate
          ).toBe(0);
        }
      );

      it(
        "does not include inactive habits",
        async () => {
          await prisma.habit.create({
            data: {
              userId,
              name: "Inactive Habit",
              frequency: "DAILY",
              startDate: new Date(),
              isActive: false
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/analytics"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.habits.total
          ).toBe(0);

          expect(
            response.body.data.habits.byHabit
          ).toEqual([]);
        }
      );

      it(
        "aggregates multiple completions by unique calendar days",
        async () => {
          const habit =
            await prisma.habit.create({
              data: {
                userId,
                name: "Study",
                frequency: "DAILY",
                startDate: new Date(
                  Date.now() -
                    2 * 86400000
                ),
                isActive: true
              }
            });

          const now =
            new Date();

          const secondCompletion =
            new Date(
              now.getTime() -
                60 * 60 * 1000
            );

          await prisma.habitCompletion.createMany({
            data: [
              {
                habitId: habit.id,
                completedAt: secondCompletion,
                value: 1
              },
              {
                habitId: habit.id,
                completedAt: now,
                value: 2
              }
            ]
          });

          const response =
            await request(app)
              .get(
                "/api/v1/analytics"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          const habitAnalytics =
            response.body.data
              .habits.byHabit[0];

          expect(
            habitAnalytics.completedDays
          ).toBe(1);

          expect(
            habitAnalytics.totalValue
          ).toBe(3);
        }
      );

      it(
        "returns a daily breakdown for today",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/analytics?period=today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.daily
          ).toHaveLength(1);

          const daily =
            response.body.data.daily[0];

          expect(
            daily.date
          ).toBe(
            response.body.data.dateRange.start
          );

          expect(
            daily.habitsCompleted
          ).toBe(0);

          expect(
            daily.habitsExpected
          ).toBe(0);

          expect(
            daily.habitCompletionRate
          ).toBe(0);

          expect(
            daily.nutrition
          ).toEqual({
            calories: 0,
            protein: 0,
            carbohydrate: 0,
            fat: 0,
            fiber: 0
          });
        }
      );

      it(
        "keeps analytics isolated between users",
        async () => {
          const otherUser =
            await prisma.user.create({
              data: {
                name: "Other User",
                email:
                  "other-analytics@habitbot.dev",
                passwordHash:
                  await hashPassword(
                    "TestPassword123!"
                  )
              }
            });

          await prisma.habit.create({
            data: {
              userId: otherUser.id,
              name: "Other Habit",
              frequency: "DAILY",
              startDate: new Date(),
              isActive: true
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/analytics"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.habits.total
          ).toBe(0);

          expect(
            response.body.data.habits.byHabit
          ).toEqual([]);
        }
      );
    }
  );
});