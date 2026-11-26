
import type { HabitFrequency, HabitWeekday } from "@prisma/client";
import { DateTime } from "luxon";

interface HabitSchedule {
    frequency: HabitFrequency;
    customDays: HabitWeekday[];
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
}

const WEEKDAY_MAP: Record<number, HabitWeekday> = {
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
    7: "SUNDAY",
};

export function isHabitScheduledForDate(
    habit: HabitSchedule,
    localDate: string,
    timezone: string
): boolean {
    if (!habit.isActive) {
        return false;
    }

    const date = DateTime.fromISO(localDate, {
        zone: timezone,
    });

    if (!date.isValid) {
        return false;
    }

    const startDate = DateTime.fromJSDate(habit.startDate, {
        zone: timezone,
    }).startOf("day");

    const endDate = habit.endDate
        ? DateTime.fromJSDate(habit.endDate, {
            zone: timezone,
        }).startOf("day")
        : null;

    if (date.startOf("day") < startDate) {
        return false;
    }

    if (endDate && date.startOf("day") > endDate) {
        return false;
    }

    if (habit.frequency === "DAILY") {
        return true;
    }

    if (habit.frequency === "WEEKLY") {
        return true;
    }

    if (habit.frequency === "CUSTOM") {
        const weekday = WEEKDAY_MAP[date.weekday];

        if (!weekday) {
            return false;
        }

        return habit.customDays.includes(weekday);
    }

    return false;
}
