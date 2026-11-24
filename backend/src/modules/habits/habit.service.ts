
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../common/errors/app.error.js";

import type {
  CreateHabitInput,
  UpdateHabitInput
} from "./habit.schema.js";

export async function createHabit(
  userId: string,
  input: CreateHabitInput
) {
  if (input.goalId) {
    const goal = await prisma.userGoal.findFirst({
      where: {
        id: input.goalId,
        userId,
        isActive: true
      }
    });

    if (!goal) {
      throw new AppError(
        "Goal not found",
        404,
        "GOAL_NOT_FOUND"
      );
    }
  }

  const weeklyTarget =
    input.frequency === "WEEKLY"
      ? input.weeklyTarget!
      : null;

  const customDays =
    input.frequency === "CUSTOM"
      ? input.customDays ?? []
      : [];

  return prisma.habit.create({
    data: {
      userId,
      name: input.name,

      ...(input.description !== undefined && {
        description: input.description
      }),

      ...(input.goalId !== undefined && {
        goalId: input.goalId
      }),

      ...(input.targetValue !== undefined && {
        targetValue: input.targetValue
      }),

      ...(input.targetUnit !== undefined && {
        targetUnit: input.targetUnit
      }),

      frequency: input.frequency,
      weeklyTarget,
      customDays,

      startDate: input.startDate,

      ...(input.endDate !== undefined && {
        endDate: input.endDate
      })
    }
  });
}

export async function getHabits(userId: string) {
  return prisma.habit.findMany({
    where: {
      userId
    },
    include: {
      goal: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getHabitById(
  userId: string,
  habitId: string
) {
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId
    },
    include: {
      goal: true
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

export async function updateHabit(
  userId: string,
  habitId: string,
  input: UpdateHabitInput
) {
  const existingHabit = await getHabitById(
    userId,
    habitId
  );

  if (input.goalId !== undefined && input.goalId !== null) {
    const goal = await prisma.userGoal.findFirst({
      where: {
        id: input.goalId,
        userId,
        isActive: true
      }
    });

    if (!goal) {
      throw new AppError(
        "Goal not found",
        404,
        "GOAL_NOT_FOUND"
      );
    }
  }

  const scheduleUpdated =
    input.frequency !== undefined ||
    input.weeklyTarget !== undefined ||
    input.customDays !== undefined;

  const nextFrequency =
    input.frequency ?? existingHabit.frequency;

  let scheduleData = {};

  if (scheduleUpdated) {
    if (nextFrequency === "DAILY") {
      scheduleData = {
        frequency: "DAILY" as const,
        weeklyTarget: null,
        customDays: []
      };
    }

    if (nextFrequency === "WEEKLY") {
      const weeklyTarget =
        input.weeklyTarget ??
        (
          existingHabit.frequency === "WEEKLY"
            ? existingHabit.weeklyTarget
            : null
        );

      if (weeklyTarget === null) {
        throw new AppError(
          "Weekly target is required for weekly habits",
          400,
          "WEEKLY_TARGET_REQUIRED"
        );
      }

      scheduleData = {
        frequency: "WEEKLY" as const,
        weeklyTarget,
        customDays: []
      };
    }

    if (nextFrequency === "CUSTOM") {
      const customDays =
        input.customDays ??
        (
          existingHabit.frequency === "CUSTOM"
            ? existingHabit.customDays
            : []
        );

      if (customDays.length === 0) {
        throw new AppError(
          "Select at least one day for custom habits",
          400,
          "CUSTOM_DAYS_REQUIRED"
        );
      }

      scheduleData = {
        frequency: "CUSTOM" as const,
        weeklyTarget: null,
        customDays
      };
    }
  }

  return prisma.habit.update({
    where: {
      id: habitId
    },
    data: {
      ...(input.name !== undefined && {
        name: input.name
      }),

      ...(input.description !== undefined && {
        description: input.description
      }),

      ...(input.goalId !== undefined && {
        goalId: input.goalId
      }),

      ...(input.targetValue !== undefined && {
        targetValue: input.targetValue
      }),

      ...(input.targetUnit !== undefined && {
        targetUnit: input.targetUnit
      }),

      ...scheduleData,

      ...(input.startDate !== undefined && {
        startDate: input.startDate
      }),

      ...(input.endDate !== undefined && {
        endDate: input.endDate
      }),

      ...(input.isActive !== undefined && {
        isActive: input.isActive
      })
    }
  });
}

export async function deleteHabit(
  userId: string,
  habitId: string
) {
  await getHabitById(userId, habitId);

  await prisma.habit.update({
    where: {
      id: habitId
    },
    data: {
      isActive: false
    }
  });
}
