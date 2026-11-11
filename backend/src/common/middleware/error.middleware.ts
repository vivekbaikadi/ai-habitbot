import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app.error.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  console.error(error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });

    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues
      }
    });

    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred"
    }
  });
};