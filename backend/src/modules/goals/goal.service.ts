import { prisma } from "../../database/prisma.js";
import { AppError } from "../../common/errors/app.error.js";

import type {
  CreateGoalInput,
  UpdateGoalInput
} from "./goal.schema.js";

export async function createGoal(
  userId: string,
  input: CreateGoalInput
) {
  return prisma.userGoal.create({
    data: {
      userId,
      title: input.title,
      ...(input.description !== undefined && {
        description: input.description
      })
    }
  });
}

export async function getGoals(userId: string) {
  return prisma.userGoal.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getGoalById(
  userId: string,
  goalId: string
) {
  const goal = await prisma.userGoal.findFirst({
    where: {
      id: goalId,
      userId
    }
  });

  if (!goal) {
    throw new AppError(
      "Goal not found",
      404,
      "GOAL_NOT_FOUND"
    );
  }

  return goal;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  input: UpdateGoalInput
) {
  await getGoalById(userId, goalId);

  return prisma.userGoal.update({
    where: {
      id: goalId
    },
    data: {
      ...(input.title !== undefined && {
        title: input.title
      }),

      ...(input.description !== undefined && {
        description: input.description
      }),

      ...(input.isActive !== undefined && {
        isActive: input.isActive
      })
    }
  });
}

export async function deleteGoal(
  userId: string,
  goalId: string
) {
  await getGoalById(userId, goalId);

  await prisma.userGoal.update({
    where: {
      id: goalId
    },
    data: {
      isActive: false
    }
  });
}