import type { Request, Response, NextFunction } from "express";

import {
  registerSchema,
  loginSchema
} from "./auth.schema.js";

import {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshAccessToken,
  logoutUser
} from "./auth.service.js";

import {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

import { AppError } from "../../common/errors/app.error.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);

    const result = await registerUser(
      input,
      req.get("user-agent"),
      req.ip
    );

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);

    const result = await loginUser(
      input,
      req.get("user-agent"),
      req.ip
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedRequest = req as AuthenticatedRequest;

    const user = await getCurrentUser(
      authenticatedRequest.user.id
    );

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.body?.refreshToken;

    if (
      typeof refreshToken !== "string" ||
      refreshToken.length === 0
    ) {
      throw new AppError(
        "Refresh token is required",
        400,
        "REFRESH_TOKEN_REQUIRED"
      );
    }

    const result = await refreshAccessToken(
      refreshToken,
      req.get("user-agent"),
      req.ip
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.body?.refreshToken;

    if (
      typeof refreshToken !== "string" ||
      refreshToken.length === 0
    ) {
      throw new AppError(
        "Refresh token is required",
        400,
        "REFRESH_TOKEN_REQUIRED"
      );
    }

    await logoutUser(refreshToken);

    res.status(200).json({
      success: true,
      data: {
        message: "Logged out successfully"
      }
    });
  } catch (error) {
    next(error);
  }
}