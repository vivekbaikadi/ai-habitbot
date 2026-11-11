"use client";

import Link from "next/link";
import {
  Droplets,
  Flame,
  Lock,
  Trophy,
} from "lucide-react";

type Achievement = {
  id: string;
  title: string;
  description: string;
  type: "streak" | "early" | "hydration";
  unlocked: boolean;
};

type AchievementsProps = {
  achievements?: Achievement[];
};

const defaultAchievements: Achievement[] = [
  {
    id: "streak",
    title: "7 Day Streak",
    description: "Complete habits for 7 days",
    type: "streak",
    unlocked: false,
  },
  {
    id: "early",
    title: "Early Bird",
    description: "Build a consistent morning routine",
    type: "early",
    unlocked: false,
  },
  {
    id: "hydration",
    title: "Hydration Hero",
    description: "Stay on top of your water intake",
    type: "hydration",
    unlocked: false,
  },
];

export function Achievements({
  achievements = defaultAchievements,
}: AchievementsProps) {
  const unlockedCount = achievements.filter(
    (achievement) => achievement.unlocked
  ).length;

  return (
    <section className="habitbot-card overflow-hidden">
      {/* Header */}

      <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex
              h-9 w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#faf3df]
              text-[#b27d17]
            "
          >
            <Trophy
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
              Achievements
            </h2>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Milestones worth celebrating.
            </p>
          </div>
        </div>

        <Link
          href="/analytics"
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
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Achievement grid */}

      <div className="border-t border-border px-4 py-5 sm:px-5">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {achievements.slice(0, 3).map((achievement) => (
            <AchievementItem
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </div>

        {/* Progress summary */}

        <div
          className="
            mt-5
            flex
            items-center
            justify-between
            rounded-xl
            bg-[#fcfaf7]
            px-3.5
            py-3
          "
        >
          <div>
            <p className="text-[10px] font-semibold text-foreground">
              Your collection
            </p>

            <p className="mt-0.5 text-[9px] text-muted-foreground">
              Keep building habits to unlock more.
            </p>
          </div>

          <span className="shrink-0 text-xs font-bold text-[#b27d17]">
            {unlockedCount}/{achievements.length}
          </span>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   ACHIEVEMENT ITEM
   ========================================================= */

function AchievementItem({
  achievement,
}: {
  achievement: Achievement;
}) {
  const Icon = getAchievementIcon(
    achievement.type
  );

  const style = getAchievementStyle(
    achievement.type
  );

  return (
    <div className="min-w-0 text-center">
      {/* Badge */}

      <div className="relative mx-auto w-fit">
        <div
          className={`
            flex
            h-14 w-14
            items-center
            justify-center
            rounded-2xl
            transition-transform
            duration-200
            sm:h-16
            sm:w-16
            ${style.background}
            ${style.text}
            ${
              achievement.unlocked
                ? "shadow-[0_4px_14px_rgba(48,42,35,0.08)]"
                : "opacity-55"
            }
          `}
        >
          <Icon
            className="h-6 w-6 sm:h-7 sm:w-7"
            strokeWidth={1.8}
            fill={
              achievement.unlocked
                ? "currentColor"
                : "none"
            }
          />
        </div>

        {/* Locked indicator */}

        {!achievement.unlocked && (
          <div
            className="
              absolute
              -right-1.5
              -top-1.5
              flex
              h-5 w-5
              items-center
              justify-center
              rounded-full
              border-2
              border-card
              bg-[#e8e3db]
              text-[#77736b]
            "
          >
            <Lock className="h-2.5 w-2.5" />
          </div>
        )}
      </div>

      {/* Text */}

      <p
        className="
          mt-2.5
          truncate
          text-[10px]
          font-semibold
          text-foreground
          sm:text-[11px]
        "
      >
        {achievement.title}
      </p>

      <p
        className="
          mx-auto
          mt-0.5
          line-clamp-2
          max-w-[100px]
          text-[9px]
          leading-4
          text-muted-foreground
        "
      >
        {achievement.description}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function getAchievementIcon(
  type: Achievement["type"]
) {
  switch (type) {
    case "streak":
      return Flame;

    case "early":
      return Trophy;

    case "hydration":
      return Droplets;
  }
}

function getAchievementStyle(
  type: Achievement["type"]
) {
  switch (type) {
    case "streak":
      return {
        background: "bg-[#fff0e8]",
        text: "text-[#e8662f]",
      };

    case "early":
      return {
        background: "bg-[#f0f2e8]",
        text: "text-[#687345]",
      };

    case "hydration":
      return {
        background: "bg-[#edf3f8]",
        text: "text-[#557493]",
      };
  }
}