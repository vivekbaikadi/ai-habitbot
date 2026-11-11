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

describe("Habits API", () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
        await cleanDatabase();

        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({
                name: "Habit Test User",
                email: "habit@test.com",
                password: "password123"
            });

        expect(response.status).toBe(201);

        accessToken =
            response.body.data.accessToken;

        userId =
            response.body.data.user.id;
    });

    describe("POST /api/v1/habits", () => {
        it("creates a habit", async () => {
            const response = await request(app)
                .post("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "Walk 8000 steps",
                    description: "Daily walking goal",
                    targetValue: 8000,
                    targetUnit: "steps",
                    frequency: "DAILY",
                    startDate: "2026-08-28"
                });

            expect(response.status).toBe(201);

            expect(
                response.body.success
            ).toBe(true);

            expect(
                response.body.data.habit.name
            ).toBe("Walk 8000 steps");

            expect(
                Number(response.body.data.habit.targetValue)
            ).toBe(8000);

            expect(
                response.body.data.habit.targetUnit
            ).toBe("steps");

            expect(
                response.body.data.habit.userId
            ).toBe(userId);
        });

        it("rejects unauthenticated requests", async () => {
            const response = await request(app)
                .post("/api/v1/habits")
                .send({
                    name: "Walk 8000 steps",
                    targetValue: 8000,
                    targetUnit: "steps",
                    startDate: "2026-08-28"
                });

            expect(response.status).toBe(401);
        });

        it("rejects an invalid habit", async () => {
            const response = await request(app)
                .post("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "A",
                    targetValue: -100,
                    startDate: "2026-08-28"
                });

            expect(response.status).toBe(400);

            expect(
                response.body.success
            ).toBe(false);
        });

        it("creates a habit linked to the user's goal", async () => {
            const goalResponse = await request(app)
                .post("/api/v1/goals")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    title: "Lose 5 kg"
                });

            expect(goalResponse.status).toBe(201);

            const goalId =
                goalResponse.body.data.goal.id;

            const response = await request(app)
                .post("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "Walk 8000 steps",
                    goalId,
                    targetValue: 8000,
                    targetUnit: "steps",
                    frequency: "DAILY",
                    startDate: "2026-08-28"
                });

            expect(response.status).toBe(201);

            expect(
                response.body.data.habit.goalId
            ).toBe(goalId);
        });

        it("rejects a habit linked to another user's goal", async () => {
            const otherUserResponse = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "Other User",
                    email: "other-habit@test.com",
                    password: "password123"
                });

            expect(
                otherUserResponse.status
            ).toBe(201);

            const otherToken =
                otherUserResponse.body.data.accessToken;

            const goalResponse = await request(app)
                .post("/api/v1/goals")
                .set(
                    "Authorization",
                    `Bearer ${otherToken}`
                )
                .send({
                    title: "Other user's goal"
                });

            expect(goalResponse.status).toBe(201);

            const otherGoalId =
                goalResponse.body.data.goal.id;

            const response = await request(app)
                .post("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "Walk 8000 steps",
                    goalId: otherGoalId,
                    targetValue: 8000,
                    targetUnit: "steps",
                    frequency: "DAILY",
                    startDate: "2026-08-28"
                });

            expect(response.status).toBe(404);

            expect(
                response.body.success
            ).toBe(false);

            expect(
                response.body.error.code
            ).toBe("GOAL_NOT_FOUND");
        });
    });

    describe("GET /api/v1/habits", () => {
        it("lists only the authenticated user's habits", async () => {
            await request(app)
                .post("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "My habit",
                    startDate: "2026-08-28"
                });

            const otherUserResponse = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "Other User",
                    email: "other-list@test.com",
                    password: "password123"
                });

            expect(
                otherUserResponse.status
            ).toBe(201);

            const otherToken =
                otherUserResponse.body.data.accessToken;

            await request(app)
                .post("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${otherToken}`
                )
                .send({
                    name: "Other habit",
                    startDate: "2026-08-28"
                });

            const response = await request(app)
                .get("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                );

            expect(response.status).toBe(200);

            expect(
                response.body.success
            ).toBe(true);

            expect(
                response.body.data.habits
            ).toHaveLength(1);

            expect(
                response.body.data.habits[0].name
            ).toBe("My habit");
        });

        it("requires authentication", async () => {
            const response = await request(app)
                .get("/api/v1/habits");

            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/v1/habits/:id", () => {
        it("returns the user's habit", async () => {
            const createResponse =
                await request(app)
                    .post("/api/v1/habits")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`
                    )
                    .send({
                        name: "Read 20 minutes",
                        startDate: "2026-08-28"
                    });

            expect(
                createResponse.status
            ).toBe(201);

            const habitId =
                createResponse.body.data.habit.id;

            const response = await request(app)
                .get(`/api/v1/habits/${habitId}`)
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                );

            expect(response.status).toBe(200);

            expect(
                response.body.success
            ).toBe(true);

            expect(
                response.body.data.habit.id
            ).toBe(habitId);

            expect(
                response.body.data.habit.name
            ).toBe("Read 20 minutes");
        });

        it("rejects access to another user's habit", async () => {
            const otherUserResponse = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "Other User",
                    email: "other-get@test.com",
                    password: "password123"
                });

            expect(
                otherUserResponse.status
            ).toBe(201);

            const otherToken =
                otherUserResponse.body.data.accessToken;

            const createResponse =
                await request(app)
                    .post("/api/v1/habits")
                    .set(
                        "Authorization",
                        `Bearer ${otherToken}`
                    )
                    .send({
                        name: "Private habit",
                        startDate: "2026-08-28"
                    });

            expect(
                createResponse.status
            ).toBe(201);

            const habitId =
                createResponse.body.data.habit.id;

            const response = await request(app)
                .get(`/api/v1/habits/${habitId}`)
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                );

            expect(response.status).toBe(404);

            expect(
                response.body.error.code
            ).toBe("HABIT_NOT_FOUND");
        });
    });

    describe("PATCH /api/v1/habits/:id", () => {
        it("updates the user's habit", async () => {
            const createResponse =
                await request(app)
                    .post("/api/v1/habits")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`
                    )
                    .send({
                        name: "Walk 5000 steps",
                        startDate: "2026-08-28"
                    });

            expect(
                createResponse.status
            ).toBe(201);

            const habitId =
                createResponse.body.data.habit.id;

            const response = await request(app)
                .patch(`/api/v1/habits/${habitId}`)
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "Walk 8000 steps",
                    targetValue: 8000,
                    targetUnit: "steps"
                });

            expect(response.status).toBe(200);

            expect(
                response.body.success
            ).toBe(true);

            expect(
                response.body.data.habit.name
            ).toBe("Walk 8000 steps");

            expect(
                Number(response.body.data.habit.targetValue)
            ).toBe(8000);

            expect(
                response.body.data.habit.targetUnit
            ).toBe("steps");
        });

        it("rejects updating another user's habit", async () => {
            const otherUserResponse = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "Other User",
                    email: "other-update@test.com",
                    password: "password123"
                });

            expect(
                otherUserResponse.status
            ).toBe(201);

            const otherToken =
                otherUserResponse.body.data.accessToken;

            const createResponse =
                await request(app)
                    .post("/api/v1/habits")
                    .set(
                        "Authorization",
                        `Bearer ${otherToken}`
                    )
                    .send({
                        name: "Private habit",
                        startDate: "2026-08-28"
                    });

            expect(
                createResponse.status
            ).toBe(201);

            const habitId =
                createResponse.body.data.habit.id;

            const response = await request(app)
                .patch(`/api/v1/habits/${habitId}`)
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "Hacked habit"
                });

            expect(response.status).toBe(404);

            expect(
                response.body.error.code
            ).toBe("HABIT_NOT_FOUND");
        });
    });

    describe("DELETE /api/v1/habits/:id", () => {
        it("deactivates the user's habit", async () => {
            const createResponse =
                await request(app)
                    .post("/api/v1/habits")
                    .set(
                        "Authorization",
                        `Bearer ${accessToken}`
                    )
                    .send({
                        name: "Temporary habit",
                        startDate: "2026-08-28"
                    });

            expect(
                createResponse.status
            ).toBe(201);

            const habitId =
                createResponse.body.data.habit.id;

            const response = await request(app)
                .delete(`/api/v1/habits/${habitId}`)
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                );

            expect(response.status).toBe(200);

            expect(
                response.body.success
            ).toBe(true);

            const databaseHabit =
                await prisma.habit.findUnique({
                    where: {
                        id: habitId
                    }
                });

            expect(databaseHabit).not.toBeNull();

            expect(
                databaseHabit?.isActive
            ).toBe(false);
        });

        it("rejects deleting another user's habit", async () => {
            const otherUserResponse = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "Other User",
                    email: "other-delete@test.com",
                    password: "password123"
                });

            expect(
                otherUserResponse.status
            ).toBe(201);

            const otherToken =
                otherUserResponse.body.data.accessToken;

            const createResponse =
                await request(app)
                    .post("/api/v1/habits")
                    .set(
                        "Authorization",
                        `Bearer ${otherToken}`
                    )
                    .send({
                        name: "Private habit",
                        startDate: "2026-08-28"
                    });

            expect(
                createResponse.status
            ).toBe(201);

            const habitId =
                createResponse.body.data.habit.id;

            const response = await request(app)
                .delete(`/api/v1/habits/${habitId}`)
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                );

            expect(response.status).toBe(404);

            expect(
                response.body.error.code
            ).toBe("HABIT_NOT_FOUND");
        });
    });

    describe("Habit date validation", () => {
        it("rejects an end date before the start date", async () => {
            const response = await request(app)
                .post("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "Invalid date habit",
                    startDate: "2026-08-28",
                    endDate: "2026-08-27"
                });

            expect(response.status).toBe(400);

            expect(
                response.body.success
            ).toBe(false);
        });

        it("rejects a non-positive target value", async () => {
            const response = await request(app)
                .post("/api/v1/habits")
                .set(
                    "Authorization",
                    `Bearer ${accessToken}`
                )
                .send({
                    name: "Invalid target",
                    targetValue: 0,
                    startDate: "2026-08-28"
                });

            expect(response.status).toBe(400);

            expect(
                response.body.success
            ).toBe(false);
        });
    });
});