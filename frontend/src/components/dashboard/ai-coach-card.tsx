"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Sparkles,
} from "lucide-react";

type AICoachCardProps = {
  message?: string;
  recommendation?: string;
};

export function AICoachCard({
  message = "Your AI coach is ready to help you stay on track.",
  recommendation = "Get personalized guidance based on your habits, goals, and daily progress.",
}: AICoachCardProps) {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[1.25rem]
        border
        border-[#eadfd4]
        bg-gradient-to-br
        from-[#fff7ef]
        via-[#fffaf5]
        to-[#f4eee7]
        p-5
        shadow-[0_2px_12px_rgba(48,42,35,0.035)]
        sm:p-6
      "
    >
      {/* Decorative background */}

      <div
        className="
          pointer-events-none
          absolute
          -right-10
          -top-12
          h-32
          w-32
          rounded-full
          bg-primary/[0.08]
          blur-2xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-12
          right-16
          h-28
          w-28
          rounded-full
          bg-[#7563a8]/[0.06]
          blur-2xl
        "
      />

      <div className="relative">
        {/* Header */}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="
                flex
                h-9 w-9
                items-center
                justify-center
                rounded-xl
                bg-primary
                text-white
                shadow-[0_6px_18px_rgba(244,119,60,0.2)]
              "
            >
              <Bot
                className="h-[18px] w-[18px]"
                strokeWidth={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">
                AI Coach
              </h2>

              <span
                className="
                  rounded-full
                  border
                  border-primary/20
                  bg-white/60
                  px-2
                  py-0.5
                  text-[9px]
                  font-semibold
                  text-primary
                "
              >
                AI
              </span>
            </div>
          </div>

          <Sparkles
            className="h-4 w-4 shrink-0 text-[#d99a28]"
            fill="currentColor"
          />
        </div>

        {/* Content */}

        <div className="mt-5 max-w-[420px]">
          <p
            className="
              text-[15px]
              font-semibold
              leading-6
              tracking-[-0.01em]
              text-foreground
            "
          >
            {message}
          </p>

          <p
            className="
              mt-2
              text-xs
              leading-5
              text-muted-foreground
            "
          >
            {recommendation}
          </p>
        </div>

        {/* CTA */}

        <Link
          href="/ai/coach"
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-primary
            px-3.5
            py-2.5
            text-xs
            font-semibold
            text-primary-foreground
            shadow-[0_5px_16px_rgba(244,119,60,0.16)]
            transition-all
            duration-200
            hover:translate-y-[-1px]
            hover:shadow-[0_7px_20px_rgba(244,119,60,0.22)]
            active:translate-y-0
          "
        >
          Chat with HabitBot
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}