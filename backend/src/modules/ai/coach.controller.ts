import type {
  Request,
  Response,
  NextFunction
} from "express";

import type {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

import {
  coachRequestSchema
} from "./coach.schema.js";

import {
  generateCoachResponse
} from "./coach.service.js";

function getUserId(
  req: Request
): string {
  return (
    req as AuthenticatedRequest
  ).user.id;
}

export async function coach(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input =
      coachRequestSchema.parse(
        req.body
      );

    const response =
      await generateCoachResponse(
        getUserId(req),
        input
      );

    res.status(200).json({
      success: true,
      data: {
        response
      }
    });
  } catch (error) {
    next(error);
  }
}