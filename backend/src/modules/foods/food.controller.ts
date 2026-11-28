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
  foodQuerySchema,
  foodHistoryQuerySchema
} from "./food.schema.js";

import {
  searchFoods,
  getFoodById,
  getRecentFoods,
  getFrequentFoods
} from "./food.service.js";

function getFoodId(req: Request): string {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(
      "Invalid food ID",
      400,
      "INVALID_FOOD_ID"
    );
  }

  return id;
}

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = foodQuerySchema.parse(
      req.query
    );

    const result = await searchFoods(query);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function recent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { limit } = foodHistoryQuerySchema.parse(
      req.query
    );

    const userId = (req as AuthenticatedRequest).user.id;

    const foods = await getRecentFoods(
      userId,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        foods
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function frequent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { limit } = foodHistoryQuerySchema.parse(
      req.query
    );

    const userId = (req as AuthenticatedRequest).user.id;

    const foods = await getFrequentFoods(
      userId,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        foods
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
    const food = await getFoodById(
      getFoodId(req)
    );

    res.status(200).json({
      success: true,
      data: {
        food
      }
    });
  } catch (error) {
    next(error);
  }
}