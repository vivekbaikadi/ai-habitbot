"use client";

import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Beef,
  Wheat,
  Droplets,
  Salad,
} from "lucide-react";

type NutritionSummaryProps = {
  calories?: number | null;
  calorieGoal?: number | null;
  protein?: {
    current: number;
    target: number;
  };
  carbs?: {
    current: number;
    target: number;
  };
  fat?: {
    current: number;
    target: number;
  };
  fiber?: {
    current: number;
    target: number;
  };
};

export function NutritionSummary({
  calories,
  calorieGoal,
  protein,
  carbs,
  fat,
  fiber,
}: NutritionSummaryProps) {
  const hasNutritionData =
    calories !== null &&
    calories !== undefined;

  const calorieProgress =
    calories !== undefined &&
    calories !== null &&
    calorieGoal &&
    calorieGoal > 0
      ? Math.min((calories / calorieGoal) * 100, 100)
      : 0;

  return (
    <section className="habitbot-card overflow-hidden">
      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          px-4 py-4
          sm:px-5
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex
              h-9 w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#fff0e8]
              text-[#e8662f]
            "
          >
            <Apple
              className="h-[17px] w-[17px]"
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0">
            <h2
              className="
                text-base
                font-semibold
                tracking-[-0.015em]
              "
            >
              Nutrition Summary
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Your daily nutrition at a glance.
            </p>
          </div>
        </div>

        <Link
          href="/nutrition"
          className="
            flex
            shrink-0
            items-center
            gap-1
            text-xs
            font-semibold
            text-primary
            transition-colors
            hover:text-[#d95f25]
            sm:text-sm
          "
        >
          View nutrition
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="border-t border-border p-4 sm:p-5">
        {hasNutritionData ? (
          <NutritionData
            calories={calories}
            calorieGoal={calorieGoal}
            calorieProgress={calorieProgress}
            protein={protein}
            carbs={carbs}
            fat={fat}
            fiber={fiber}
          />
        ) : (
          <NutritionEmptyState />
        )}
      </div>
    </section>
  );
}

/* =========================================================
   DATA STATE
   ========================================================= */

function NutritionData({
  calories,
  calorieGoal,
  calorieProgress,
  protein,
  carbs,
  fat,
  fiber,
}: {
  calories: number | null | undefined;
  calorieGoal: number | null | undefined;
  calorieProgress: number;
  protein?: {
    current: number;
    target: number;
  };
  carbs?: {
    current: number;
    target: number;
  };
  fat?: {
    current: number;
    target: number;
  };
  fiber?: {
    current: number;
    target: number;
  };
}) {
  return (
    <div className="space-y-5">
      {/* Calories */}

      <div className="flex items-center gap-5">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[8px] border-[#eeeae3]" />

          {calorieGoal && calorieGoal > 0 && (
            <div
              className="
                absolute
                inset-0
                rounded-full
                border-[8px]
                border-primary
              "
              style={{
                clipPath: `inset(${
                  100 - calorieProgress
                }% 0 0 0)`,
              }}
            />
          )}

          <div className="relative text-center">
            <p className="text-lg font-bold tracking-[-0.03em]">
              {calories ?? "—"}
            </p>

            <p className="text-[9px] text-muted-foreground">
              kcal
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">
            Daily calories
          </p>

          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            {calorieGoal
              ? `${calories ?? 0} of ${calorieGoal} kcal`
              : "Your calorie target"}
          </p>

          {calorieGoal && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe7df]">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${calorieProgress}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Macronutrients */}

      <div className="grid grid-cols-2 gap-2">
        <MacroItem
          label="Protein"
          value={protein}
          icon={Beef}
          className="bg-[#f1edfa] text-[#675493]"
        />

        <MacroItem
          label="Carbs"
          value={carbs}
          icon={Wheat}
          className="bg-[#faf3df] text-[#b27d17]"
        />

        <MacroItem
          label="Fat"
          value={fat}
          icon={Droplets}
          className="bg-[#fff0e8] text-[#e8662f]"
        />

        <MacroItem
          label="Fiber"
          value={fiber}
          icon={Salad}
          className="bg-[#f0f2e8] text-[#687345]"
        />
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function NutritionEmptyState() {
  return (
    <div>
      <div
        className="
          flex
          items-center
          gap-4
          rounded-2xl
          bg-[#fcfaf7]
          p-4
        "
      >
        <div
          className="
            flex
            h-14 w-14
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-[#fff0e8]
            text-[#e8662f]
          "
        >
          <Apple
            className="h-6 w-6"
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Start tracking your nutrition
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Log your meals to see calories and
            nutrients here.
          </p>
        </div>
      </div>

      <Link
        href="/nutrition"
        className="
          mt-4
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          border
          border-border
          bg-card
          px-4
          py-2.5
          text-xs
          font-semibold
          text-foreground
          transition-all
          hover:border-primary/30
          hover:bg-primary-soft/40
          hover:text-primary
          active:scale-[0.99]
        "
      >
        Log your first meal
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* =========================================================
   MACRO ITEM
   ========================================================= */

function MacroItem({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value?: {
    current: number;
    target: number;
  };
  icon: typeof Beef;
  className: string;
}) {
  const percentage =
    value && value.target > 0
      ? Math.min(
          Math.round(
            (value.current / value.target) * 100
          ),
          100
        )
      : 0;

  return (
    <div className="rounded-xl border border-border bg-[#fffdfa] p-2.5">
      <div className="flex items-center gap-2">
        <div
          className={`
            flex
            h-7 w-7
            shrink-0
            items-center
            justify-center
            rounded-lg
            ${className}
          `}
        >
          <Icon
            className="h-3.5 w-3.5"
            strokeWidth={2}
          />
        </div>

        <span className="truncate text-[10px] font-medium text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-xs font-semibold">
          {value
            ? `${value.current}g`
            : "—"}
        </span>

        {value && (
          <span className="text-[9px] text-muted-foreground">
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}