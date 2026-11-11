"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Dumbbell,
  Target,
} from "lucide-react";

import type { DashboardGoal } from "@/lib/api/dashboard";

type GoalsOverviewProps = {
  goals: DashboardGoal[];
};

export function GoalsOverview({
  goals,
}: GoalsOverviewProps) {
  const activeGoals = goals.filter(
    (goal) => goal.isActive
  );

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
              items-center justify-center
              rounded-xl
              bg-[#f1edfa]
              text-[#675493]
            "
          >
            <Target
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
              Goals Overview
            </h2>

            <p
              className="
                mt-0.5
                truncate
                text-xs
                text-muted-foreground
              "
            >
              What you&apos;re working toward.
            </p>
          </div>
        </div>

        <Link
          href="/goals"
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
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Goals */}

      <div className="border-t border-border">
        {activeGoals.length === 0 ? (
          <EmptyGoals />
        ) : (
          <div className="px-4 sm:px-5">
            {activeGoals.slice(0, 4).map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   GOAL ITEM
   ========================================================= */

function GoalItem({
  goal,
}: {
  goal: DashboardGoal;
}) {
  const Icon = getGoalIcon(goal.title);
  const style = getGoalStyle(goal.title);

  return (
    <div
      className="
        group
        flex
        items-center
        gap-3
        border-b
        border-border
        py-4
        last:border-b-0
      "
    >
      {/* Icon */}

      <div
        className={`
          flex
          h-10 w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${style.icon}
          ${style.text}
        `}
      >
        <Icon
          className="h-[18px] w-[18px]"
          strokeWidth={2}
        />
      </div>

      {/* Content */}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3
            className="
              truncate
              text-sm
              font-semibold
              tracking-[-0.01em]
            "
          >
            {goal.title}
          </h3>

          <span
            className="
              shrink-0
              text-[10px]
              font-medium
              text-muted-foreground
            "
          >
            Active
          </span>
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
          {goal.description ||
            "Keep working toward your goal."}
        </p>

        {/* Visual progress indicator */}

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground">
              Progress
            </span>

            <span className="text-[10px] font-semibold text-muted-foreground">
              In progress
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
                w-1/3
                rounded-full
                transition-all
                duration-500
                ${style.progress}
              `}
            />
          </div>
        </div>
      </div>

      {/* Arrow */}

      <ArrowRight
        className="
          h-4 w-4
          shrink-0
          text-muted-foreground/40
          transition-all
          duration-200
          group-hover:translate-x-0.5
          group-hover:text-muted-foreground
        "
      />
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyGoals() {
  return (
    <div className="px-5 py-9 text-center">
      <div
        className="
          mx-auto
          flex
          h-11 w-11
          items-center
          justify-center
          rounded-xl
          bg-[#f1edfa]
          text-[#675493]
        "
      >
        <Target className="h-5 w-5" />
      </div>

      <p className="mt-3 text-sm font-semibold">
        No active goals
      </p>

      <p className="mx-auto mt-1 max-w-[230px] text-xs leading-5 text-muted-foreground">
        Set a goal and turn your daily habits into
        meaningful progress.
      </p>

      <Link
        href="/goals"
        className="
          mt-4
          inline-flex
          items-center
          gap-1.5
          rounded-lg
          bg-primary
          px-3.5
          py-2
          text-xs
          font-semibold
          text-primary-foreground
          transition-all
          hover:opacity-90
          active:scale-[0.98]
        "
      >
        Create a goal
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function getGoalIcon(title: string) {
  const value = title.toLowerCase();

  if (
    value.includes("muscle") ||
    value.includes("fitness") ||
    value.includes("workout") ||
    value.includes("weight")
  ) {
    return Dumbbell;
  }

  if (
    value.includes("read") ||
    value.includes("book") ||
    value.includes("learn") ||
    value.includes("study")
  ) {
    return BookOpen;
  }

  return Target;
}

function getGoalStyle(title: string) {
  const value = title.toLowerCase();

  if (
    value.includes("muscle") ||
    value.includes("fitness") ||
    value.includes("workout") ||
    value.includes("weight")
  ) {
    return {
      icon: "bg-[#f1edfa]",
      text: "text-[#675493]",
      progress: "bg-[#7563a8]",
    };
  }

  if (
    value.includes("read") ||
    value.includes("book") ||
    value.includes("learn") ||
    value.includes("study")
  ) {
    return {
      icon: "bg-[#faf3df]",
      text: "text-[#b27d17]",
      progress: "bg-[#d99a28]",
    };
  }

  return {
    icon: "bg-[#fff0e8]",
    text: "text-[#e8662f]",
    progress: "bg-[#f4773c]",
  };
}