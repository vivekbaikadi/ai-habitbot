
import { prisma } from "../../database/prisma.js";

import type {
    AIUserContext
} from "./ai-context.types.js";

import {
    getTodayDashboard
} from "../dashboard/dashboard.service.js";

import {
    getTodayNutrition
} from "../nutrition/nutrition.service.js";

import {
    getHabitStats
} from "../completions/completion.service.js";

export async function buildAIUserContext(
    userId: string
): Promise<AIUserContext> {
    const [
        user,
        dashboard,
        nutrition,
        dislikedFoods
    ] = await Promise.all([
        prisma.user.findUnique({
            where: {
                id: userId
            },

            select: {
                id: true,
                name: true,

                profile: {
                    select: {
                        timezone: true,
                        primaryGoal: true,
                        dateOfBirth: true,
                        sex: true,
                        heightCm: true,
                        weightKg: true
                    }
                },

                dietaryPreference: {
                    select: {
                        dietType: true
                    }
                }
            }
        }),

        getTodayDashboard(userId),

        getTodayNutrition(userId),

        prisma.userFoodDislike.findMany({
            where: {
                userId
            },

            include: {
                food: {
                    select: {
                        name: true
                    }
                }
            }
        })
    ]);

    if (!user) {
        throw new Error("User not found");
    }

    // Get the user's timezone.
    const timezone =
        user.profile?.timezone ?? "Asia/Kolkata";

    // Get the current local time in the user's timezone.
    const localTime = new Date().toLocaleTimeString(
        "en-GB",
        {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );

    const totalHabits =
        dashboard.habits.length;

    const completedHabits =
        dashboard.habits.filter(
            (habit) =>
                habit.today.completed
        ).length;

    const pendingHabits =
        totalHabits -
        completedHabits;

    const completionRate =
        totalHabits === 0
            ? 0
            : Number(
                (
                    (completedHabits /
                        totalHabits) *
                    100
                ).toFixed(2)
            );

    /*
     * The dashboard currently contains
     * today's habit state.
     *
     * We obtain historical statistics
     * separately for each active habit.
     */
    const habitsWithStats =
        await Promise.all(
            dashboard.habits.map(
                async (habit) => {
                    const stats =
                        await getHabitStats(
                            userId,
                            habit.id
                        );

                    return {
                        id: habit.id,
                        name: habit.name,

                        goalId:
                            habit.goalId,

                        targetValue:
                            habit.targetValue !== null
                                ? Number(habit.targetValue)
                                : null,

                        targetUnit:
                            habit.targetUnit,

                        frequency:
                            habit.frequency,

                        today: {
                            completed:
                                habit.today.completed,

                            value:
                                habit.today.value !== null
                                    ? Number(
                                        habit.today.value
                                    )
                                    : null
                        },

                        stats: {
                            currentStreak:
                                stats.currentStreak,

                            longestStreak:
                                stats.longestStreak,

                            completionRate:
                                stats.completionRate
                        }
                    };
                }
            )
        );

    return {
        user: {
            id: user.id,
            name: user.name,
            timezone,

            dateOfBirth:
                user.profile?.dateOfBirth
                    ? user.profile.dateOfBirth
                        .toISOString()
                        .slice(0, 10)
                    : null,

            sex:
                user.profile?.sex ?? null,

            heightCm:
                user.profile?.heightCm !== null &&
                user.profile?.heightCm !== undefined
                    ? Number(user.profile.heightCm)
                    : null,

            weightKg:
                user.profile?.weightKg !== null &&
                user.profile?.weightKg !== undefined
                    ? Number(user.profile.weightKg)
                    : null,

            dietType:
                user.dietaryPreference?.dietType ?? null,

            primaryGoal:
                user.profile?.primaryGoal ?? null
        },

        today: {
            date: nutrition.date,
            localTime,

            habits: {
                total: totalHabits,
                completed: completedHabits,
                pending: pendingHabits,
                completionRate
            },

            nutrition: {
                calories: nutrition.totals.calories,
                protein: nutrition.totals.protein,
                carbohydrate: nutrition.totals.carbohydrate,
                fat: nutrition.totals.fat,
                fiber: nutrition.totals.fiber,

                meals: nutrition.meals.map((meal) => ({
                    id: meal.id,
                    mealType: meal.mealType,
                    eatenAt: meal.eatenAt.toISOString(),

                    totals: {
                        calories: meal.totals.calories,
                        protein: meal.totals.protein,
                        carbohydrate: meal.totals.carbohydrate,
                        fat: meal.totals.fat,
                        fiber: meal.totals.fiber
                    },

                    items: meal.items.map((item) => ({
                        foodName: item.foodName,
                        quantity: item.quantity,
                        unit: item.unit,
                        grams: item.grams,
                        calories: item.calories,
                        protein: item.protein,
                        carbohydrate: item.carbohydrate,
                        fat: item.fat,
                        fiber: item.fiber
                    }))
                }))
            }
        },

        goals:
            dashboard.goals.map(
                (goal) => ({
                    id: goal.id,
                    title: goal.title,
                    description: goal.description
                })
            ),

        habits: habitsWithStats,

        dietaryRestrictions: {
            dislikedFoods:
                dislikedFoods.map(
                    (item) => item.food.name
                )
        }
    };
}
