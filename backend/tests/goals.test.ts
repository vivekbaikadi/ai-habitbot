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


async function registerAndLogin(
    name: string,
    email: string
) {
    const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
            name,
            email,
            password: "Password123!"
        });

    expect(response.status).toBe(201);

    return response.body.data;
}


describe("Goals API", () => {

    beforeEach(async () => {
        await cleanDatabase();
    });


    describe("POST /api/v1/goals", () => {

        it("creates a goal", async () => {

            const auth =
                await registerAndLogin(
                    "Goal User",
                    "goal-create@example.com"
                );

            const response =
                await request(app)
                    .post("/api/v1/goals")
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    )
                    .send({
                        title: "Lose 5 kg",
                        description:
                            "Reach my target weight gradually"
                    });

            expect(response.status).toBe(201);

            expect(response.body.success)
                .toBe(true);

            expect(
                response.body.data.goal
            ).toMatchObject({
                title: "Lose 5 kg",
                description:
                    "Reach my target weight gradually",
                isActive: true
            });

            expect(
                response.body.data.goal.id
            ).toBeDefined();

            expect(
                response.body.data.goal.userId
            ).toBe(auth.user.id);
        });


        it("rejects unauthenticated requests", async () => {

            const response =
                await request(app)
                    .post("/api/v1/goals")
                    .send({
                        title: "Lose 5 kg"
                    });

            expect(response.status).toBe(401);
        });


        it("rejects an invalid goal", async () => {

            const auth =
                await registerAndLogin(
                    "Invalid Goal User",
                    "goal-invalid@example.com"
                );

            const response =
                await request(app)
                    .post("/api/v1/goals")
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    )
                    .send({
                        title: ""
                    });

            expect(response.status).toBe(400);
        });

    });


    describe("GET /api/v1/goals", () => {

        it(
            "lists the authenticated user's goals",
            async () => {

                const auth =
                    await registerAndLogin(
                        "Goal List User",
                        "goal-list@example.com"
                    );

                await request(app)
                    .post("/api/v1/goals")
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    )
                    .send({
                        title: "Lose 5 kg"
                    });

                await request(app)
                    .post("/api/v1/goals")
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    )
                    .send({
                        title: "Build consistency"
                    });

                const response =
                    await request(app)
                        .get("/api/v1/goals")
                        .set(
                            "Authorization",
                            `Bearer ${auth.accessToken}`
                        );

                expect(response.status)
                    .toBe(200);

                expect(response.body.success)
                    .toBe(true);

                expect(
                    response.body.data.goals
                ).toHaveLength(2);
            }
        );


        it(
            "does not return another user's goals",
            async () => {

                const userA =
                    await registerAndLogin(
                        "User A",
                        "goal-user-a@example.com"
                    );

                const userB =
                    await registerAndLogin(
                        "User B",
                        "goal-user-b@example.com"
                    );

                await request(app)
                    .post("/api/v1/goals")
                    .set(
                        "Authorization",
                        `Bearer ${userA.accessToken}`
                    )
                    .send({
                        title:
                            "User A private goal"
                    });

                const response =
                    await request(app)
                        .get("/api/v1/goals")
                        .set(
                            "Authorization",
                            `Bearer ${userB.accessToken}`
                        );

                expect(response.status)
                    .toBe(200);

                expect(
                    response.body.data.goals
                ).toHaveLength(0);
            }
        );

    });


    describe("GET /api/v1/goals/:id", () => {

        it("gets a user's goal", async () => {

            const auth =
                await registerAndLogin(
                    "Goal Get User",
                    "goal-get@example.com"
                );

            const created =
                await request(app)
                    .post("/api/v1/goals")
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    )
                    .send({
                        title: "Read more"
                    });

            const goalId =
                created.body.data.goal.id;

            const response =
                await request(app)
                    .get(
                        `/api/v1/goals/${goalId}`
                    )
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    );

            expect(response.status)
                .toBe(200);

            expect(
                response.body.data.goal.id
            ).toBe(goalId);

            expect(
                response.body.data.goal.title
            ).toBe("Read more");
        });


        it(
            "rejects access to another user's goal",
            async () => {

                const userA =
                    await registerAndLogin(
                        "Goal Owner",
                        "goal-owner@example.com"
                    );

                const userB =
                    await registerAndLogin(
                        "Other User",
                        "goal-other@example.com"
                    );

                const created =
                    await request(app)
                        .post("/api/v1/goals")
                        .set(
                            "Authorization",
                            `Bearer ${userA.accessToken}`
                        )
                        .send({
                            title: "Private goal"
                        });

                const goalId =
                    created.body.data.goal.id;

                const response =
                    await request(app)
                        .get(
                            `/api/v1/goals/${goalId}`
                        )
                        .set(
                            "Authorization",
                            `Bearer ${userB.accessToken}`
                        );

                expect(response.status)
                    .toBe(404);
            }
        );

    });


    describe("PATCH /api/v1/goals/:id", () => {

        it("updates a goal", async () => {

            const auth =
                await registerAndLogin(
                    "Goal Update User",
                    "goal-update@example.com"
                );

            const created =
                await request(app)
                    .post("/api/v1/goals")
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    )
                    .send({
                        title: "Original goal"
                    });

            const goalId =
                created.body.data.goal.id;

            const response =
                await request(app)
                    .patch(
                        `/api/v1/goals/${goalId}`
                    )
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    )
                    .send({
                        title: "Updated goal",
                        description:
                            "Updated description"
                    });

            expect(response.status)
                .toBe(200);

            expect(
                response.body.data.goal
            ).toMatchObject({
                id: goalId,
                title: "Updated goal",
                description:
                    "Updated description"
            });
        });


        it(
            "rejects updating another user's goal",
            async () => {

                const userA =
                    await registerAndLogin(
                        "Goal Update Owner",
                        "goal-update-owner@example.com"
                    );

                const userB =
                    await registerAndLogin(
                        "Goal Update Other",
                        "goal-update-other@example.com"
                    );

                const created =
                    await request(app)
                        .post("/api/v1/goals")
                        .set(
                            "Authorization",
                            `Bearer ${userA.accessToken}`
                        )
                        .send({
                            title: "Private goal"
                        });

                const goalId =
                    created.body.data.goal.id;

                const response =
                    await request(app)
                        .patch(
                            `/api/v1/goals/${goalId}`
                        )
                        .set(
                            "Authorization",
                            `Bearer ${userB.accessToken}`
                        )
                        .send({
                            title: "Hacked goal"
                        });

                expect(response.status)
                    .toBe(404);
            }
        );

    });


    describe("DELETE /api/v1/goals/:id", () => {

        it("deletes a goal", async () => {

            const auth =
                await registerAndLogin(
                    "Goal Delete User",
                    "goal-delete@example.com"
                );

            const created =
                await request(app)
                    .post("/api/v1/goals")
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    )
                    .send({
                        title: "Temporary goal"
                    });

            const goalId =
                created.body.data.goal.id;

            const response =
                await request(app)
                    .delete(
                        `/api/v1/goals/${goalId}`
                    )
                    .set(
                        "Authorization",
                        `Bearer ${auth.accessToken}`
                    );

            expect(response.status)
                .toBe(200);

            const databaseGoal =
                await prisma.userGoal.findUnique({
                    where: {
                        id: goalId
                    }
                });

            expect(databaseGoal).not.toBeNull();
            expect(databaseGoal?.isActive).toBe(false);
        });


        it(
            "cannot delete another user's goal",
            async () => {

                const userA =
                    await registerAndLogin(
                        "Delete Owner",
                        "goal-delete-owner@example.com"
                    );

                const userB =
                    await registerAndLogin(
                        "Delete Other",
                        "goal-delete-other@example.com"
                    );

                const created =
                    await request(app)
                        .post("/api/v1/goals")
                        .set(
                            "Authorization",
                            `Bearer ${userA.accessToken}`
                        )
                        .send({
                            title: "Protected goal"
                        });

                const goalId =
                    created.body.data.goal.id;

                const response =
                    await request(app)
                        .delete(
                            `/api/v1/goals/${goalId}`
                        )
                        .set(
                            "Authorization",
                            `Bearer ${userB.accessToken}`
                        );

                expect(response.status)
                    .toBe(404);

                const databaseGoal =
                    await prisma.userGoal.findUnique({
                        where: {
                            id: goalId
                        }
                    });

                expect(databaseGoal)
                    .not.toBeNull();
            }
        );

    });

});