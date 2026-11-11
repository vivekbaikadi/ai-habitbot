"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Plus,
} from "lucide-react";

import type { DashboardHabit } from "@/lib/api/dashboard";

import { HabitRow } from "./habit-row";

type TodaysHabitsProps = {
  habits: DashboardHabit[];
};

export function TodaysHabits({
  habits,
}: TodaysHabitsProps) {
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
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-9 w-9
              shrink-0
              items-center justify-center
              rounded-lg
              bg-[#eeece6]
              text-[#756b5d]
            "
          >
            <CheckCircle2
              className="h-[18px] w-[18px]"
              strokeWidth={2}
            />
          </div>

          <div>
            <h2 className="text-base font-semibold tracking-[-0.015em]">
              Today&apos;s Habits
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Keep your momentum going.
            </p>
          </div>
        </div>

        <Link
          href="/habits"
          className="
            shrink-0
            text-xs
            font-semibold
            text-primary
            transition-colors
            hover:text-[#d95f25]
            sm:text-sm
          "
        >
          <span className="hidden sm:inline">
            View all habits
          </span>

          <span className="sm:hidden">
            View all
          </span>

          <span className="ml-1">→</span>
        </Link>
      </div>

      {/* Habits */}

      <div className="border-t border-border">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div
              className="
                flex
                h-12 w-12
                items-center justify-center
                rounded-2xl
                bg-primary-soft
                text-primary
              "
            >
              <Plus className="h-5 w-5" />
            </div>

            <h3 className="mt-4 text-sm font-semibold">
              No habits yet
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Create your first habit and start building
              your daily momentum.
            </p>

            <Link
              href="/habits"
              className="
                mt-4
                rounded-lg
                bg-primary
                px-4 py-2
                text-xs
                font-semibold
                text-primary-foreground
                transition-all
                hover:opacity-90
                active:scale-[0.98]
              "
            >
              Create a habit
            </Link>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
            />
          ))
        )}
      </div>
    </section>
  );
}