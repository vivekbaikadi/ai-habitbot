import { DateTime } from "luxon";

export function getUserDayRange(
  timezone: string,
  date = new Date()
) {
  const userNow =
    DateTime.fromJSDate(date, {
      zone: timezone
    });

  const startOfDay =
    userNow
      .startOf("day")
      .toUTC()
      .toJSDate();

  const endOfDay =
    userNow
      .endOf("day")
      .toUTC()
      .toJSDate();

  return {
    userNow,
    startOfDay,
    endOfDay,
    date: userNow.toISODate()!
  };
}

export function getUserLocalDate(
  date: Date,
  timezone: string
): string {
  return DateTime
    .fromJSDate(date, {
      zone: timezone
    })
    .toISODate()!;
}

export function getUserDayDifference(
  earlierDate: string,
  laterDate: string
): number {
  const earlier =
    DateTime.fromISO(
      earlierDate,
      {
        zone: "UTC"
      }
    ).startOf("day");

  const later =
    DateTime.fromISO(
      laterDate,
      {
        zone: "UTC"
      }
    ).startOf("day");

  return Math.round(
    later.diff(
      earlier,
      "days"
    ).days
  );
}

export function getUserWeekRange(
  timezone: string,
  date = new Date()
) {
  const userNow =
    DateTime.fromJSDate(date, {
      zone: timezone
    });

  /*
   * Luxon's startOf("week") uses Monday
   * as the first day of the week.
   */
  const startOfWeek =
    userNow
      .startOf("week")
      .toUTC()
      .toJSDate();

  const endOfWeek =
    userNow
      .endOf("week")
      .toUTC()
      .toJSDate();

  return {
    userNow,
    startOfWeek,
    endOfWeek,
    startDate:
      userNow
        .startOf("week")
        .toISODate()!,
    endDate:
      userNow
        .endOf("week")
        .toISODate()!
  };
}

export function getUserMonthRange(
  timezone: string,
  date = new Date()
) {
  const userNow =
    DateTime.fromJSDate(date, {
      zone: timezone
    });

  const startOfMonth =
    userNow
      .startOf("month")
      .toUTC()
      .toJSDate();

  const endOfMonth =
    userNow
      .endOf("month")
      .toUTC()
      .toJSDate();

  return {
    userNow,
    startOfMonth,
    endOfMonth,
    startDate:
      userNow
        .startOf("month")
        .toISODate()!,
    endDate:
      userNow
        .endOf("month")
        .toISODate()!
  };
}