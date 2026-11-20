
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  completeOnboardingSchema,
  updateActivityLevelSchema,
} from "./profile.schema.js";

import {
  saveOnboardingDetails,
  saveActivityLevel,
} from "./profile.service.js";

import type {
  AuthenticatedRequest,
} from "../../common/middleware/auth.middleware.js";

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}

export async function completeOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = completeOnboardingSchema.parse(req.body);

    const user = await saveOnboardingDetails(
      getUserId(req),
      input
    );

    res.status(200).json({
      success: true,
      data: {
        user,
        message: "Onboarding completed successfully",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateActivityLevel(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = updateActivityLevelSchema.parse(req.body);

    const profile = await saveActivityLevel(
      getUserId(req),
      input
    );

    res.status(200).json({
      success: true,
      data: {
        profile,
        message: "Activity level updated successfully",
      },
    });
  } catch (error) {
    next(error);
  }
}
