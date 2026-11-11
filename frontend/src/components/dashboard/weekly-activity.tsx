"use client";

import {
  BarChart3,
  CalendarDays,
} from "lucide-react";

type ActivityDay = {
  label: string;
  completed: number;
  missed?: number;
};

type WeeklyActivityProps = {
  days?: ActivityDay[];
};

const fallbackDays: ActivityDay[] = [
  { label: "Mon", completed: 0 },
  { label: "Tue", completed: 0 },
  { label: "Wed", completed: 0 },
  { label: "Thu", completed: 0 },
  { label: "Fri", completed: 0 },
  { label: "Sat", completed: 0 },
  { label: "Sun", completed: 0 },
];

export function WeeklyActivity({
  days = fallbackDays,
}: WeeklyActivityProps) {
  const hasActivity = days.some(
    (day) => day.completed > 0
  );

  const max = Math.max(
    ...days.map((day) => day.completed),
    1
  );

  return (
    <section className="habitbot-card overflow-hidden">
      {/* =====================================================
          HEADER
          ===================================================== */}

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
              bg-[#f0f2e8]
              text-[#687345]
            "
          >
            <BarChart3
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
              Weekly Activity
            </h2>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Your habit consistency this week.
            </p>
          </div>
        </div>

        {/* Legend */}

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Completed
          </span>

          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#e8e1d8]" />
            Missed
          </span>
        </div>
      </div>

      {/* =====================================================
          CHART
          ===================================================== */}

      <div className="border-t border-border px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
        <div className="relative">
          {/* Horizontal guide lines */}

          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              flex
              h-[132px]
              flex-col
              justify-between
            "
          >
            <span className="border-t border-dashed border-[#ebe7df]" />
            <span className="border-t border-dashed border-[#ebe7df]" />
            <span className="border-t border-dashed border-[#ebe7df]" />
            <span className="border-t border-[#e5dfd6]" />
          </div>

          {/* Bars */}

          <div className="relative flex h-[132px] items-end justify-between gap-2">
            {days.map((day) => {
              const height =
                day.completed === 0
                  ? 5
                  : Math.max(
                      12,
                      (day.completed / max) * 100
                    );

              return (
                <div
                  key={day.label}
                  className="
                    flex
                    h-full
                    flex-1
                    flex-col
                    items-center
                    justify-end
                    gap-2
                  "
                >
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className={`
                        w-full
                        max-w-8
                        rounded-t-lg
                        transition-all
                        duration-500
                        ${
                          day.completed > 0
                            ? "bg-primary"
                            : "bg-[#e8e1d8]"
                        }
                      `}
                      style={{
                        height: `${height}%`,
                      }}
                      title={`${day.completed} habits completed on ${day.label}`}
                    />
                  </div>

                  <span className="text-[10px] font-medium text-muted-foreground">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            EMPTY STATE
            =================================================== */}

        {!hasActivity && (
          <div
            className="
              mt-4
              flex
              items-center
              gap-3
              rounded-xl
              bg-[#fcfaf7]
              px-3.5
              py-3
            "
          >
            <div
              className="
                flex
                h-8 w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-[#f0f2e8]
                text-[#687345]
              "
            >
              <CalendarDays
                className="h-4 w-4"
                strokeWidth={1.9}
              />
            </div>

            <p className="text-[11px] leading-5 text-muted-foreground">
              Complete your habits to build your weekly
              activity chart.
            </p>
          </div>
        )}

        {/* ===================================================
            MOBILE LEGEND
            =================================================== */}

        <div className="mt-3 flex items-center justify-end gap-3 sm:hidden">
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Completed
          </span>

          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e8e1d8]" />
            No activity
          </span>
        </div>
      </div>
    </section>
  );
}