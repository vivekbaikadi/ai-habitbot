
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../common/errors/app.error.js";

import type {
  CreateHabitReminderInput,
  UpdateHabitReminderInput,
} from "./reminder.schema.js";

async function getOwnedHabit(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
    },
  });

  if (!habit) {
    throw new AppError(
      "Habit not found",
      404,
      "HABIT_NOT_FOUND"
    );
  }

  return habit;
}

export async function createHabitReminder(
  userId: string,
  habitId: string,
  input: CreateHabitReminderInput
) {
  await getOwnedHabit(userId, habitId);

  const existingReminder = await prisma.habitReminder.findFirst({
    where: {
      habitId,
      time: input.time,
    },
  });

  if (existingReminder) {
    throw new AppError(
      "A reminder already exists at this time",
      409,
      "REMINDER_ALREADY_EXISTS"
    );
  }

  return prisma.habitReminder.create({
    data: {
      habitId,
      time: input.time,
    },
  });
}

export async function getHabitReminders(
  userId: string,
  habitId: string
) {
  await getOwnedHabit(userId, habitId);

  return prisma.habitReminder.findMany({
    where: {
      habitId,
    },
    orderBy: {
      time: "asc",
    },
  });
}

export async function updateHabitReminder(
  userId: string,
  habitId: string,
  reminderId: string,
  input: UpdateHabitReminderInput
) {
  await getOwnedHabit(userId, habitId);

  const reminder = await prisma.habitReminder.findFirst({
    where: {
      id: reminderId,
      habitId,
    },
  });

  if (!reminder) {
    throw new AppError(
      "Reminder not found",
      404,
      "REMINDER_NOT_FOUND"
    );
  }

  if (input.time && input.time !== reminder.time) {
    const duplicate = await prisma.habitReminder.findFirst({
      where: {
        habitId,
        time: input.time,
        NOT: {
          id: reminderId,
        },
      },
    });

    if (duplicate) {
      throw new AppError(
        "A reminder already exists at this time",
        409,
        "REMINDER_ALREADY_EXISTS"
      );
    }
  }

  return prisma.habitReminder.update({
    where: {
      id: reminderId,
    },
    data: {
      ...(input.time !== undefined && {
        time: input.time,
      }),
      ...(input.isEnabled !== undefined && {
        isEnabled: input.isEnabled,
      }),
    },
  });
}

export async function deleteHabitReminder(
  userId: string,
  habitId: string,
  reminderId: string
) {
  await getOwnedHabit(userId, habitId);

  const reminder = await prisma.habitReminder.findFirst({
    where: {
      id: reminderId,
      habitId,
    },
  });

  if (!reminder) {
    throw new AppError(
      "Reminder not found",
      404,
      "REMINDER_NOT_FOUND"
    );
  }

  await prisma.habitReminder.delete({
    where: {
      id: reminderId,
    },
  });
}