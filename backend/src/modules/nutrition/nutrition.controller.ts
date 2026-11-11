import type {
  Request,
  Response,
  NextFunction
} from "express";

import type {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

import {
  getTodayNutrition
} from "./nutrition.service.js";

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest)
    .user.id;
}

export async function today(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const nutrition =
      await getTodayNutrition(
        getUserId(req)
      );

    res.status(200).json({
      success: true,
      data: nutrition
    });
  } catch (error) {
    next(error);
  }
}