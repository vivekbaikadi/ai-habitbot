import { prisma } from "../../database/prisma.js";
import { DateTime } from "luxon";
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


export async function createCompletion(
  userId: string,
  habitId: string,
  input: CreateCompletionInput
) {
  const habit = await getOwnedHabit(userId, habitId);

  if (!habit.isActive) {
    throw new AppError(
      "Cannot complete an inactive habit",
      400,
      "HABIT_INACTIVE"
    );
  }

  const timezone = await getUserTimezone(userId);

  // Determine the local date of the requested completion.
  const completionDate = getUserLocalDate(
    input.completedAt,
    timezone
  );

  const habitStartDate = getUserLocalDate(
    habit.startDate,
    timezone
  );

  const habitEndDate = habit.endDate
    ? getUserLocalDate(habit.endDate, timezone)
    : null;

  if (completionDate < habitStartDate) {
    throw new AppError(
      "Completion cannot be before habit start date",
      400,
      "INVALID_COMPLETION_DATE"
    );
  }

  if (habitEndDate && completionDate > habitEndDate) {
    throw new AppError(
      "Completion cannot be after habit end date",
      400,
      "INVALID_COMPLETION_DATE"
    );
  }

  // Validate custom weekday scheduling.
  if (habit.frequency === "CUSTOM") {
    if (habit.customDays.length === 0) {
      throw new AppError(
        "This habit has no configured schedule. Please edit its schedule first.",
        400,
        "HABIT_SCHEDULE_NOT_CONFIGURED"
      );
    }

    const weekday = getWeekday(completionDate);

    if (!habit.customDays.includes(weekday as typeof habit.customDays[number])) {
      throw new AppError(
        `This habit is not scheduled for ${weekday}`,
        400,
        "HABIT_NOT_SCHEDULED"
      );
    }
  }

  // Determine the correct local day for this completion,
  // including backdated entries.
  const {
    startOfDay,
    endOfDay
  } = getUserDayRange(timezone, input.completedAt);

  const dayCompletions =
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

  // Prevent duplicate binary completions on the same day.
  if (habit.targetValue === null && dayCompletions.length > 0) {
    throw new AppError(
      "This habit has already been completed for this day",
      400,
      "HABIT_ALREADY_COMPLETED"
    );
  }

  // Validate measurable habit progress.
  if (
    input.value !== undefined &&
    habit.targetValue !== null
  ) {
    const currentTotal = dayCompletions.reduce(
      (sum, completion) =>
        sum + Number(completion.value ?? 0),
      0
    );

    const target = Number(habit.targetValue);
    const remaining = target - currentTotal;

    if (remaining <= 0) {
      throw new AppError(
        "Habit target has already been reached for this day",
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
      completedAt: input.completedAt,

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
  const habit = await getOwnedHabit(userId, habitId);

  const timezone = await getUserTimezone(userId);

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

  const uniqueDays = new Set(
    completions.map((completion) =>
      getUserLocalDate(completion.completedAt, timezone)
    )
  );

  const totalCompletions = completions.length;

  const { userNow } = getUserDayRange(timezone);

  const today = userNow.toISODate()!;

  const startDate = getUserLocalDate(
    habit.startDate,
    timezone
  );

  const endDate = habit.endDate
    ? getUserLocalDate(habit.endDate, timezone)
    : today;

  const effectiveEndDate =
    endDate < today ? endDate : today;

  const emptyResult = {
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions,
    completionRate: 0,
    lastCompletedAt:
      completions.at(-1)?.completedAt ?? null,
    weeklyProgress: null
  };

  if (startDate > effectiveEndDate) {
    return emptyResult;
  }

  /*
   * DAILY and CUSTOM scheduling
   */

  if (
    habit.frequency === "DAILY" ||
    habit.frequency === "CUSTOM"
  ) {
    const scheduledDates: string[] = [];

    let cursor = DateTime.fromISO(startDate, {
      zone: timezone
    });

    const finalDate = DateTime.fromISO(
      effectiveEndDate,
      { zone: timezone }
    );

    while (cursor <= finalDate) {
      const dateString = cursor.toISODate()!;

      const isScheduled =
        habit.frequency === "DAILY" ||
        habit.customDays.includes(
          cursor.toFormat("cccc").toUpperCase() as
            typeof habit.customDays[number]
        );

      if (isScheduled) {
        scheduledDates.push(dateString);
      }

      cursor = cursor.plus({ days: 1 });
    }

    const completedScheduledDates =
      scheduledDates.filter((date) =>
        uniqueDays.has(date)
      );

    /*
     * Longest streak:
     * Consecutive scheduled opportunities
     * that were completed.
     */
    let longestStreak = 0;
    let runningStreak = 0;

    for (const date of scheduledDates) {
      if (uniqueDays.has(date)) {
        runningStreak++;

        longestStreak = Math.max(
          longestStreak,
          runningStreak
        );
      } else {
        runningStreak = 0;
      }
    }

    /*
     * Current streak:
     * If today is scheduled but has not yet
     * been completed, don't break the streak
     * until the day is over.
     */
    const currentScheduledDates = [
      ...scheduledDates
    ];

    if (
      currentScheduledDates.at(-1) === today &&
      !uniqueDays.has(today)
    ) {
      currentScheduledDates.pop();
    }

    let currentStreak = 0;

    for (
      let i = currentScheduledDates.length - 1;
      i >= 0;
      i--
    ) {
      const date = currentScheduledDates[i]!;

      if (!uniqueDays.has(date)) {
        break;
      }

      currentStreak++;
    }

    const completionRate =
      scheduledDates.length > 0
        ? Number(
            (
              (completedScheduledDates.length /
                scheduledDates.length) *
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
        completions.at(-1)?.completedAt ?? null,
      weeklyProgress: null
    };
  }

  /*
   * WEEKLY scheduling
   */

  if (
    habit.frequency === "WEEKLY" &&
    (!habit.weeklyTarget || habit.weeklyTarget < 1)
  ) {
    return emptyResult;
  }

  const weeklyTarget = habit.weeklyTarget!;

  const firstWeek = DateTime.fromISO(startDate, {
    zone: timezone
  }).startOf("week");

  const currentWeek = DateTime.fromISO(today, {
    zone: timezone
  }).startOf("week");

  const weeklyRecords: {
    weekStart: string;
    completionCount: number;
    achieved: boolean;
  }[] = [];

  let weekCursor = firstWeek;

  while (weekCursor <= currentWeek) {
    const weekStart = weekCursor.toISODate()!;

    const weekEnd = weekCursor
      .endOf("week")
      .toISODate()!;

    const completionCount = Array.from(uniqueDays)
      .filter(
        (date) =>
          date >= weekStart &&
          date <= weekEnd &&
          date >= startDate &&
          date <= effectiveEndDate
      ).length;

    weeklyRecords.push({
      weekStart,
      completionCount,
      achieved: completionCount >= weeklyTarget
    });

    weekCursor = weekCursor.plus({ weeks: 1 });
  }

  /*
   * Longest weekly streak:
   * Consecutive weeks meeting the target.
   */
  let longestStreak = 0;
  let runningStreak = 0;

  for (const week of weeklyRecords) {
    if (week.achieved) {
      runningStreak++;

      longestStreak = Math.max(
        longestStreak,
        runningStreak
      );
    } else {
      runningStreak = 0;
    }
  }

  /*
   * Current weekly streak:
   * The current week qualifies immediately
   * when its target is reached.
   *
   * Until then, an unfinished current week
   * does not break the previous streak.
   */
  let currentStreak = 0;

  const currentWeekRecord =
    weeklyRecords.at(-1);

  let streakIndex =
    weeklyRecords.length - 1;

  if (
    currentWeekRecord &&
    !currentWeekRecord.achieved
  ) {
    streakIndex--;
  }

  for (
    let i = streakIndex;
    i >= 0;
    i--
  ) {
    const week = weeklyRecords[i]!;

    if (!week.achieved) {
      break;
    }

    currentStreak++;
  }

  /*
   * Weekly completion rate:
   * Completed weekly target slots divided
   * by total weekly target slots.
   */
  const totalWeeklyTargets =
    weeklyRecords.length * weeklyTarget;

  const completedWeeklyTargets =
    weeklyRecords.reduce(
      (sum, week) =>
        sum + Math.min(
          week.completionCount,
          weeklyTarget
        ),
      0
    );

  const completionRate =
    totalWeeklyTargets > 0
      ? Number(
          (
            (completedWeeklyTargets /
              totalWeeklyTargets) *
            100
          ).toFixed(2)
        )
      : 0;

  const currentWeekCompleted =
    currentWeekRecord?.completionCount ?? 0;

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
    lastCompletedAt:
      completions.at(-1)?.completedAt ?? null,

    weeklyProgress: {
      target: weeklyTarget,
      completed: currentWeekCompleted,
      remaining: Math.max(
        0,
        weeklyTarget - currentWeekCompleted
      ),
      achieved:
        currentWeekCompleted >= weeklyTarget
    }
  };
}
