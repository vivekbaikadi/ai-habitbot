import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  createGoalSchema,
  updateGoalSchema
} from "./goal.schema.js";

import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal
} from "./goal.service.js";

import type {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

import { AppError } from "../../common/errors/app.error.js";

function getGoalId(req: Request): string {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(
      "Invalid goal ID",
      400,
      "INVALID_GOAL_ID"
    );
  }

  return id;
}

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = createGoalSchema.parse(req.body);

    const goal = await createGoal(
      getUserId(req),
      input
    );

    res.status(201).json({
      success: true,
      data: {
        goal
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const goals = await getGoals(getUserId(req));

    res.status(200).json({
      success: true,
      data: {
        goals
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const goal = await getGoalById(
      getUserId(req),
      getGoalId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        goal
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = updateGoalSchema.parse(req.body);

    const goal = await updateGoal(
      getUserId(req),
      getGoalId(req),
      input
    );

    res.status(200).json({
      success: true,
      data: {
        goal
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteGoal(
      getUserId(req),
      getGoalId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        message: "Goal deleted successfully"
      }
    });
  } catch (error) {
    next(error);
  }
}