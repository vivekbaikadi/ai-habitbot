import type {
  Request,
  Response,
  NextFunction
} from "express";

import { AppError } from "../../common/errors/app.error.js";

import {
  createHabitSchema,
  updateHabitSchema
} from "./habit.schema.js";

import {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit
} from "./habit.service.js";

import type {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}

function getHabitId(req: Request): string {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(
      "Invalid habit ID",
      400,
      "INVALID_HABIT_ID"
    );
  }

  return id;
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = createHabitSchema.parse(req.body);

    const habit = await createHabit(
      getUserId(req),
      input
    );

    res.status(201).json({
      success: true,
      data: {
        habit
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
    const habits = await getHabits(
      getUserId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        habits
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
    const habit = await getHabitById(
      getUserId(req),
      getHabitId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        habit
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
    const input = updateHabitSchema.parse(req.body);

    const habit = await updateHabit(
      getUserId(req),
      getHabitId(req),
      input
    );

    res.status(200).json({
      success: true,
      data: {
        habit
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
    await deleteHabit(
      getUserId(req),
      getHabitId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        message: "Habit deleted successfully"
      }
    });
  } catch (error) {
    next(error);
  }
}