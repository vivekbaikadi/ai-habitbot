"use client";

import type { LucideIcon } from "lucide-react";

type StatCardAccent =
    | "orange"
    | "olive"
    | "purple"
    | "gold";

type DashboardStatCardProps = {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    accent?: StatCardAccent;
    progress?: number;
    trend?: number[];
    suffix?: string;
};

const accentStyles: Record<
    StatCardAccent,
    {
        icon: string;
        iconText: string;
        value: string;
        progress: string;
        chart: string;
    }
> = {
    orange: {
        icon: "bg-[#fff0e8]",
        iconText: "text-[#e8662f]",
        value: "text-[#20201e]",
        progress: "bg-[#f4773c]",
        chart: "bg-[#f4773c]",
    },

    olive: {
        icon: "bg-[#f0f2e8]",
        iconText: "text-[#687345]",
        value: "text-[#687345]",
        progress: "bg-[#7c865b]",
        chart: "bg-[#7c865b]",
    },

    purple: {
        icon: "bg-[#f1edfa]",
        iconText: "text-[#675493]",
        value: "text-[#675493]",
        progress: "bg-[#7563a8]",
        chart: "bg-[#7563a8]",
    },

    gold: {
        icon: "bg-[#faf3df]",
        iconText: "text-[#b27d17]",
        value: "text-[#d77716]",
        progress: "bg-[#d99a28]",
        chart: "bg-[#d99a28]",
    },
};

export function DashboardStatCard({
    title,
    value,
    description,
    icon: Icon,
    accent = "orange",
    progress,
    trend,
    suffix,
}: DashboardStatCardProps) {
    const styles = accentStyles[accent];

    const normalizedProgress =
        progress === undefined
            ? undefined
            : Math.min(Math.max(progress, 0), 100);

    return (
        <article
            className="
        habitbot-card
        relative
        min-h-[154px]
        overflow-hidden
        p-4
        sm:p-5
      "
        >
            <div
                className="
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-28
          w-28
          rounded-full
          bg-primary/[0.025]
          blur-2xl
        "
            />

            <div className="relative flex h-full min-h-[114px] flex-col">
                {/* Header */}

                <div className="flex items-center gap-2.5">
                    <div
                        className={`
              flex
              h-9 w-9
              shrink-0
              items-center justify-center
              rounded-lg
              ${styles.icon}
              ${styles.iconText}
            `}
                    >
                        <Icon
                            className="h-[17px] w-[17px]"
                            strokeWidth={2}
                        />
                    </div>

                    <p className="text-sm font-semibold text-foreground">
                        {title}
                    </p>
                </div>

                {/* Value */}

                <div className="mt-5">
                    <p
                        className={`
              text-[2rem]
              font-bold
              leading-none
              tracking-[-0.04em]
              ${styles.value}
            `}
                    >
                        {value}

                        {suffix && (
                            <span className="ml-1 text-sm font-semibold tracking-normal">
                                {suffix}
                            </span>
                        )}
                    </p>

                    <p
                        className="
              mt-2
              max-w-[72%]
              truncate
              text-xs
              leading-5
              text-muted-foreground
            "
                    >
                        {description}
                    </p>
                </div>

                {/* Bottom visual */}

                <div className="mt-auto pt-4">
                    {normalizedProgress !== undefined ? (
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeae3]">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${styles.progress}`}
                                style={{
                                    width: `${normalizedProgress}%`,
                                }}
                            />
                        </div>
                    ) : trend && trend.length > 1 ? (
                        <div className="flex h-7 items-end justify-end gap-1.5">
                            {trend.map((height, index) => (
                                <span
                                    key={index}
                                    className={`
                    w-1.5
                    rounded-full
                    ${styles.chart}
                  `}
                                    style={{
                                        height: `${Math.max(
                                            20,
                                            Math.min(height, 100)
                                        )}%`,
                                        opacity:
                                            index === trend.length - 1
                                                ? 1
                                                : 0.5,
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-1.5" />
                    )}
                </div>
            </div>
        </article>
    );
}