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

describe("AI Context API", () => {
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
                    name: "AI Context User",
                    email:
                        "ai-context@habitbot.dev",
                    passwordHash
                }
            });

        userId = user.id;

        await prisma.userProfile.create({
            data: {
                userId,
                timezone: "Asia/Kolkata",
                primaryGoal: "GENERAL_HEALTH",
                activityLevel: "MODERATE"
            }
        });

        accessToken =
            signAccessToken(userId);
    });

    describe(
        "GET /api/v1/ai/context",
        () => {
            it(
                "requires authentication",
                async () => {
                    const response =
                        await request(app)
                            .get(
                                "/api/v1/ai/context"
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
                "returns AI context for the authenticated user",
                async () => {
                    const response =
                        await request(app)
                            .get(
                                "/api/v1/ai/context"
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
                    ).toHaveProperty(
                        "context"
                    );
                }
            );

            it(
                "includes user information",
                async () => {
                    const response =
                        await request(app)
                            .get(
                                "/api/v1/ai/context"
                            )
                            .set(
                                "Authorization",
                                `Bearer ${accessToken}`
                            );

                    const user =
                        response.body.data.context
                            .user;

                    expect(
                        user.id
                    ).toBe(userId);

                    expect(
                        user.name
                    ).toBe("AI Context User");

                    expect(
                        user.timezone
                    ).toBe("Asia/Kolkata");

                    expect(
                        user.primaryGoal
                    ).toBe("GENERAL_HEALTH");

                    expect(
                        user.activityLevel
                    ).toBe("MODERATE");

                    expect(
                        user.dietType
                    ).toBeNull();
                }
            );

            it(
                "returns empty today statistics for a new user",
                async () => {
                    const response =
                        await request(app)
                            .get(
                                "/api/v1/ai/context"
                            )
                            .set(
                                "Authorization",
                                `Bearer ${accessToken}`
                            );

                    const today =
                        response.body.data.context
                            .today;

                    expect(
                        today.habits
                    ).toEqual({
                        total: 0,
                        completed: 0,
                        pending: 0,
                        completionRate: 0
                    });

                    expect(
                        today.nutrition
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
                "includes active goals",
                async () => {
                    const goal =
                        await prisma.userGoal.create({
                            data: {
                                userId,
                                title: "Lose 5 kg",
                                description:
                                    "Improve overall fitness",
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
                                "/api/v1/ai/context"
                            )
                            .set(
                                "Authorization",
                                `Bearer ${accessToken}`
                            );

                    const goals =
                        response.body.data.context
                            .goals;

                    expect(
                        goals
                    ).toHaveLength(1);

                    expect(
                        goals[0]
                    ).toEqual({
                        id: goal.id,
                        title: "Lose 5 kg",
                        description:
                            "Improve overall fitness"
                    });
                }
            );

            it(
                "includes active habits and their statistics",
                async () => {
                    const habit =
                        await prisma.habit.create({
                            data: {
                                userId,
                                name: "Walk 8000 steps",
                                targetValue: 8000,
                                targetUnit: "steps",
                                frequency: "DAILY",
                                startDate: new Date(
                                    Date.now() -
                                    86400000
                                ),
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
                                `Bearer ${accessToken}`
                            );

                    const habits =
                        response.body.data.context
                            .habits;

                    expect(
                        habits
                    ).toHaveLength(1);

                    expect(
                        habits[0].id
                    ).toBe(habit.id);

                    expect(
                        habits[0].name
                    ).toBe(
                        "Walk 8000 steps"
                    );

                    expect(
                        habits[0].targetValue
                    ).toBe(8000);

                    expect(
                        habits[0].targetUnit
                    ).toBe("steps");

                    expect(
                        habits[0].frequency
                    ).toBe("DAILY");

                    expect(
                        habits[0].today
                    ).toEqual({
                        completed: false,
                        value: null
                    });

                    expect(
                        habits[0].stats
                    ).toEqual({
                        currentStreak: 0,
                        longestStreak: 0,
                        completionRate: 0
                    });
                }
            );

            it(
                "includes today's habit completion state",
                async () => {
                    const habit =
                        await prisma.habit.create({
                            data: {
                                userId,
                                name: "Study",
                                frequency: "DAILY",
                                startDate: new Date(
                                    Date.now() -
                                    86400000
                                ),
                                isActive: true
                            }
                        });

                    await prisma.habitCompletion.create({
                        data: {
                            habitId: habit.id,
                            completedAt: new Date(),
                            value: 2
                        }
                    });

                    const response =
                        await request(app)
                            .get(
                                "/api/v1/ai/context"
                            )
                            .set(
                                "Authorization",
                                `Bearer ${accessToken}`
                            );

                    const habitContext =
                        response.body.data.context
                            .habits[0];

                    expect(
                        habitContext.today
                    ).toEqual({
                        completed: true,
                        value: 2
                    });

                    expect(
                        habitContext.stats
                            .currentStreak
                    ).toBe(1);

                    expect(
                        habitContext.stats
                            .longestStreak
                    ).toBe(1);
                }
            );

            it(
                "calculates overall today's habit summary",
                async () => {
                    const completedHabit =
                        await prisma.habit.create({
                            data: {
                                userId,
                                name: "Exercise",
                                frequency: "DAILY",
                                startDate: new Date(
                                    Date.now() -
                                    86400000
                                ),
                                isActive: true
                            }
                        });

                    await prisma.habit.create({
                        data: {
                            userId,
                            name: "Read",
                            frequency: "DAILY",
                            startDate: new Date(
                                Date.now() -
                                86400000
                            ),
                            isActive: true
                        }
                    });

                    await prisma.habitCompletion.create({
                        data: {
                            habitId:
                                completedHabit.id,
                            completedAt: new Date(),
                            value: 30
                        }
                    });

                    const response =
                        await request(app)
                            .get(
                                "/api/v1/ai/context"
                            )
                            .set(
                                "Authorization",
                                `Bearer ${accessToken}`
                            );

                    expect(
                        response.body.data.context
                            .today.habits
                    ).toEqual({
                        total: 2,
                        completed: 1,
                        pending: 1,
                        completionRate: 50
                    });
                }
            );

            it(
                "includes dietary preference",
                async () => {
                    await prisma.dietaryPreference.create({
                        data: {
                            userId,
                            dietType: "VEGETARIAN"
                        }
                    });

                    const response =
                        await request(app)
                            .get(
                                "/api/v1/ai/context"
                            )
                            .set(
                                "Authorization",
                                `Bearer ${accessToken}`
                            );

                    expect(
                        response.body.data.context
                            .user.dietType
                    ).toBe(
                        "VEGETARIAN"
                    );
                }
            );

            it(
                "includes disliked foods",
                async () => {
                    const food =
                        await prisma.food.findFirst();

                    if (!food) {
                        throw new Error(
                            "No food exists in test database"
                        );
                    }

                    await prisma.userFoodDislike.create({
                        data: {
                            userId,
                            foodId: food.id
                        }
                    });

                    const response =
                        await request(app)
                            .get(
                                "/api/v1/ai/context"
                            )
                            .set(
                                "Authorization",
                                `Bearer ${accessToken}`
                            );

                    expect(
                        response.body.data.context
                            .dietaryRestrictions
                            .dislikedFoods
                    ).toContain(
                        food.name
                    );
                }
            );

            it(
                "keeps AI context isolated between users",
                async () => {
                    const otherUser =
                        await prisma.user.create({
                            data: {
                                name: "Other AI User",
                                email:
                                    "other-ai-context@habitbot.dev",
                                passwordHash:
                                    await hashPassword(
                                        "TestPassword123!"
                                    )
                            }
                        });

                    await prisma.userProfile.create({
                        data: {
                            userId: otherUser.id,
                            timezone:
                                "Asia/Kolkata"
                        }
                    });

                    await prisma.userGoal.create({
                        data: {
                            userId:
                                otherUser.id,
                            title:
                                "Other User Secret Goal",
                            isActive: true
                        }
                    });

                    await prisma.habit.create({
                        data: {
                            userId:
                                otherUser.id,
                            name:
                                "Other User Secret Habit",
                            frequency:
                                "DAILY",
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
                                `Bearer ${accessToken}`
                            );

                    const context =
                        response.body.data.context;

                    expect(
                        context.goals
                    ).toEqual([]);

                    expect(
                        context.habits
                    ).toEqual([]);

                    expect(
                        JSON.stringify(context)
                    ).not.toContain(
                        "Other User Secret"
                    );
                }
            );
        }
    );
});