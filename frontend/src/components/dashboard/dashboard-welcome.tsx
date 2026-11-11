"use client";

import { Sparkles } from "lucide-react";

type DashboardWelcomeProps = {
  name?: string | null;
  date?: string;
};

export function DashboardWelcome({
  name,
  date,
}: DashboardWelcomeProps) {
  return (
    <section className="mb-6 sm:mb-7">
      {date && (
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {date}
        </p>
      )}

      <div className="flex items-start gap-3">
        <div
          className="
            mt-1
            hidden
            h-10 w-10
            shrink-0
            items-center justify-center
            rounded-xl
            bg-primary-soft
            text-primary
            sm:flex
          "
        >
          <Sparkles
            className="h-5 w-5"
            strokeWidth={1.8}
          />
        </div>

        <div>
          <h1
            className="
              text-2xl
              font-bold
              tracking-[-0.035em]
              text-foreground
              sm:text-3xl
              lg:text-[2rem]
            "
          >
            Good morning, {name || "there"}! 👋
          </h1>

          <p
            className="
              mt-1.5
              text-sm
              leading-6
              text-muted-foreground
              sm:text-[15px]
            "
          >
            Stay consistent and{" "}
            <span className="font-medium text-primary">
              make today count.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}