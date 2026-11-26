
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../common/errors/app.error.js";

import type {
  AuthenticatedRequest
} from "../../common/middleware/auth.middleware.js";

import {
  createHabitReminder,
  getHabitReminders,
  updateHabitReminder,
  deleteHabitReminder,
} from "./reminder.service.js";

import {
  createHabitReminderSchema,
  updateHabitReminderSchema,
} from "./reminder.schema.js";

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}

function getHabitId(req: Request): string {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(
      "Invalid habit ID",
      400,
      "INVALID_HABIT_ID"
    );
  }

  return id;
}

function getReminderId(req: Request): string {
  const { reminderId } = req.params;

  if (!reminderId || Array.isArray(reminderId)) {
    throw new AppError(
      "Invalid reminder ID",
      400,
      "INVALID_REMINDER_ID"
    );
  }

  return reminderId;
}

export async function createReminder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = createHabitReminderSchema.parse(req.body);

    const reminder = await createHabitReminder(
      getUserId(req),
      getHabitId(req),
      input
    );

    return res.status(201).json({
      success: true,
      data: { reminder },
    });
  } catch (error) {
    next(error);
  }
}

export async function listReminders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const reminders = await getHabitReminders(
      getUserId(req),
      getHabitId(req)
    );

    return res.status(200).json({
      success: true,
      data: { reminders },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReminder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = updateHabitReminderSchema.parse(req.body);

    const reminder = await updateHabitReminder(
      getUserId(req),
      getHabitId(req),
      getReminderId(req),
      input
    );

    return res.status(200).json({
      success: true,
      data: { reminder },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeReminder(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteHabitReminder(
      getUserId(req),
      getHabitId(req),
      getReminderId(req)
    );

    return res.status(200).json({
      success: true,
      data: {
        message: "Reminder deleted successfully",
      },
    });
  } catch (error) {
    next(error);
  }
}
