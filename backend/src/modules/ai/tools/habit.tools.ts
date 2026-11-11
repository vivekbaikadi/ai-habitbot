import { getHabitStats } from "../../completions/completion.service.js";

import { prisma } from "../../../database/prisma.js";

import { AppError } from "../../../common/errors/app.error.js";

export async function getHabitStatsTool(
  userId: string,
  habitId: string
) {
  /*
   * Verify that the habit belongs to the
   * authenticated user before returning
   * any information.
   */
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId
    },
    select: {
      id: true,
      name: true,
      targetValue: true,
      targetUnit: true,
      frequency: true,
      isActive: true
    }
  });

  if (!habit) {
    throw new AppError(
      "Habit not found",
      404,
      "HABIT_NOT_FOUND"
    );
  }

  const stats = await getHabitStats(
    userId,
    habitId
  );

  return {
    habit: {
      id: habit.id,
      name: habit.name,

      targetValue:
        habit.targetValue !== null
          ? Number(habit.targetValue)
          : null,

      targetUnit:
        habit.targetUnit,

      frequency:
        habit.frequency,

      isActive:
        habit.isActive
    },

    stats: {
      currentStreak:
        stats.currentStreak,

      longestStreak:
        stats.longestStreak,

      totalCompletions:
        stats.totalCompletions,

      completionRate:
        stats.completionRate,

      lastCompletedAt:
        stats.lastCompletedAt
    }
  };
}