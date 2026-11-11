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

describe("Dashboard API", () => {
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
          name: "Dashboard Test User",
          email:
            "dashboard-test@habitbot.dev",
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
    "GET /api/v1/dashboard/today",
    () => {
      it(
        "requires authentication",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/dashboard/today"
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
        "returns today's dashboard",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/dashboard/today"
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
          ).toHaveProperty("user");

          expect(
            response.body.data
          ).toHaveProperty("goals");

          expect(
            response.body.data
          ).toHaveProperty("habits");
        }
      );

      it(
        "returns the authenticated user's information",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/dashboard/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.body.data.user.id
          ).toBe(userId);

          expect(
            response.body.data.user.name
          ).toBe(
            "Dashboard Test User"
          );

          expect(
            response.body.data.user.timezone
          ).toBe("Asia/Kolkata");
        }
      );

      it(
        "returns empty goals and habits for a new user",
        async () => {
          const response =
            await request(app)
              .get(
                "/api/v1/dashboard/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.body.data.goals
          ).toEqual([]);

          expect(
            response.body.data.habits
          ).toEqual([]);
        }
      );

      it(
        "returns active goals",
        async () => {
          const activeGoal =
            await prisma.userGoal.create({
              data: {
                userId,
                title: "Lose 5 kg",
                description:
                  "Improve health and fitness",
                isActive: true
              }
            });

          await prisma.userGoal.create({
            data: {
              userId,
              title: "Inactive Goal",
              isActive: false
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/dashboard/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.goals
          ).toHaveLength(1);

          expect(
            response.body.data.goals[0].id
          ).toBe(activeGoal.id);

          expect(
            response.body.data.goals[0].title
          ).toBe("Lose 5 kg");
        }
      );

      it(
        "returns active habits with today's completion status",
        async () => {
          const habit =
            await prisma.habit.create({
              data: {
                userId,
                name: "Drink Water",
                description:
                  "Drink enough water",
                targetValue: 3,
                targetUnit: "liters",
                frequency: "DAILY",
                startDate: new Date(
                  Date.now() - 86400000
                ),
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
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.habits
          ).toHaveLength(1);

          const dashboardHabit =
            response.body.data.habits[0];

          expect(
            dashboardHabit.id
          ).toBe(habit.id);

          expect(
            dashboardHabit.name
          ).toBe("Drink Water");

          expect(
            dashboardHabit.targetValue
          ).toBe("3");

          expect(
            dashboardHabit.targetUnit
          ).toBe("liters");

          expect(
            dashboardHabit.today.completed
          ).toBe(false);

          expect(
            dashboardHabit.today.completionCount
          ).toBe(0);

          expect(
            dashboardHabit.today.value
          ).toBeNull();

          expect(
            dashboardHabit.today.lastCompletedAt
          ).toBeNull();
        }
      );

      it(
        "marks a habit as completed when it has a completion today",
        async () => {
          const habit =
            await prisma.habit.create({
              data: {
                userId,
                name: "Walk 8000 Steps",
                targetValue: 8000,
                targetUnit: "steps",
                frequency: "DAILY",
                startDate: new Date(
                  Date.now() - 86400000
                ),
                isActive: true
              }
            });

          await prisma.habitCompletion.create({
            data: {
              habitId: habit.id,
              completedAt: new Date(),
              value: 8000,
              notes: "Morning walk"
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/dashboard/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          const dashboardHabit =
            response.body.data.habits[0];

          expect(
            dashboardHabit.today.completed
          ).toBe(true);

          expect(
            dashboardHabit.today.completionCount
          ).toBe(1);

          expect(
            dashboardHabit.today.value
          ).toBe(8000);

          expect(
            dashboardHabit.today.lastCompletedAt
          ).not.toBeNull();
        }
      );

      it(
        "aggregates multiple completions for the same habit",
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
                  Date.now() - 86400000
                ),
                isActive: true
              }
            });

          const now =
            new Date();

          const earlier =
            new Date(
              now.getTime() - 3600000
            );

          await prisma.habitCompletion.createMany({
            data: [
              {
                habitId: habit.id,
                completedAt: earlier,
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
                "/api/v1/dashboard/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          const dashboardHabit =
            response.body.data.habits[0];

          expect(
            dashboardHabit.today.completed
          ).toBe(true);

          expect(
            dashboardHabit.today.completionCount
          ).toBe(2);

          expect(
            dashboardHabit.today.value
          ).toBe(3);

          expect(
            dashboardHabit.today.lastCompletedAt
          ).not.toBeNull();
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
              startDate: new Date(
                Date.now() - 86400000
              ),
              isActive: false
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/dashboard/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.body.data.habits
          ).toEqual([]);
        }
      );

      it(
        "does not include another user's goals or habits",
        async () => {
          const otherUser =
            await prisma.user.create({
              data: {
                name: "Other User",
                email:
                  "other-dashboard@habitbot.dev",
                passwordHash:
                  await hashPassword(
                    "TestPassword123!"
                  )
              }
            });

          await prisma.userGoal.create({
            data: {
              userId: otherUser.id,
              title: "Other User Goal",
              isActive: true
            }
          });

          await prisma.habit.create({
            data: {
              userId: otherUser.id,
              name: "Other User Habit",
              frequency: "DAILY",
              startDate: new Date(
                Date.now() - 86400000
              ),
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
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          expect(
            response.body.data.goals
          ).toEqual([]);

          expect(
            response.body.data.habits
          ).toEqual([]);
        }
      );

      it(
        "does not count yesterday's completion as today's completion",
        async () => {
          const habit =
            await prisma.habit.create({
              data: {
                userId,
                name: "Yesterday Habit",
                frequency: "DAILY",
                startDate: new Date(
                  Date.now() - 172800000
                ),
                isActive: true
              }
            });

          const yesterday =
            new Date();

          yesterday.setDate(
            yesterday.getDate() - 1
          );

          await prisma.habitCompletion.create({
            data: {
              habitId: habit.id,
              completedAt: yesterday,
              value: 5
            }
          });

          const response =
            await request(app)
              .get(
                "/api/v1/dashboard/today"
              )
              .set(
                "Authorization",
                `Bearer ${accessToken}`
              );

          expect(
            response.status
          ).toBe(200);

          const dashboardHabit =
            response.body.data.habits[0];

          expect(
            dashboardHabit.today.completed
          ).toBe(false);

          expect(
            dashboardHabit.today.completionCount
          ).toBe(0);

          expect(
            dashboardHabit.today.value
          ).toBeNull();
        }
      );
    }
  );
});