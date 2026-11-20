
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  completeOnboardingSchema,
  updateActivityLevelSchema,
  updateProfileSchema,
} from "./profile.schema.js";

import {
  getUserProfile,
  updateUserProfile,
  saveOnboardingDetails,
  saveActivityLevel,
} from "./profile.service.js";

import type {
  AuthenticatedRequest,
} from "../../common/middleware/auth.middleware.js";

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}

// GET /profile
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await getUserProfile(getUserId(req));

    res.status(200).json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /profile
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = updateProfileSchema.parse(req.body);

    const profile = await updateUserProfile(
      getUserId(req),
      input
    );

    res.status(200).json({
      success: true,
      data: {
        profile,
        message: "Profile updated successfully",
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /profile/onboarding
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

// PUT /profile/activity-level
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
