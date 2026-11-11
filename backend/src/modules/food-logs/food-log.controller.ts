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
  createFoodLogSchema,
  foodLogQuerySchema
} from "./food-log.schema.js";

import {
  createFoodLog,
  getFoodLogs,
  getFoodLogById,
  deleteFoodLog
} from "./food-log.service.js";

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest)
    .user.id;
}

function getFoodLogId(
  req: Request
): string {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(
      "Invalid food log ID",
      400,
      "INVALID_FOOD_LOG_ID"
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
    const input =
      createFoodLogSchema.parse(
        req.body
      );

    const foodLog =
      await createFoodLog(
        getUserId(req),
        input
      );

    res.status(201).json({
      success: true,
      data: {
        foodLog
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
    const query =
      foodLogQuerySchema.parse(
        req.query
      );

    const result =
      await getFoodLogs(
        getUserId(req),
        query
      );

    res.status(200).json({
      success: true,
      data: result
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
    const foodLog =
      await getFoodLogById(
        getUserId(req),
        getFoodLogId(req)
      );

    res.status(200).json({
      success: true,
      data: {
        foodLog
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
    await deleteFoodLog(
      getUserId(req),
      getFoodLogId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        message:
          "Food log deleted successfully"
      }
    });
  } catch (error) {
    next(error);
  }
}