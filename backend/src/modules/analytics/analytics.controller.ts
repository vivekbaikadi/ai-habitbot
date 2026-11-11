import type {
  Request,
  Response,
  NextFunction
} from "express";

import type {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

import {
  analyticsQuerySchema
} from "./analytics.schema.js";

import {
  getAnalytics
} from "./analytics.service.js";

function getUserId(
  req: Request
): string {
  return (
    req as AuthenticatedRequest
  ).user.id;
}

export async function get(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query =
      analyticsQuerySchema.parse(
        req.query
      );

    const analytics =
      await getAnalytics(
        getUserId(req),
        query.period
      );

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
}