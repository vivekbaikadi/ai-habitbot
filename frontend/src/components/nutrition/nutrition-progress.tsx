
"use client";

import type {
  NutritionTotals,
  NutritionGoals,
} from "@/lib/api/nutrition";

type NutritionProgressProps = {
  totals: NutritionTotals;
  goals: NutritionGoals;
  remaining: NutritionTotals | null;
};

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: digits,
  });
}

function ProgressBar({
  consumed,
  target,
  color,
}: {
  consumed: number;
  target: number;
  color: string;
}) {
  const percentage =
    target > 0
      ? Math.min(100, Math.max(0, (consumed / target) * 100))
      : 0;

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[#eeeae2]">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function MacroProgressCard({
  label,
  consumed,
  target,
  remaining,
  color,
  dotColor,
}: {
  label: string;
  consumed: number;
  target: number | null;
  remaining: number | null;
  color: string;
  dotColor: string;
}) {
  const percentage =
    target !== null && target > 0
      ? Math.min(100, Math.max(0, (consumed / target) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <p className="text-sm font-medium text-[#77756f]">{label}</p>
      </div>

      <p className="text-2xl font-semibold tracking-tight text-[#292820]">
        {formatNumber(consumed, 1)}
        <span className="ml-1 text-sm font-normal text-[#89867f]">g</span>
      </p>

      <div className="mt-3">
        <ProgressBar
          consumed={consumed}
          target={target ?? 0}
          color={color}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#89867f]">
        <span>
          {target !== null
            ? `Target ${formatNumber(target, 1)} g`
            : "Target unavailable"}
        </span>

        {remaining !== null && (
          <span className="font-medium text-[#68665d]">
            {remaining >= 0
              ? `${formatNumber(remaining, 1)} g left`
              : `${formatNumber(Math.abs(remaining), 1)} g over`}
          </span>
        )}
      </div>

      {target !== null && (
        <p className="mt-2 text-xs font-medium text-[#77756f]">
          {formatNumber(percentage)}% of daily target
        </p>
      )}
    </div>
  );
}

export function NutritionProgress({
  totals,
  goals,
  remaining,
}: NutritionProgressProps) {
  const targets = goals.targets;

  const caloriePercentage =
    targets && targets.calories > 0
      ? Math.min(
          100,
          Math.max(0, (totals.calories / targets.calories) * 100)
        )
      : 0;

  const macroCards = [
    {
      label: "Protein",
      consumed: totals.protein,
      target: targets?.protein ?? null,
      remaining: remaining?.protein ?? null,
      color: "bg-[#7c865b]",
      dotColor: "bg-[#7c865b]",
    },
    {
      label: "Carbohydrates",
      consumed: totals.carbohydrate,
      target: targets?.carbohydrate ?? null,
      remaining: remaining?.carbohydrate ?? null,
      color: "bg-[#d3a33a]",
      dotColor: "bg-[#d3a33a]",
    },
    {
      label: "Fat",
      consumed: totals.fat,
      target: targets?.fat ?? null,
      remaining: remaining?.fat ?? null,
      color: "bg-[#7563a8]",
      dotColor: "bg-[#7563a8]",
    },
    {
      label: "Fiber",
      consumed: totals.fiber,
      target: targets?.fiber ?? null,
      remaining: remaining?.fiber ?? null,
      color: "bg-[#6585a8]",
      dotColor: "bg-[#6585a8]",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-[#f4773c] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">
              DAILY CALORIES
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {formatNumber(totals.calories)}
              <span className="ml-2 text-sm font-normal text-white/80">
                kcal consumed
              </span>
            </p>

            <p className="mt-1 text-sm text-white/80">
              {targets
                ? `Daily target: ${formatNumber(targets.calories)} kcal`
                : "Complete your nutrition profile to calculate your target."}
            </p>
          </div>

          {targets && remaining && (
            <div className="sm:text-right">
              <p className="text-sm text-white/80">
                {remaining.calories >= 0 ? "Remaining" : "Over target"}
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatNumber(Math.abs(remaining.calories))} kcal
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${caloriePercentage}%` }}
          />
        </div>

        {targets && (
          <p className="mt-2 text-xs text-white/80">
            {formatNumber(caloriePercentage)}% of daily calorie target
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {macroCards.map((macro) => (
          <MacroProgressCard key={macro.label} {...macro} />
        ))}
      </div>

      {goals.calculationNote && (
        <p className="rounded-xl bg-[#f7f5f0] px-4 py-3 text-xs leading-5 text-[#77756f]">
          {goals.calculationNote}
        </p>
      )}
    </section>
  );
}
