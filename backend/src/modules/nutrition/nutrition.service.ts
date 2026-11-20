
import { prisma } from "../../database/prisma.js";

import {
  getUserDayRange,
} from "../../common/utils/date.utils.js";

type NutritionValues = {
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber: number;
};

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculateAge(
  dateOfBirth: Date,
  currentDate: string
): number {
  const [year, month, day] = currentDate
    .split("-")
    .map(Number);

  const birthYear = dateOfBirth.getUTCFullYear();
  const birthMonth = dateOfBirth.getUTCMonth() + 1;
  const birthDay = dateOfBirth.getUTCDate();

  let age = year! - birthYear;

  if (
    month! < birthMonth ||
    (month === birthMonth && day! < birthDay)
  ) {
    age--;
  }

  return age;
}

function calculateNutritionTargets(profile: {
  dateOfBirth: Date | null;
  sex: string | null;
  heightCm: unknown;
  weightKg: unknown;
  primaryGoal: string | null;
  activityLevel: string | null;
}, currentDate: string) {
  const missingFields: string[] = [];

  if (!profile.dateOfBirth) {
    missingFields.push("dateOfBirth");
  }

  if (!profile.sex) {
    missingFields.push("sex");
  }

  if (profile.heightCm === null) {
    missingFields.push("heightCm");
  }

  if (profile.weightKg === null) {
    missingFields.push("weightKg");
  }

  if (!profile.primaryGoal) {
    missingFields.push("primaryGoal");
  }

  if (!profile.activityLevel) {
    missingFields.push("activityLevel");
  }

  if (missingFields.length > 0) {
    return {
      isAvailable: false,
      missingFields,
      targets: null,
      calculationNote: null,
    };
  }

  const age = calculateAge(
    profile.dateOfBirth!,
    currentDate
  );

  if (age < 18 || age > 120) {
    return {
      isAvailable: false,
      missingFields: [],
      targets: null,
      calculationNote:
        "The current nutrition calculation is designed for adults aged 18 and above.",
    };
  }

  const heightCm = Number(profile.heightCm);
  const weightKg = Number(profile.weightKg);

  const sexCoefficient =
    profile.sex === "MALE"
      ? 5
      : profile.sex === "FEMALE"
        ? -161
        : -78;

  const activityMultipliers: Record<string, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    VERY_ACTIVE: 1.725,
    EXTRA_ACTIVE: 1.9,
  };

  const activityMultiplier =
    activityMultipliers[profile.activityLevel!]!;

  // Mifflin-St Jeor equation.
  const bmr =
    10 * weightKg +
    6.25 * heightCm -
    5 * age +
    sexCoefficient;

  const maintenanceCalories =
    bmr * activityMultiplier;

  const calorieAdjustments: Record<string, number> = {
    WEIGHT_LOSS: -400,
    WEIGHT_MAINTENANCE: 0,
    MUSCLE_GAIN: 250,
    GENERAL_HEALTH: 0,
  };

  const calorieTarget = Math.round(
    maintenanceCalories +
    calorieAdjustments[profile.primaryGoal!]!
  );

  const proteinMultipliers: Record<string, number> = {
    WEIGHT_LOSS: 1.8,
    WEIGHT_MAINTENANCE: 1.4,
    MUSCLE_GAIN: 1.8,
    GENERAL_HEALTH: 1.4,
  };

  const proteinTarget = round(
    weightKg * proteinMultipliers[profile.primaryGoal!]!
  );

  const fatTarget = round(
    (calorieTarget * 0.3) / 9
  );

  const carbohydrateTarget = round(
    Math.max(
      0,
      (
        calorieTarget -
        proteinTarget * 4 -
        fatTarget * 9
      ) / 4
    )
  );

  const fiberTarget = Math.round(
    (calorieTarget / 1000) * 14
  );

  const targets: NutritionValues = {
    calories: calorieTarget,
    protein: proteinTarget,
    carbohydrate: carbohydrateTarget,
    fat: fatTarget,
    fiber: fiberTarget,
  };

  return {
    isAvailable: true,
    missingFields: [],
    targets,
    calculationNote:
      profile.sex === "MALE" ||
      profile.sex === "FEMALE"
        ? null
        : "Estimated using the midpoint of the male and female Mifflin-St Jeor coefficients.",
  };
}

export async function getTodayNutrition(
  userId: string
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      profile: {
        select: {
          timezone: true,
          dateOfBirth: true,
          sex: true,
          heightCm: true,
          weightKg: true,
          primaryGoal: true,
          activityLevel: true,
        },
      },
    },
  });

  const timezone =
    user?.profile?.timezone ?? "Asia/Kolkata";

  const {
    startOfDay,
    endOfDay,
    date,
  } = getUserDayRange(timezone);

  const logs = await prisma.foodLog.findMany({
    where: {
      userId,

      eatenAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },

    include: {
      items: {
        include: {
          food: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },

    orderBy: {
      eatenAt: "asc",
    },
  });

  const totals: NutritionValues = {
    calories: 0,
    protein: 0,
    carbohydrate: 0,
    fat: 0,
    fiber: 0,
  };

  for (const log of logs) {
    for (const item of log.items) {
      totals.calories += Number(item.calories ?? 0);
      totals.protein += Number(item.protein ?? 0);
      totals.carbohydrate += Number(
        item.carbohydrate ?? 0
      );
      totals.fat += Number(item.fat ?? 0);
      totals.fiber += Number(item.fiber ?? 0);
    }
  }

  const meals = logs.map((log) => {
    const mealTotals: NutritionValues = {
      calories: 0,
      protein: 0,
      carbohydrate: 0,
      fat: 0,
      fiber: 0,
    };

    for (const item of log.items) {
      mealTotals.calories += Number(item.calories ?? 0);
      mealTotals.protein += Number(item.protein ?? 0);
      mealTotals.carbohydrate += Number(
        item.carbohydrate ?? 0
      );
      mealTotals.fat += Number(item.fat ?? 0);
      mealTotals.fiber += Number(item.fiber ?? 0);
    }

    return {
      id: log.id,
      mealType: log.mealType,
      eatenAt: log.eatenAt,

      totals: mealTotals,

      items: log.items.map((item) => ({
        id: item.id,
        foodId: item.foodId,
        foodName: item.food.name,

        quantity: Number(item.quantity),
        unit: item.unit,
        grams: Number(item.grams),

        calories: Number(item.calories ?? 0),
        protein: Number(item.protein ?? 0),
        carbohydrate: Number(item.carbohydrate ?? 0),
        fat: Number(item.fat ?? 0),
        fiber: Number(item.fiber ?? 0),
      })),
    };
  });

  const nutritionGoals = user?.profile
    ? calculateNutritionTargets(
        user.profile,
        date
      )
    : {
        isAvailable: false,
        missingFields: [
          "dateOfBirth",
          "sex",
          "heightCm",
          "weightKg",
          "primaryGoal",
          "activityLevel",
        ],
        targets: null,
        calculationNote: null,
      };

  const remaining = nutritionGoals.targets
    ? {
        calories: round(
          nutritionGoals.targets.calories - totals.calories
        ),
        protein: round(
          nutritionGoals.targets.protein - totals.protein
        ),
        carbohydrate: round(
          nutritionGoals.targets.carbohydrate -
          totals.carbohydrate
        ),
        fat: round(
          nutritionGoals.targets.fat - totals.fat
        ),
        fiber: round(
          nutritionGoals.targets.fiber - totals.fiber
        ),
      }
    : null;

  return {
    date,
    totals,
    meals,

    goals: nutritionGoals,
    remaining,
  };
}
