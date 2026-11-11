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

describe("Completions API", () => {
  let accessToken: string;
  let habitId: string;

  async function createTestUser() {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Completion Test User",
        email: `completion-${Date.now()}-${Math.random()}@example.com`,
        password: "Password123!"
      });

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createTestHabit(token: string) {
    const response = await request(app)
      .post("/api/v1/habits")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        name: "Walk 8000 steps",
        description: "Daily walking",
        targetValue: 8000,
        targetUnit: "steps",
        frequency: "DAILY",
        startDate: "2026-08-20T00:00:00.000Z",
        endDate: "2026-09-20T23:59:59.999Z"
      });

    expect(response.status).toBe(201);

    return response.body.data.habit;
  }

  beforeEach(async () => {
    await cleanDatabase();

    const auth = await createTestUser();

    accessToken = auth.accessToken;

    const habit = await createTestHabit(
      accessToken
    );

    habitId = habit.id;
  });

  describe("POST /api/v1/habits/:id/completions", () => {
    it("creates a completion", async () => {
      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          completedAt:
            "2026-08-28T10:00:00.000Z"
        });

      expect(response.status).toBe(201);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.data.completion
      ).toMatchObject({
        habitId,
        completedAt:
          "2026-08-28T10:00:00.000Z"
      });

      const completion =
        await prisma.habitCompletion.findFirst({
          where: {
            habitId
          }
        });

      expect(completion).not.toBeNull();
    });

    it("creates a completion with value and notes", async () => {
      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          completedAt:
            "2026-08-28T10:00:00.000Z",
          value: 8000,
          notes: "Morning walk"
        });

      expect(response.status).toBe(201);

      expect(
        response.body.data.completion
      ).toMatchObject({
        habitId,
        value: "8000",
        notes: "Morning walk"
      });
    });

    it("rejects unauthenticated requests", async () => {
      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .send({
          completedAt:
            "2026-08-28T10:00:00.000Z"
        });

      expect(response.status).toBe(401);
    });

    it("rejects a missing completedAt", async () => {
      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({});

      expect(response.status).toBe(400);
    });

    it("rejects a negative completion value", async () => {
      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          completedAt:
            "2026-08-28T10:00:00.000Z",
          value: -100
        });

      expect(response.status).toBe(400);
    });

    it("rejects a completion before the habit start date", async () => {
      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          completedAt:
            "2026-08-19T10:00:00.000Z"
        });

      expect(response.status).toBe(400);

      expect(
        response.body.error.code
      ).toBe("INVALID_COMPLETION_DATE");
    });

    it("rejects a completion after the habit end date", async () => {
      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          completedAt:
            "2026-09-21T10:00:00.000Z"
        });

      expect(response.status).toBe(400);

      expect(
        response.body.error.code
      ).toBe("INVALID_COMPLETION_DATE");
    });

    it("rejects completion for an inactive habit", async () => {
      await request(app)
        .patch(
          `/api/v1/habits/${habitId}`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          isActive: false
        })
        .expect(200);

      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        )
        .send({
          completedAt:
            "2026-08-28T10:00:00.000Z"
        });

      expect(response.status).toBe(400);

      expect(
        response.body.error.code
      ).toBe("HABIT_INACTIVE");
    });

    it("rejects access to another user's habit", async () => {
      const secondUser =
        await createTestUser();

      const response = await request(app)
        .post(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${secondUser.accessToken}`
        )
        .send({
          completedAt:
            "2026-08-28T10:00:00.000Z"
        });

      expect(response.status).toBe(404);

      expect(
        response.body.error.code
      ).toBe("HABIT_NOT_FOUND");
    });
  });

  describe("GET /api/v1/habits/:id/completions", () => {
    beforeEach(async () => {
      await prisma.habitCompletion.createMany({
        data: [
          {
            habitId,
            completedAt:
              new Date(
                "2026-08-25T10:00:00.000Z"
              ),
            value: 7000
          },
          {
            habitId,
            completedAt:
              new Date(
                "2026-08-26T10:00:00.000Z"
              ),
            value: 7500
          },
          {
            habitId,
            completedAt:
              new Date(
                "2026-08-27T10:00:00.000Z"
              ),
            value: 8000
          },
          {
            habitId,
            completedAt:
              new Date(
                "2026-08-28T10:00:00.000Z"
              ),
            value: 8500
          }
        ]
      });
    });

    it("lists habit completions", async () => {
      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(response.status).toBe(200);

      expect(
        response.body.success
      ).toBe(true);

      expect(
        response.body.data.completions
      ).toHaveLength(4);

      // Service orders newest first.
      expect(
        response.body.data.completions[0].value
      ).toBe("8500");
    });

    it("filters completions by date range", async () => {
      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/completions`
        )
        .query({
          from:
            "2026-08-26T00:00:00.000Z",
          to:
            "2026-08-27T23:59:59.999Z"
        })
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(response.status).toBe(200);

      expect(
        response.body.data.completions
      ).toHaveLength(2);
    });

    it("rejects an invalid date range", async () => {
      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/completions`
        )
        .query({
          from:
            "2026-08-28T00:00:00.000Z",
          to:
            "2026-08-25T00:00:00.000Z"
        })
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(response.status).toBe(400);
    });

    it("requires authentication", async () => {
      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/completions`
        );

      expect(response.status).toBe(401);
    });

    it("rejects another user's habit", async () => {
      const secondUser =
        await createTestUser();

      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/completions`
        )
        .set(
          "Authorization",
          `Bearer ${secondUser.accessToken}`
        );

      expect(response.status).toBe(404);

      expect(
        response.body.error.code
      ).toBe("HABIT_NOT_FOUND");
    });
  });

  describe("GET /api/v1/habits/:id/stats", () => {
    it("returns zero stats when there are no completions", async () => {
      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/stats`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(response.status).toBe(200);

      expect(
        response.body.data.stats
      ).toMatchObject({
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        completionRate: 0,
        lastCompletedAt: null
      });
    });

    it("calculates streak and completion statistics", async () => {
      const now = new Date();

      const today = new Date(now);
      today.setHours(10, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      await prisma.habitCompletion.createMany({
        data: [
          {
            habitId,
            completedAt: threeDaysAgo
          },
          {
            habitId,
            completedAt: twoDaysAgo
          },
          {
            habitId,
            completedAt: yesterday
          },
          {
            habitId,
            completedAt: today
          }
        ]
      });

      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/stats`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(response.status).toBe(200);

      const stats =
        response.body.data.stats;

      expect(stats.totalCompletions).toBe(4);

      expect(stats.longestStreak).toBe(4);

      expect(stats.currentStreak).toBe(4);

      expect(stats.completionRate).toBe(100);

      expect(
        new Date(stats.lastCompletedAt).getTime()
      ).toBe(today.getTime());
    });

    it("handles multiple completions on the same day", async () => {
      const now = new Date();

      const today = new Date(now);
      today.setHours(10, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.habitCompletion.createMany({
        data: [
          {
            habitId,
            completedAt:
              new Date(
                yesterday.getTime()
              )
          },
          {
            habitId,
            completedAt:
              new Date(
                yesterday.getTime() +
                6 * 60 * 60 * 1000
              )
          },
          {
            habitId,
            completedAt: today
          }
        ]
      });

      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/stats`
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`
        );

      expect(response.status).toBe(200);

      const stats =
        response.body.data.stats;

      expect(stats.totalCompletions).toBe(3);

      // Three completions but only two unique calendar days.
      expect(stats.completionRate).toBe(100);

      expect(stats.currentStreak).toBe(2);

      expect(stats.longestStreak).toBe(2);
    });

    it("requires authentication", async () => {
      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/stats`
        );

      expect(response.status).toBe(401);
    });

    it("rejects another user's habit", async () => {
      const secondUser =
        await createTestUser();

      const response = await request(app)
        .get(
          `/api/v1/habits/${habitId}/stats`
        )
        .set(
          "Authorization",
          `Bearer ${secondUser.accessToken}`
        );

      expect(response.status).toBe(404);

      expect(
        response.body.error.code
      ).toBe("HABIT_NOT_FOUND");
    });
  });
});