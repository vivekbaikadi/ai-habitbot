"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getTodayDashboard,
  type DashboardResponse,
} from "@/lib/api/dashboard";

import { useAuth } from "@/providers/auth-provider";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { TodaysHabits } from "@/components/dashboard/todays-habits";
import { GoalsOverview } from "@/components/dashboard/goals-overview";
import { NutritionSummary } from "@/components/dashboard/nutrition-summary";
import { WeeklyActivity } from "@/components/dashboard/weekly-activity";
import { Achievements } from "@/components/dashboard/achievements";
import { AICoachCard } from "@/components/dashboard/ai-coach-card";

import { ProfileSummary } from "@/components/dashboard/profile-summary";

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<DashboardResponse>({
    queryKey: ["dashboard", "today"],
    queryFn: getTodayDashboard,
  });

  /*
   * Loading state
   */

  if (isLoading) {
    return <DashboardLoading />;
  }

  /*
   * Error state
   */

  if (isError || !data) {
    return (
      <DashboardError
        message={
          error instanceof Error
            ? error.message
            : "Unable to load your dashboard."
        }
      />
    );
  }

  /*
   * Dashboard data
   */

  const habits = data.habits ?? [];
  const goals = data.goals ?? [];

  const activeGoals = goals.filter(
    (goal) => goal.isActive
  );

  return (
    <div className="space-y-6">
      {/* =====================================================
          WELCOME
          ===================================================== */}

      <DashboardWelcome
        name={data.user.name}
        date={data.date}
      />

      <ProfileSummary
        primaryGoal={data.user.profile.primaryGoal}
        dietType={data.user.dietType}
        heightCm={data.user.profile.heightCm}
        weightKg={data.user.profile.weightKg}
      />

      {/* =====================================================
          TOP STAT CARDS
          ===================================================== */}

      <DashboardStats
        habits={habits}
        activeGoals={activeGoals.length}
      />

      {/* =====================================================
          MAIN DASHBOARD
          ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]
        "
      >
        {/* ===================================================
            LEFT COLUMN
            =================================================== */}

        <div className="min-w-0 space-y-5">
          {/* Today's Habits */}

          <TodaysHabits
            habits={habits}
          />

          {/* Bottom analytics */}

          <div
            className="
              grid
              grid-cols-1
              gap-5
              lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]
            "
          >
            <WeeklyActivity />

            <Achievements />
          </div>
        </div>

        {/* ===================================================
            RIGHT COLUMN
            =================================================== */}

        <div className="min-w-0 space-y-5">
          {/* Goals */}

          <GoalsOverview
            goals={goals}
          />

          {/* Nutrition */}

          <NutritionSummary />

          {/* AI Coach */}

          <AICoachCard />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING STATE
   ========================================================= */

function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome skeleton */}

      <div className="space-y-2">
        <div className="h-8 w-72 animate-pulse rounded-lg bg-[#ebe7df]" />
        <div className="h-4 w-52 animate-pulse rounded-lg bg-[#ebe7df]" />
      </div>

      {/* Stats */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="
                h-[154px]
                animate-pulse
                rounded-[1.25rem]
                border
                border-border
                bg-card
              "
            />
          )
        )}
      </div>

      {/* Main content */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]
        "
      >
        <div className="space-y-5">
          <div className="h-[520px] animate-pulse rounded-[1.25rem] bg-card" />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-[1.25rem] bg-card" />
            <div className="h-64 animate-pulse rounded-[1.25rem] bg-card" />
          </div>
        </div>

        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-[1.25rem] bg-card" />
          <div className="h-64 animate-pulse rounded-[1.25rem] bg-card" />
          <div className="h-64 animate-pulse rounded-[1.25rem] bg-card" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ERROR STATE
   ========================================================= */

function DashboardError({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="
          habitbot-card
          max-w-md
          p-6
          text-center
        "
      >
        <div
          className="
            mx-auto
            flex
            h-12 w-12
            items-center justify-center
            rounded-xl
            bg-[#fff0ed]
            text-danger
          "
        >
          !
        </div>

        <h2 className="mt-4 text-base font-semibold">
          Unable to load dashboard
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="
            mt-5
            rounded-lg
            bg-primary
            px-4
            py-2
            text-xs
            font-semibold
            text-primary-foreground
            transition-opacity
            hover:opacity-90
          "
        >
          Try again
        </button>
      </div>
    </div>
  );
}