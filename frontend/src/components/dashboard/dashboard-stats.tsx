"use client";

import {
  Flame,
  Goal,
  TrendingUp,
  Utensils,
} from "lucide-react";

import type { DashboardHabit } from "@/lib/api/dashboard";
import { DashboardStatCard } from "./dashboard-stat-card";

type DashboardStatsProps = {
  habits: DashboardHabit[];
  activeGoals: number;
};

export function DashboardStats({
  habits,
  activeGoals,
}: DashboardStatsProps) {
  const totalHabits = habits.length;

  const completedHabits =
    habits.filter(
      (habit) => habit.today.completed
    ).length;

  /*
   * Calculate the actual progress of each habit.
   *
   * Binary habit:
   *   completed = 100%
   *   pending   = 0%
   *
   * Measurable habit:
   *   current value / target value
   */
  const habitProgress = habits.map(
    (habit) => {
      if (habit.targetValue !== null) {
        const target =
          Number(habit.targetValue);

        const current =
          habit.today.value ?? 0;

        if (target <= 0) {
          return 0;
        }

        return Math.min(
          (current / target) * 100,
          100
        );
      }

      return habit.today.completed
        ? 100
        : 0;
    }
  );

  /*
   * Overall progress is the average
   * progress across today's habits.
   */
  const overallProgress =
    totalHabits === 0
      ? 0
      : Math.round(
          habitProgress.reduce(
            (sum, progress) =>
              sum + progress,
            0
          ) / totalHabits
        );

  /*
   * Keep a small visual trend in the
   * stat card. This is currently based
   * on today's habit progress values.
   */
  const progressTrend =
    habitProgress.length > 1
      ? habitProgress
      : [
          25,
          40,
          35,
          60,
          55,
          overallProgress,
        ];

  return (
    <section
      className="
        grid
        grid-cols-1
        gap-3
        sm:grid-cols-2
        xl:grid-cols-4
      "
    >
      <DashboardStatCard
        title="Today's Progress"
        value={`${overallProgress}%`}
        description={`${completedHabits} of ${totalHabits} habits completed`}
        icon={TrendingUp}
        accent="orange"
        progress={overallProgress}
        trend={
          progressTrend.length > 1
            ? progressTrend
            : [
                35,
                45,
                40,
                65,
                60,
                overallProgress,
              ]
        }
      />

      <DashboardStatCard
        title="Active Goals"
        value={String(activeGoals)}
        description={
          activeGoals === 0
            ? "Create your first goal"
            : "You're making steady progress"
        }
        icon={Goal}
        accent="purple"
        trend={[
          25,
          40,
          35,
          60,
          55,
          80,
        ]}
      />

      <DashboardStatCard
        title="Current Streak"
        value="—"
        description="Keep completing habits to build your streak"
        icon={Flame}
        accent="olive"
        trend={[
          20,
          35,
          45,
          40,
          65,
          75,
        ]}
      />

      <DashboardStatCard
        title="Today's Calories"
        value="—"
        suffix="kcal"
        description="Nutrition tracking will appear here"
        icon={Utensils}
        accent="gold"
        trend={[
          35,
          50,
          45,
          65,
          55,
          70,
        ]}
      />
    </section>
  );
}