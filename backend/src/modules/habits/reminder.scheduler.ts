
import cron from "node-cron";
import { DateTime } from "luxon";

import { prisma } from "../../database/prisma.js";
import { isHabitScheduledForDate } from "./habit-schedule.utils.js";
import { sendPushNotification } from "../notifications/push.service.js";

async function processHabitReminders(): Promise<void> {
  const now = new Date();

  const reminders = await prisma.habitReminder.findMany({
    where: {
      isEnabled: true,
      habit: {
        isActive: true,
      },
    },
    include: {
      habit: {
        include: {
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  timezone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  for (const reminder of reminders) {
    try {
      const { habit } = reminder;

      const timezone =
        habit.user.profile?.timezone ?? "Asia/Kolkata";

      const localNow = DateTime.fromJSDate(now, {
        zone: timezone,
      });

      if (!localNow.isValid) {
        continue;
      }

      const localTime = localNow.toFormat("HH:mm");
      const localDate = localNow.toISODate();

      if (!localDate || reminder.time !== localTime) {
        continue;
      }

      const isScheduled = isHabitScheduledForDate(
        habit,
        localDate,
        timezone
      );

      if (!isScheduled) {
        continue;
      }

      const result = await prisma.notification.createMany({
        data: [
          {
            userId: habit.user.id,
            habitId: habit.id,
            reminderId: reminder.id,
            localDate,
            type: "HABIT_REMINDER",
            title: "Habit reminder",
            message: `Time to work on: ${habit.name}`,
          },
        ],
        skipDuplicates: true,
      });

      // Send push only when a new notification is created.
      if (result.count === 1) {
        await sendPushNotification(habit.user.id, {
          title: "Habit reminder",
          message: `Time to work on: ${habit.name}`,
          url: `/habits/${habit.id}`,
        });
      }
    } catch (error) {
      console.error(
        `Failed to process reminder ${reminder.id}:`,
        error
      );
    }
  }
}

export function startReminderScheduler(): void {
  cron.schedule("* * * * *", async () => {
    try {
      await processHabitReminders();
    } catch (error) {
      console.error("Habit reminder scheduler failed:", error);
    }
  });

  console.log("Habit reminder scheduler started.");
}
