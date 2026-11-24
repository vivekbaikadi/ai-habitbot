
import { prisma } from "../../database/prisma.js";

import {
  getUserDayRange,
  getUserWeekRange,
  getUserLocalDate
} from "../../common/utils/date.utils.js";

function getWeekday(date: string): string {
  const weekdays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
  ];

  const day = new Date(`${date}T00:00:00Z`).getUTCDay();

  return weekdays[(day + 6) % 7]!;
}

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
    user.profile?.timezone ?? "Asia/Kolkata";

  const {
    startOfDay,
    endOfDay,
    date
  } = getUserDayRange(timezone);

  const {
    startOfWeek,
    endOfWeek
  } = getUserWeekRange(timezone);

  const habitIds = habits.map(
    (habit) => habit.id
  );

  const [todayCompletions, weeklyCompletions] =
    await Promise.all([
      habitIds.length > 0
        ? prisma.habitCompletion.findMany({
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
        : [],

      habitIds.length > 0
        ? prisma.habitCompletion.findMany({
            where: {
              habitId: {
                in: habitIds
              },

              completedAt: {
                gte: startOfWeek,
                lte: endOfWeek
              }
            },

            select: {
              habitId: true,
              completedAt: true
            }
          })
        : []
    ]);

  const completionsByHabit =
    new Map<string, typeof todayCompletions>();

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

  const weeklyDaysByHabit =
    new Map<string, Set<string>>();

  for (const completion of weeklyCompletions) {
    const existing =
      weeklyDaysByHabit.get(
        completion.habitId
      ) ?? new Set<string>();

    existing.add(
      getUserLocalDate(
        completion.completedAt,
        timezone
      )
    );

    weeklyDaysByHabit.set(
      completion.habitId,
      existing
    );
  }

  const todayWeekday = getWeekday(date);

  return {
    date,

    user: {
      id: user.id,
      name: user.name,
      timezone,

      profile: {
        primaryGoal:
          user.profile?.primaryGoal ?? null,
        heightCm:
          user.profile?.heightCm ?? null,
        weightKg:
          user.profile?.weightKg ?? null
      },

      dietType:
        user.dietaryPreference?.dietType ?? null
    },

    goals,

    habits: habits.map((habit) => {
      const completions =
        completionsByHabit.get(habit.id) ?? [];

      const totalValue = completions.reduce(
        (sum, completion) =>
          sum + Number(completion.value ?? 0),
        0
      );

      const startDate = getUserLocalDate(
        habit.startDate,
        timezone
      );

      const endDate = habit.endDate
        ? getUserLocalDate(habit.endDate, timezone)
        : null;

      const withinActiveDates =
        date >= startDate &&
        (!endDate || date <= endDate);

      const isScheduledToday =
        withinActiveDates &&
        (
          habit.frequency === "DAILY" ||
          habit.frequency === "WEEKLY" ||
          (
            habit.frequency === "CUSTOM" &&
            habit.customDays.includes(
              todayWeekday as typeof habit.customDays[number]
            )
          )
        );

      const weeklyDays =
        weeklyDaysByHabit.get(habit.id) ??
        new Set<string>();

      const weeklyCompleted =
        weeklyDays.size;

      const weeklyTarget =
        habit.weeklyTarget;

      const weeklyProgress =
        habit.frequency === "WEEKLY" &&
        weeklyTarget !== null
          ? {
              target: weeklyTarget,
              completed: weeklyCompleted,
              remaining: Math.max(
                0,
                weeklyTarget - weeklyCompleted
              ),
              achieved:
                weeklyCompleted >= weeklyTarget
            }
          : null;

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        goalId: habit.goalId,

        targetValue: habit.targetValue,
        targetUnit: habit.targetUnit,

        frequency: habit.frequency,
        weeklyTarget: habit.weeklyTarget,
        customDays: habit.customDays,

        isScheduledToday,

        weeklyProgress,

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
            completions.at(-1)?.completedAt ?? null
        }
      };
    })
  };
}
