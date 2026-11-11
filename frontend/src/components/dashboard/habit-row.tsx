"use client";

import {
  Check,
  Circle,
  Flame,
  MoreVertical,
} from "lucide-react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";

import type { DashboardHabit } from "@/lib/api/dashboard";
import { createHabitCompletion } from "@/lib/api/completions";

type HabitRowProps = {
  habit: DashboardHabit;
};

export function HabitRow({
  habit,
}: HabitRowProps) {
  const queryClient = useQueryClient();

  const [showAmountForm, setShowAmountForm] =
    useState(false);

  const [amount, setAmount] = useState("");

  const completed = habit.today.completed;

  const target =
    habit.targetValue !== null
      ? Number(habit.targetValue)
      : null;

  const current = habit.today.value ?? 0;

  const isMeasurable = target !== null;

  const remaining =
    target !== null
      ? Math.max(target - current, 0)
      : 0;

  const progress =
    target !== null && target > 0
      ? Math.min(
          (current / target) * 100,
          100
        )
      : completed
        ? 100
        : 0;

  const category =
    getHabitCategory(habit);

  const completionMutation =
    useMutation({
      mutationFn: (value?: number) =>
        createHabitCompletion(
          habit.id,
          {
            completedAt:
              new Date().toISOString(),

            ...(value !== undefined && {
              value,
            }),
          }
        ),

      onSuccess: () => {
        setAmount("");
        setShowAmountForm(false);

        queryClient.invalidateQueries({
          queryKey: [
            "dashboard",
            "today",
          ],
        });
      },
    });

  const handleComplete = () => {
    if (
      completed ||
      completionMutation.isPending
    ) {
      return;
    }

    completionMutation.mutate();
  };

  const handleAmountSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      completionMutation.isPending ||
      remaining <= 0
    ) {
      return;
    }

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    if (value > remaining) {
      return;
    }

    completionMutation.mutate(value);
  };

  const handleAmountChange = (
    value: string
  ) => {
    if (value === "") {
      setAmount("");
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    if (numericValue > remaining) {
      setAmount(
        remaining.toString()
      );
      return;
    }

    setAmount(value);
  };

  return (
    <div
      className="
        group
        border-b
        border-border
        px-4
        py-4
        transition-colors
        duration-200
        last:border-b-0
        hover:bg-[#fcfaf7]
        sm:px-5
      "
    >
      {/* =====================================================
          MAIN HABIT ROW
          ===================================================== */}

      <div
        className="
          flex
          items-start
          gap-3
          sm:items-center
          sm:gap-4
        "
      >
        {/* =====================================================
            COMPLETION / ADD PROGRESS BUTTON
            ===================================================== */}

        <button
          type="button"
          onClick={
            isMeasurable
              ? () => {
                  if (
                    completed ||
                    completionMutation.isPending
                  ) {
                    return;
                  }

                  setShowAmountForm(
                    (previous) =>
                      !previous
                  );
                }
              : handleComplete
          }
          disabled={
            completed ||
            completionMutation.isPending
          }
          aria-label={
            completed
              ? `Completed: ${habit.name}`
              : isMeasurable
                ? `Add progress for ${habit.name}`
                : `Mark ${habit.name} as complete`
          }
          aria-expanded={
            isMeasurable
              ? showAmountForm
              : undefined
          }
          aria-busy={
            completionMutation.isPending
          }
          className={`
            flex
            h-10
            w-10
            shrink-0
            cursor-pointer
            items-center
            justify-center
            rounded-full
            border-2
            transition-all
            duration-200
            active:scale-95

            ${
              completed
                ? "border-[#5d8a45] bg-[#5d8a45] text-white shadow-[0_3px_10px_rgba(93,138,69,0.18)]"
                : "border-[#ddd7ce] bg-[#fffdfa] text-primary hover:border-primary hover:bg-primary-soft hover:shadow-[0_3px_10px_rgba(244,119,60,0.10)]"
            }

            ${
              completionMutation.isPending
                ? "cursor-wait opacity-60"
                : ""
            }

            ${
              completed
                ? "cursor-default"
                : ""
            }
          `}
        >
          {completed ? (
            <Check
              className="h-[18px] w-[18px]"
              strokeWidth={2.6}
            />
          ) : isMeasurable ? (
            <span
              className="
                text-lg
                font-medium
                leading-none
              "
            >
              +
            </span>
          ) : (
            <Circle
              className="h-[15px] w-[15px]"
              strokeWidth={1.5}
            />
          )}
        </button>

        {/* =====================================================
            HABIT INFORMATION
            ===================================================== */}

        <div className="min-w-0 flex-1">
          <div
            className="
              flex
              min-w-0
              items-center
              gap-2
            "
          >
            <h3
              className={`
                min-w-0
                truncate
                text-sm
                font-semibold
                tracking-[-0.01em]

                ${
                  completed
                    ? "text-muted-foreground line-through decoration-[#b9b4ab]"
                    : "text-foreground"
                }
              `}
            >
              {habit.name}
            </h3>

            {habit.today.completionCount >
              1 && (
              <span
                className="
                  inline-flex
                  shrink-0
                  items-center
                  gap-1
                  rounded-full
                  bg-[#fff0e8]
                  px-1.5
                  py-0.5
                  text-[9px]
                  font-semibold
                  text-[#d95f25]
                "
              >
                <Flame
                  className="h-2.5 w-2.5"
                  fill="currentColor"
                  strokeWidth={1.8}
                />

                {habit.today.completionCount}
              </span>
            )}
          </div>

          <p
            className="
              mt-1
              truncate
              text-xs
              leading-5
              text-muted-foreground
            "
          >
            {habit.description ||
              `${habit.frequency} habit`}
          </p>

          {/* Mobile target information */}

          <div
            className="
              mt-2
              flex
              items-center
              gap-2
              sm:hidden
            "
          >
            <span
              className={`
                rounded-md
                px-2
                py-1
                text-[9px]
                font-medium
                ${getCategoryStyle(category)}
              `}
            >
              {category}
            </span>

            <span
              className="
                text-[10px]
                text-muted-foreground
              "
            >
              {target !== null
                ? `${formatValue(
                    current
                  )} / ${formatValue(
                    target
                  )}${
                    habit.targetUnit
                      ? ` ${habit.targetUnit}`
                      : ""
                  }`
                : completed
                  ? "Completed"
                  : "Not started"}
            </span>
          </div>
        </div>

        {/* =====================================================
            DESKTOP CATEGORY
            ===================================================== */}

        <span
          className={`
            hidden
            shrink-0
            rounded-lg
            px-2.5
            py-1.5
            text-[10px]
            font-medium
            sm:inline-flex
            ${getCategoryStyle(category)}
          `}
        >
          {category}
        </span>

        {/* =====================================================
            DESKTOP PROGRESS
            ===================================================== */}

        <div
          className="
            hidden
            w-[180px]
            shrink-0
            sm:block
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-2
            "
          >
            <span
              className="
                truncate
                text-[11px]
                font-medium
                text-foreground
              "
            >
              {target !== null
                ? `${formatValue(
                    current
                  )} / ${formatValue(
                    target
                  )}${
                    habit.targetUnit
                      ? ` ${habit.targetUnit}`
                      : ""
                  }`
                : completed
                  ? "Completed"
                  : "Not started"}
            </span>

            <span
              className="
                shrink-0
                text-[10px]
                font-medium
                text-muted-foreground
              "
            >
              {Math.round(progress)}%
            </span>
          </div>

          <div
            className="
              mt-1.5
              h-1.5
              overflow-hidden
              rounded-full
              bg-[#ebe7df]
            "
          >
            <div
              className={`
                h-full
                rounded-full
                transition-all
                duration-500

                ${
                  completed
                    ? "bg-[#5d8a45]"
                    : "bg-primary"
                }
              `}
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* =====================================================
            STATUS
            ===================================================== */}

        <span
          className={`
            hidden
            shrink-0
            rounded-full
            px-2.5
            py-1.5
            text-[10px]
            font-semibold
            sm:inline-flex

            ${
              completed
                ? "bg-[#edf5e9] text-[#557d40]"
                : "bg-[#fff0e8] text-[#d95f25]"
            }
          `}
        >
          {completed
            ? "Completed"
            : "Pending"}
        </span>

        {/* =====================================================
            MORE OPTIONS
            ===================================================== */}

        <button
          type="button"
          aria-label={`Options for ${habit.name}`}
          className="
            -mr-1
            cursor-pointer
            rounded-lg
            p-1.5
            text-muted-foreground
            transition-all
            duration-200
            hover:bg-muted
            hover:text-foreground
            active:scale-95
          "
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* =======================================================
          MEASURABLE HABIT AMOUNT FORM
          ======================================================= */}

      {isMeasurable &&
        showAmountForm &&
        !completed && (
          <form
            onSubmit={handleAmountSubmit}
            className="
              mt-3
              ml-[52px]
              rounded-xl
              border
              border-[#e6dfd6]
              bg-[#fffdfa]
              p-4
              shadow-[0_4px_16px_rgba(58,48,36,0.05)]
              sm:ml-[56px]
            "
          >
            {/* Header */}

            <div
              className="
                flex
                items-start
                justify-between
                gap-3
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-semibold
                    text-foreground
                  "
                >
                  Add progress
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-muted-foreground
                  "
                >
                  Current:{" "}
                  <span
                    className="
                      font-medium
                      text-foreground
                    "
                  >
                    {formatValue(
                      current
                    )}{" "}
                    {habit.targetUnit ??
                      ""}
                  </span>
                </p>
              </div>

              <span
                className="
                  shrink-0
                  rounded-full
                  bg-[#f5f1eb]
                  px-2.5
                  py-1
                  text-[10px]
                  font-medium
                  text-muted-foreground
                "
              >
                {formatValue(
                  remaining
                )}{" "}
                {habit.targetUnit ??
                  ""}{" "}
                remaining
              </span>
            </div>

            {/* Amount field */}

            <div className="mt-4">
              <label
                htmlFor={`amount-${habit.id}`}
                className="
                  mb-1.5
                  block
                  text-[10px]
                  font-medium
                  text-muted-foreground
                "
              >
                Amount to add
              </label>

              <div
                className="
                  relative
                  flex
                  h-11
                  w-full
                  items-center
                  rounded-lg
                  border
                  border-[#ddd7ce]
                  bg-white
                  transition-colors
                  focus-within:border-[#cfc7bc]
                "
              >
                <input
                  id={`amount-${habit.id}`}
                  type="number"
                  min="0"
                  max={remaining}
                  step="any"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) =>
                    handleAmountChange(
                      event.target.value
                    )
                  }
                  placeholder="Enter amount"
                  autoFocus
                  disabled={
                    completionMutation.isPending
                  }
                  className="
                    h-full
                    w-full
                    min-w-0
                    rounded-lg
                    border-0
                    bg-transparent
                    px-3
                    pr-20
                    text-sm
                    font-medium
                    text-foreground
                    outline-none
                    focus:border-0
                    focus:outline-none
                    focus:ring-0
                    placeholder:text-[#b8b1a7]
                  "
                />

                {habit.targetUnit && (
                  <span
                    className="
                      pointer-events-none
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      select-none
                      text-xs
                      font-medium
                      text-muted-foreground
                    "
                  >
                    {habit.targetUnit}
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}

            <div
              className="
                mt-3
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p
                className="
                  text-[10px]
                  leading-4
                  text-muted-foreground
                "
              >
                You can add up to{" "}
                <span
                  className="
                    font-semibold
                    text-foreground
                  "
                >
                  {formatValue(
                    remaining
                  )}{" "}
                  {habit.targetUnit ??
                    ""}
                </span>
              </p>

              <div
                className="
                  flex
                  w-full
                  gap-2
                  sm:w-auto
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    setAmount("");
                    setShowAmountForm(
                      false
                    );
                  }}
                  disabled={
                    completionMutation.isPending
                  }
                  className="
                    flex-1
                    cursor-pointer
                    rounded-lg
                    border
                    border-[#ddd7ce]
                    bg-[#fffdfa]
                    px-4
                    py-2
                    text-[11px]
                    font-semibold
                    text-muted-foreground
                    transition-all
                    hover:bg-[#f5f1eb]
                    hover:text-foreground
                    active:scale-[0.98]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    sm:flex-none
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    completionMutation.isPending ||
                    !amount ||
                    Number(amount) <= 0 ||
                    Number(amount) >
                      remaining
                  }
                  className="
                    flex-1
                    cursor-pointer
                    rounded-lg
                    bg-primary
                    px-4
                    py-2
                    text-[11px]
                    font-semibold
                    text-white
                    transition-all
                    hover:opacity-90
                    active:scale-[0.98]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    sm:flex-none
                  "
                >
                  {completionMutation.isPending
                    ? "Adding..."
                    : "Add progress"}
                </button>
              </div>
            </div>

            {/* Error */}

            {completionMutation.isError && (
              <p
                className="
                  mt-3
                  rounded-lg
                  bg-[#fff0e8]
                  px-3
                  py-2
                  text-[10px]
                  font-medium
                  leading-4
                  text-[#d95f25]
                "
              >
                Could not add progress.
                Please try again.
              </p>
            )}
          </form>
        )}

      {/* =======================================================
          MOBILE PROGRESS
          ======================================================= */}

      <div
        className="
          mt-3
          sm:hidden
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <span
            className="
              text-[10px]
              font-medium
              text-muted-foreground
            "
          >
            Progress
          </span>

          <span
            className="
              text-[10px]
              font-semibold
              text-foreground
            "
          >
            {Math.round(progress)}%
          </span>
        </div>

        <div
          className="
            mt-1.5
            h-1.5
            overflow-hidden
            rounded-full
            bg-[#ebe7df]
          "
        >
          <div
            className={`
              h-full
              rounded-full
              transition-all
              duration-500

              ${
                completed
                  ? "bg-[#5d8a45]"
                  : "bg-primary"
              }
            `}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatValue(
  value: number
) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(1);
}

function getHabitCategory(
  habit: DashboardHabit
) {
  const name =
    habit.name.toLowerCase();

  if (
    name.includes("water") ||
    name.includes("vitamin") ||
    name.includes("health") ||
    name.includes("sleep")
  ) {
    return "Health";
  }

  if (
    name.includes("workout") ||
    name.includes("exercise") ||
    name.includes("gym") ||
    name.includes("run") ||
    name.includes("walk") ||
    name.includes("steps")
  ) {
    return "Fitness";
  }

  if (
    name.includes("read") ||
    name.includes("book") ||
    name.includes("learn") ||
    name.includes("study")
  ) {
    return "Learning";
  }

  if (
    name.includes("meditat") ||
    name.includes("journal") ||
    name.includes("mind") ||
    name.includes("breath")
  ) {
    return "Mindfulness";
  }

  return "Habit";
}

function getCategoryStyle(
  category: string
) {
  switch (category) {
    case "Health":
      return "bg-[#edf3f8] text-[#557493]";

    case "Fitness":
      return "bg-[#f1edfa] text-[#675493]";

    case "Learning":
      return "bg-[#fff0e8] text-[#d95f25]";

    case "Mindfulness":
      return "bg-[#f1edfa] text-[#675493]";

    default:
      return "bg-[#eeece6] text-[#666158]";
  }
}