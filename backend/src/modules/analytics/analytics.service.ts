import { prisma } from "../../database/prisma.js";
import {
  getUserDayRange,
  getUserWeekRange,
  getUserMonthRange,
  getUserLocalDate,
  getUserDayDifference
} from "../../common/utils/date.utils.js";

import { AppError } from "../../common/errors/app.error.js";

type AnalyticsPeriod =
  | "today"
  | "week"
  | "month";

function round(
  value: number,
  decimals = 2
): number {
  return Number(
    value.toFixed(decimals)
  );
}

export async function getAnalytics(
  userId: string,
  period: AnalyticsPeriod
) {
  /*
   * Get the user's timezone.
   */
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      profile: {
        select: {
          timezone: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError(
      "User not found",
      404,
      "USER_NOT_FOUND"
    );
  }

  const timezone =
    user.profile?.timezone ??
    "Asia/Kolkata";

  const now = new Date();

  /*
   * Determine the requested date range
   * in the user's timezone.
   */
  let startDate: Date;
  let endDate: Date;
  let localStartDate: string;
  let localEndDate: string;

  if (period === "today") {
    const range =
      getUserDayRange(
        timezone,
        now
      );

    startDate =
      range.startOfDay;

    endDate =
      range.endOfDay;

    localStartDate =
      range.date;

    localEndDate =
      range.date;
  } else if (period === "week") {
    const range =
      getUserWeekRange(
        timezone,
        now
      );

    startDate =
      range.startOfWeek;

    endDate =
      range.endOfWeek;

    localStartDate =
      range.startDate;

    localEndDate =
      range.endDate;
  } else {
    const range =
      getUserMonthRange(
        timezone,
        now
      );

    startDate =
      range.startOfMonth;

    endDate =
      range.endOfMonth;

    localStartDate =
      range.startDate;

    localEndDate =
      range.endDate;
  }

  /*
   * Load active habits and their completions.
   */
  const habits =
    await prisma.habit.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        completions: {
          where: {
            completedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            completedAt: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

  /*
   * Load nutrition logs for the
   * requested period.
   */
  const foodLogs =
    await prisma.foodLog.findMany({
      where: {
        userId,
        eatenAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: true
      },
      orderBy: {
        eatenAt: "asc"
      }
    });

  /*
   * ----------------------------------------
   * HABIT ANALYTICS
   * ----------------------------------------
   */

  let expectedHabitDays = 0;
  let completedHabitDays = 0;

  const habitAnalytics =
    habits.map((habit) => {
      /*
       * Convert completion timestamps into
       * the user's local calendar dates.
       */
      const completionDays =
        new Set(
          habit.completions.map(
            (completion) =>
              getUserLocalDate(
                completion.completedAt,
                timezone
              )
          )
        );

      let expectedDays = 0;

      /*
       * DAILY habits are expected every day
       * during the intersection of:
       *
       * habit dates
       * analytics period
       */
      if (habit.frequency === "DAILY") {
        const habitStart =
          getUserLocalDate(
            habit.startDate,
            timezone
          );

        const habitEnd =
          habit.endDate
            ? getUserLocalDate(
                habit.endDate,
                timezone
              )
            : localEndDate;

        const effectiveStart =
          habitStart > localStartDate
            ? habitStart
            : localStartDate;

        const effectiveEnd =
          habitEnd < localEndDate
            ? habitEnd
            : localEndDate;

        if (
          effectiveStart <=
          effectiveEnd
        ) {
          expectedDays =
            getUserDayDifference(
              effectiveStart,
              effectiveEnd
            ) + 1;
        }
      } else {
        /*
         * WEEKLY and CUSTOM scheduling does not
         * currently contain enough scheduling
         * information in the Prisma schema to
         * determine exact expected dates.
         *
         * We therefore use actual completion
         * days for these frequencies rather than
         * inventing an expected schedule.
         */
        expectedDays =
          completionDays.size;
      }

      const completedDays =
        completionDays.size;

      expectedHabitDays +=
        expectedDays;

      completedHabitDays +=
        Math.min(
          completedDays,
          expectedDays
        );

      const completionRate =
        expectedDays > 0
          ? round(
              (Math.min(
                completedDays,
                expectedDays
              ) /
                expectedDays) *
                100
            )
          : 0;

      const totalValue =
        habit.completions.reduce(
          (sum, completion) =>
            sum +
            Number(
              completion.value ?? 0
            ),
          0
        );

      return {
        id: habit.id,
        name: habit.name,
        frequency:
          habit.frequency,
        targetValue:
          habit.targetValue !== null
            ? Number(
                habit.targetValue
              )
            : null,
        targetUnit:
          habit.targetUnit,

        expectedDays,
        completedDays,
        completionRate,

        totalValue:

          round(totalValue),

        lastCompletedAt:
          habit.completions.at(-1)
            ?.completedAt ?? null
      };
    });

  const habitCompletionRate =
    expectedHabitDays > 0
      ? round(
          (completedHabitDays /
            expectedHabitDays) *
            100
        )
      : 0;

  /*
   * ----------------------------------------
   * NUTRITION ANALYTICS
   * ----------------------------------------
   */

  const nutritionTotals = {
    calories: 0,
    protein: 0,
    carbohydrate: 0,
    fat: 0,
    fiber: 0
  };

  for (const log of foodLogs) {
    for (const item of log.items) {
      nutritionTotals.calories +=
        Number(
          item.calories ?? 0
        );

      nutritionTotals.protein +=
        Number(
          item.protein ?? 0
        );

      nutritionTotals.carbohydrate +=
        Number(
          item.carbohydrate ?? 0
        );

      nutritionTotals.fat +=
        Number(
          item.fat ?? 0
        );

      nutritionTotals.fiber +=
        Number(
          item.fiber ?? 0
        );
    }
  }

  /*
   * ----------------------------------------
   * DAILY BREAKDOWN
   * ----------------------------------------
   */

  const dailyMap = new Map<
    string,
    {
      habitsCompleted: number;
      habitsExpected: number;
      calories: number;
      protein: number;
      carbohydrate: number;
      fat: number;
      fiber: number;
    }
  >();

  /*
   * Create every calendar day in the
   * requested period.
   */
  let cursor = localStartDate;

  while (
    cursor <= localEndDate
  ) {
    dailyMap.set(
      cursor,
      {
        habitsCompleted: 0,
        habitsExpected: 0,
        calories: 0,
        protein: 0,
        carbohydrate: 0,
        fat: 0,
        fiber: 0
      }
    );

    const nextDay =
      new Date(
        `${cursor}T00:00:00.000Z`
      );

    nextDay.setUTCDate(
      nextDay.getUTCDate() + 1
    );

    cursor =
      nextDay
        .toISOString()
        .slice(0, 10);
  }

  /*
   * Populate habit daily data.
   */
  for (const habit of habits) {
    const completionDays =
      new Set(
        habit.completions.map(
          (completion) =>
            getUserLocalDate(
              completion.completedAt,
              timezone
            )
        )
      );

    for (const [
      date,
      daily
    ] of dailyMap) {
      let expected = false;

      if (
        habit.frequency ===
        "DAILY"
      ) {
        const habitStart =
          getUserLocalDate(
            habit.startDate,
            timezone
          );

        const habitEnd =
          habit.endDate
            ? getUserLocalDate(
                habit.endDate,
                timezone
              )
            : null;

        expected =
          date >= habitStart &&
          (!habitEnd ||
            date <= habitEnd);
      }

      if (expected) {
        daily.habitsExpected++;
      }

      if (
        completionDays.has(date)
      ) {
        daily.habitsCompleted++;
      }
    }
  }

  /*
   * Populate daily nutrition data.
   */
  for (const log of foodLogs) {
    const date =
      getUserLocalDate(
        log.eatenAt,
        timezone
      );

    const daily =
      dailyMap.get(date);

    if (!daily) {
      continue;
    }

    for (const item of log.items) {
      daily.calories +=
        Number(
          item.calories ?? 0
        );

      daily.protein +=
        Number(
          item.protein ?? 0
        );

      daily.carbohydrate +=
        Number(
          item.carbohydrate ?? 0
        );

      daily.fat +=
        Number(
          item.fat ?? 0
        );

      daily.fiber +=
        Number(
          item.fiber ?? 0
        );
    }
  }

  const daily = Array.from(
    dailyMap.entries()
  ).map(
    ([
      date,
      data
    ]) => ({
      date,

      habitsCompleted:
        data.habitsCompleted,

      habitsExpected:
        data.habitsExpected,

      habitCompletionRate:
        data.habitsExpected > 0
          ? round(
              (data.habitsCompleted /
                data.habitsExpected) *
                100
            )
          : 0,

      nutrition: {
        calories:
          round(data.calories),

        protein:
          round(data.protein),

        carbohydrate:
          round(
            data.carbohydrate
          ),

        fat:
          round(data.fat),

        fiber:
          round(data.fiber)
      }
    })
  );

  /*
   * Calculate average daily nutrition.
   */
  const numberOfDays =
    daily.length;

  const averageDailyNutrition =
    numberOfDays > 0
      ? {
          calories:
            round(
              nutritionTotals.calories /
                numberOfDays
            ),

          protein:
            round(
              nutritionTotals.protein /
                numberOfDays
            ),

          carbohydrate:
            round(
              nutritionTotals.carbohydrate /
                numberOfDays
            ),

          fat:
            round(
              nutritionTotals.fat /
                numberOfDays
            ),

          fiber:
            round(
              nutritionTotals.fiber /
                numberOfDays
            )
        }
      : {
          calories: 0,
          protein: 0,
          carbohydrate: 0,
          fat: 0,
          fiber: 0
        };

  return {
    period,

    dateRange: {
      start: localStartDate,
      end: localEndDate,
      timezone
    },

    habits: {
      total: habits.length,
      expected: expectedHabitDays,
      completed: completedHabitDays,
      pending:
        Math.max(
          expectedHabitDays -
            completedHabitDays,
          0
        ),
      completionRate:
        habitCompletionRate,

      byHabit:
        habitAnalytics
    },

    nutrition: {
      totals: {
        calories:
          round(
            nutritionTotals.calories
          ),

        protein:
          round(
            nutritionTotals.protein
          ),

        carbohydrate:
          round(
            nutritionTotals.carbohydrate
          ),

        fat:
          round(
            nutritionTotals.fat
          ),

        fiber:
          round(
            nutritionTotals.fiber
          )
      },

      averageDaily:
        averageDailyNutrition,

      mealsLogged:
        foodLogs.length
    },

    daily
  };
}