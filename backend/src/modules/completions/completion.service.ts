import { prisma } from "../../database/prisma.js";

import {
  AppError
} from "../../common/errors/app.error.js";

import type {
  CreateCompletionInput,
  CompletionQuery
} from "./completion.schema.js";

import {
  getUserLocalDate,
  getUserDayDifference,
  getUserDayRange
} from "../../common/utils/date.utils.js";

async function getOwnedHabit(
  userId: string,
  habitId: string
) {
  const habit =
    await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId
      }
    });

  if (!habit) {
    throw new AppError(
      "Habit not found",
      404,
      "HABIT_NOT_FOUND"
    );
  }

  return habit;
}

async function getUserTimezone(
  userId: string
): Promise<string> {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId
      },

      select: {
        profile: {
          select: {
            timezone: true
          }
        }
      }
    });

  return (
    user?.profile?.timezone ??
    "Asia/Kolkata"
  );
}

export async function createCompletion(
  userId: string,
  habitId: string,
  input: CreateCompletionInput
) {
  const habit =
    await getOwnedHabit(
      userId,
      habitId
    );

  if (!habit.isActive) {
    throw new AppError(
      "Cannot complete an inactive habit",
      400,
      "HABIT_INACTIVE"
    );
  }

  if (
    input.completedAt <
    habit.startDate
  ) {
    throw new AppError(
      "Completion cannot be before habit start date",
      400,
      "INVALID_COMPLETION_DATE"
    );
  }

  if (
    habit.endDate &&
    input.completedAt >
    habit.endDate
  ) {
    throw new AppError(
      "Completion cannot be after habit end date",
      400,
      "INVALID_COMPLETION_DATE"
    );
  }

  // Validate measurable habit progress.
  if (
    input.value !== undefined &&
    habit.targetValue !== null
  ) {
    const timezone =
      await getUserTimezone(userId);

    const {
      startOfDay,
      endOfDay
    } = getUserDayRange(timezone);

    const todayCompletions =
      await prisma.habitCompletion.findMany({
        where: {
          habitId,

          completedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },

        select: {
          value: true
        }
      });

    const currentTotal =
      todayCompletions.reduce(
        (sum, completion) =>
          sum +
          Number(
            completion.value ?? 0
          ),
        0
      );

    const target =
      Number(habit.targetValue);

    const remaining =
      target - currentTotal;

    if (remaining <= 0) {
      throw new AppError(
        "Habit target has already been reached for today",
        400,
        "HABIT_TARGET_REACHED"
      );
    }

    if (input.value > remaining) {
      throw new AppError(
        `Completion value cannot exceed the remaining target of ${remaining}`,
        400,
        "COMPLETION_EXCEEDS_TARGET"
      );
    }
  }

  return prisma.habitCompletion.create({
    data: {
      habitId,

      completedAt:
        input.completedAt,

      ...(input.value !== undefined && {
        value: input.value
      }),

      ...(input.notes !== undefined && {
        notes: input.notes
      })
    }
  });
}

export async function getCompletions(
  userId: string,
  habitId: string,
  query: CompletionQuery
) {
  await getOwnedHabit(
    userId,
    habitId
  );

  return prisma.habitCompletion.findMany({
    where: {
      habitId,

      ...(query.from ||
        query.to
        ? {
          completedAt: {
            ...(query.from && {
              gte: query.from
            }),

            ...(query.to && {
              lte: query.to
            })
          }
        }
        : {})
    },

    orderBy: {
      completedAt: "desc"
    }
  });
}

export async function getHabitStats(
  userId: string,
  habitId: string
) {
  await getOwnedHabit(
    userId,
    habitId
  );

  const timezone =
    await getUserTimezone(
      userId
    );

  const completions =
    await prisma.habitCompletion.findMany({
      where: {
        habitId
      },

      orderBy: {
        completedAt: "asc"
      },

      select: {
        completedAt: true
      }
    });

  const uniqueDays =
    new Set(
      completions.map(
        (completion) =>
          getUserLocalDate(
            completion.completedAt,
            timezone
          )
      )
    );

  const sortedDays =
    Array.from(uniqueDays).sort();

  const totalCompletions =
    completions.length;

  if (sortedDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions,
      completionRate: 0,
      lastCompletedAt: null
    };
  }

  /*
   * Calculate longest streak.
   */
  let longestStreak = 1;
  let runningStreak = 1;

  for (
    let i = 1;
    i < sortedDays.length;
    i++
  ) {
    const previousDay = sortedDays[i - 1];
    const currentDay = sortedDays[i];

    if (!previousDay || !currentDay) {
      continue;
    }

    const difference =
      getUserDayDifference(
        previousDay,
        currentDay
      );

    if (difference === 1) {
      runningStreak++;

      longestStreak =
        Math.max(
          longestStreak,
          runningStreak
        );
    } else {
      runningStreak = 1;
    }
  }

  /*
   * Calculate current streak using
   * the user's local calendar date.
   */
  const {
    userNow
  } = getUserDayRange(
    timezone
  );

  const todayString =
    userNow.toISODate()!;

  const yesterdayString =
    userNow
      .minus({
        days: 1
      })
      .toISODate()!;

  let currentStreak = 0;

  if (
    uniqueDays.has(
      todayString
    )
  ) {
    currentStreak = 1;

    let cursor =
      userNow.minus({
        days: 1
      });

    while (true) {
      const dateString =
        cursor.toISODate()!;

      if (
        !uniqueDays.has(
          dateString
        )
      ) {
        break;
      }

      currentStreak++;

      cursor =
        cursor.minus({
          days: 1
        });
    }
  } else if (
    uniqueDays.has(
      yesterdayString
    )
  ) {
    /*
     * The most recent completion was
     * yesterday, so the current streak
     * is still considered active.
     */
    currentStreak = 1;

    let cursor =
      userNow.minus({
        days: 2
      });

    while (true) {
      const dateString =
        cursor.toISODate()!;

      if (
        !uniqueDays.has(
          dateString
        )
      ) {
        break;
      }

      currentStreak++;

      cursor =
        cursor.minus({
          days: 1
        });
    }
  }

  /*
   * Calculate completion rate based
   * on unique calendar days.
   */
  const firstDay =
    sortedDays[0];

  const lastDay =
    sortedDays[
    sortedDays.length - 1
    ];

  if (!firstDay || !lastDay) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions,
      completionRate: 0,
      lastCompletedAt: null
    };
  }

  const totalDays =
    getUserDayDifference(
      firstDay,
      lastDay
    ) + 1;

  const completionRate =
    totalDays > 0
      ? Number(
        (
          (sortedDays.length /
            totalDays) *
          100
        ).toFixed(2)
      )
      : 0;

  return {
    currentStreak,

    longestStreak,

    totalCompletions,

    completionRate,

    lastCompletedAt:
      completions[
        completions.length - 1
      ]?.completedAt ?? null
  };
}