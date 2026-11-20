import { prisma } from "../../database/prisma.js";

import {
  getUserDayRange
} from "../../common/utils/date.utils.js";

export async function getTodayDashboard(
  userId: string
) {
  const [user, goals, habits] =
    await Promise.all([
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
              heightCm: true,
              weightKg: true,
            },
          },

          dietaryPreference: {
            select: {
              dietType: true,
            },
          },
        },
      }),

      prisma.userGoal.findMany({
        where: {
          userId,
          isActive: true
        },

        orderBy: {
          createdAt: "desc"
        }
      }),

      prisma.habit.findMany({
        where: {
          userId,
          isActive: true
        },

        include: {
          goal: true
        },

        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

  if (!user) {
    throw new Error("User not found");
  }

  const timezone =
    user.profile?.timezone ??
    "Asia/Kolkata";

  const {
    startOfDay,
    endOfDay,
    date
  } = getUserDayRange(timezone);

  const habitIds =
    habits.map(
      (habit) => habit.id
    );

  const todayCompletions =
    habitIds.length > 0
      ? await prisma.habitCompletion.findMany({
        where: {
          habitId: {
            in: habitIds
          },

          completedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },

        orderBy: {
          completedAt: "asc"
        }
      })
      : [];

  const completionsByHabit =
    new Map<
      string,
      typeof todayCompletions
    >();

  for (const completion of todayCompletions) {
    const existing =
      completionsByHabit.get(
        completion.habitId
      ) ?? [];

    existing.push(completion);

    completionsByHabit.set(
      completion.habitId,
      existing
    );
  }

  return {
    date,

    user: {
      id: user.id,
      name: user.name,
      timezone,

      profile: {
        primaryGoal: user.profile?.primaryGoal ?? null,
        heightCm: user.profile?.heightCm ?? null,
        weightKg: user.profile?.weightKg ?? null,
      },

      dietType: user.dietaryPreference?.dietType ?? null,
    },

    goals,

    habits: habits.map((habit) => {
      const completions =
        completionsByHabit.get(
          habit.id
        ) ?? [];

      const totalValue =
        completions.reduce(
          (sum, completion) =>
            sum +
            Number(
              completion.value ?? 0
            ),
          0
        );

      return {
        id: habit.id,
        name: habit.name,
        description:
          habit.description,
        goalId: habit.goalId,
        targetValue:
          habit.targetValue,
        targetUnit:
          habit.targetUnit,
        frequency:
          habit.frequency,

        today: {
          completed:
            habit.targetValue !== null
              ? totalValue >= Number(habit.targetValue)
              : completions.length > 0,

          completionCount:
            completions.length,

          value:
            completions.length > 0
              ? totalValue
              : null,

          lastCompletedAt:
            completions.at(-1)
              ?.completedAt ?? null
        }
      };
    })
  };
}