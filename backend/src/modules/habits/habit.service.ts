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
  await getHabitById(userId, habitId);

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

      ...(input.frequency !== undefined && {
        frequency: input.frequency
      }),

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