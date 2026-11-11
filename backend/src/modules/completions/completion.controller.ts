import type {
  Request,
  Response,
  NextFunction
} from "express";

import { AppError } from "../../common/errors/app.error.js";

import type {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

import {
  createCompletionSchema,
  completionQuerySchema
} from "./completion.schema.js";

import {
  createCompletion,
  getCompletions,
  getHabitStats
} from "./completion.service.js";




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
    const input = createCompletionSchema.parse(
      req.body
    );

    const completion = await createCompletion(
      getUserId(req),
      getHabitId(req),
      input
    );

    res.status(201).json({
      success: true,
      data: {
        completion
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
    const query = completionQuerySchema.parse(
      req.query
    );

    const completions = await getCompletions(
      getUserId(req),
      getHabitId(req),
      query
    );

    res.status(200).json({
      success: true,
      data: {
        completions
      }
    });
  } catch (error) {
    next(error);
  }
}
export async function stats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const habitStats = await getHabitStats(
      getUserId(req),
      getHabitId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        stats: habitStats
      }
    });
  } catch (error) {
    next(error);
  }
}