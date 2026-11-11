import type {
  Request,
  Response,
  NextFunction
} from "express";

import type {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

import {
  buildAIUserContext
} from "./ai-context.service.js";

function getUserId(
  req: Request
): string {
  return (
    req as AuthenticatedRequest
  ).user.id;
}

export async function getContext(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const context =
      await buildAIUserContext(
        getUserId(req)
      );

    res.status(200).json({
      success: true,
      data: {
        context
      }
    });
  } catch (error) {
    next(error);
  }
}