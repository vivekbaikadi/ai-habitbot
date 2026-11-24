"use client";

import {
    CalendarDays,
    Check,
    Circle,
    MoreVertical,
    Plus,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
    createHabit,
    getHabits,
    type CreateHabitInput,
    type Habit,
    type HabitWeekday,
} from "@/lib/api/habits";

import {
    createHabitCompletion,
} from "@/lib/api/completions";

import {
    getTodayDashboard,
    type DashboardHabit,
} from "@/lib/api/dashboard";

import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGoals, type Goal } from "@/lib/api/goals";
import { updateHabit, type UpdateHabitInput } from "@/lib/api/habits";
import { toast } from "sonner";

function formatFrequency(
    frequency: Habit["frequency"]
): string {
    switch (frequency) {
        case "DAILY":
            return "Daily";
        case "WEEKLY":
            return "Weekly";
        case "CUSTOM":
            return "Custom";
        default:
            return frequency;
    }
}

function formatSchedule(habit: Habit): string {
    switch (habit.frequency) {
        case "DAILY":
            return "Every day";

        case "WEEKLY":
            return `${habit.weeklyTarget ?? 0} times per week`;

        case "CUSTOM":
            return (habit.customDays ?? [])
                .map((day) =>
                    WEEKDAYS.find((weekday) => weekday.value === day)?.label
                )
                .filter(Boolean)
                .join(", ") || "No days selected";

        default:
            return formatFrequency(habit.frequency);
    }
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

const WEEKDAYS: {
    value: HabitWeekday;
    label: string;
}[] = [
        { value: "MONDAY", label: "Mon" },
        { value: "TUESDAY", label: "Tue" },
        { value: "WEDNESDAY", label: "Wed" },
        { value: "THURSDAY", label: "Thu" },
        { value: "FRIDAY", label: "Fri" },
        { value: "SATURDAY", label: "Sat" },
        { value: "SUNDAY", label: "Sun" },
    ];

function WeekdaySelector({
    selectedDays,
    onChange,
}: {
    selectedDays: HabitWeekday[];
    onChange: (days: HabitWeekday[]) => void;
}) {
    function toggleDay(day: HabitWeekday) {
        const updatedDays = selectedDays.includes(day)
            ? selectedDays.filter((selected) => selected !== day)
            : [
                ...selectedDays,
                day,
            ];

        onChange(
            WEEKDAYS
                .filter((weekday) =>
                    updatedDays.includes(weekday.value)
                )
                .map((weekday) => weekday.value)
        );
    }

    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
                Choose your habit days
            </label>

            <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                    const selected = selectedDays.includes(day.value);

                    return (
                        <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            aria-pressed={selected}
                            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${selected
                                ? "border-[#7c865b] bg-[#7c865b]/10 text-[#68734b]"
                                : "border-[#e6dfd4] bg-white text-muted-foreground hover:bg-[#f7f5f0]"
                                }`}
                        >
                            {day.label}
                        </button>
                    );
                })}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
                Select at least one day for this habit.
            </p>
        </div>
    );
}

function getProgress(
    habit: Habit,
    today?: DashboardHabit["today"]
): number {
    if (!today) {
        return 0;
    }

    if (habit.targetValue !== null) {
        const target = Number(habit.targetValue);

        if (target <= 0) {
            return 0;
        }

        const current = today.value ?? 0;

        return Math.min(
            Math.round((current / target) * 100),
            100
        );
    }

    return today.completed ? 100 : 0;
}

function HabitCard({
    habit,
    dashboardHabit,
    onEdit,
    onDeactivate,
    onReactivate,
    onLogProgress,
    onComplete,
    isCompletionPending,
    isReactivatePending,
}: {
    habit: Habit;
    dashboardHabit?: DashboardHabit;
    onEdit: (habit: Habit) => void;
    onDeactivate: (habit: Habit) => void;
    onReactivate: (habit: Habit) => void;
    onLogProgress: (habit: Habit) => void;
    onComplete: (habit: Habit) => void;
    isCompletionPending: boolean;
    isReactivatePending: boolean;
}) {
    const [menuOpen, setMenuOpen] =
        useState(false);

    const isMeasurable =
        habit.targetValue !== null;

    const isDeactivated =
        !habit.isActive;

    const today = dashboardHabit?.today;

    const isScheduledToday =
        dashboardHabit?.isScheduledToday ?? false;

    const weeklyProgress =
        dashboardHabit?.weeklyProgress ?? null;

    const progress = getProgress(habit, today);

    const currentValue = today?.value ?? 0;

    const completed = today?.completed ?? false;

    return (
        <div
            className={`habitbot-card p-5 ${isDeactivated
                ? "opacity-65"
                : ""
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div
                        className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#f4773c]/10
              text-[#f4773c]
            "
                    >
                        {completed ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            <Circle className="h-5 w-5" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-foreground">
                            {habit.name}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>
                                {formatSchedule(habit)}
                            </span>

                            {habit.goal && (
                                <>
                                    <span>•</span>

                                    <span>
                                        {habit.goal.title}
                                    </span>
                                </>
                            )}

                            {isDeactivated && (
                                <span className="mt-2 inline-flex rounded-full bg-[#eee9e1] px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                    Deactivated
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() =>
                            setMenuOpen(
                                (open) => !open
                            )
                        }
                        className="
      flex
      h-8
      w-8
      items-center
      justify-center
      rounded-lg
      text-muted-foreground
      transition
      hover:bg-[#f3efe8]
      hover:text-foreground
    "
                        aria-label={`Options for ${habit.name}`}
                        aria-expanded={menuOpen}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuOpen && (
                        <div
                            className="
        absolute
        right-0
        top-10
        z-20
        w-40
        rounded-xl
        border
        border-[#ebe5dc]
        bg-[#fffdfa]
        p-1
        shadow-lg
      "
                        >
                            <Link
                                href={`/habits/${habit.id}`}
                                onClick={() =>
                                    setMenuOpen(
                                        false
                                    )
                                }
                                className="
          block
          rounded-lg
          px-3
          py-2
          text-sm
          font-medium
          text-foreground
          transition
          hover:bg-[#f7f5f0]
        "
                            >
                                View details
                            </Link>

                            {habit.isActive && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onEdit(habit);
                                            setMenuOpen(
                                                false
                                            );
                                        }}
                                        className="
              block
              w-full
              rounded-lg
              px-3
              py-2
              text-left
              text-sm
              text-foreground
              transition
              hover:bg-[#f7f5f0]
            "
                                    >
                                        Edit habit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            onDeactivate(
                                                habit
                                            );
                                            setMenuOpen(
                                                false
                                            );
                                        }}
                                        className="
              block
              w-full
              rounded-lg
              px-3
              py-2
              text-left
              text-sm
              text-foreground
              transition
              hover:bg-[#f7f5f0]
            "
                                    >
                                        Deactivate habit
                                    </button>
                                </>
                            )}

                            {!habit.isActive && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onReactivate(
                                            habit
                                        );
                                        setMenuOpen(
                                            false
                                        );
                                    }}
                                    disabled={isReactivatePending}
                                    className="
          block
          w-full
          rounded-lg
          px-3
          py-2
          text-left
          text-sm
          text-foreground
          transition
          hover:bg-[#f7f5f0]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
                                >
                                    {isReactivatePending ? "Reactivating..." : "Reactivate habit"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {habit.description && (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {habit.description}
                </p>
            )}

            <div className="mt-5 border-t border-[#ebe5dc] pt-4">
                <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />

                        Started{" "}
                        {formatDate(
                            habit.startDate
                        )}
                    </span>

                    {habit.endDate && (
                        <span>
                            Ends{" "}
                            {formatDate(
                                habit.endDate
                            )}
                        </span>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${isScheduledToday
                            ? "bg-[#7c865b]/10 text-[#68734b]"
                            : "bg-[#eee9e1] text-muted-foreground"
                            }`}
                    >
                        {isScheduledToday
                            ? "Scheduled today"
                            : "Not scheduled today"}
                    </span>
                </div>

                {habit.frequency === "WEEKLY" && weeklyProgress && (
                    <div className="mt-4 rounded-xl bg-[#f7f5f0] p-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-foreground">
                                Weekly progress
                            </span>

                            <span className="text-sm font-semibold text-[#7c865b]">
                                {weeklyProgress.completed}/{weeklyProgress.target} days
                            </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee9e1]">
                            <div
                                className="h-full rounded-full bg-[#7c865b] transition-all"
                                style={{
                                    width: `${weeklyProgress.target > 0
                                        ? Math.min(
                                            (weeklyProgress.completed /
                                                weeklyProgress.target) *
                                            100,
                                            100
                                        )
                                        : 0
                                        }%`,
                                }}
                            />
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                            {weeklyProgress.achieved
                                ? "Weekly target achieved!"
                                : `${weeklyProgress.remaining} more ${weeklyProgress.remaining === 1 ? "day" : "days"
                                } to reach your weekly target`}
                        </p>
                    </div>
                )}

                {/* Measurable habit */}
                {isMeasurable && isScheduledToday && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-foreground">
                                Today's progress
                            </span>

                            <span className="text-sm font-semibold text-[#f4773c]">
                                {currentValue}
                                {habit.targetUnit
                                    ? ` ${habit.targetUnit}`
                                    : ""}

                                {" / "}

                                {habit.targetValue}
                                {habit.targetUnit
                                    ? ` ${habit.targetUnit}`
                                    : ""}
                            </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee9e1]">
                            <div
                                className="h-full rounded-full bg-[#f4773c] transition-all duration-300"
                                style={{
                                    width: `${progress}%`,
                                }}
                            />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                {progress}% complete
                            </span>

                            {progress < 100 && (
                                <span>
                                    {Math.max(
                                        Number(
                                            habit.targetValue
                                        ) -
                                        currentValue,
                                        0
                                    )}
                                    {habit.targetUnit
                                        ? ` ${habit.targetUnit}`
                                        : ""}{" "}
                                    remaining
                                </span>
                            )}

                            {progress >= 100 && (
                                <span className="font-medium text-[#7c865b]">
                                    Target reached
                                </span>
                            )}
                        </div>

                        {/* Only show logging button while target is incomplete */}
                        {habit.isActive &&
                            progress < 100 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onLogProgress(
                                            habit
                                        )
                                    }
                                    className="
          mt-4
          inline-flex
          items-center
          justify-center
          rounded-xl
          bg-[#f4773c]
          px-4
          py-2
          text-sm
          font-medium
          text-white
          transition
          hover:bg-[#e96b32]
        "
                                >
                                    Log progress
                                </button>
                            )}
                    </div>
                )}

                {/* Binary habit */}
                {!isMeasurable && isScheduledToday && (
                    <div
                        className={`
              mt-4
              flex
              items-center
              gap-2
              text-sm
              ${completed
                                ? "font-medium text-[#7c865b]"
                                : "text-muted-foreground"
                            }
            `}
                    >
                        {completed ? (
                            <>
                                <Check className="h-4 w-4" />

                                <span>
                                    Completed today
                                </span>
                            </>
                        ) : (
                            <>
                                <Circle className="h-4 w-4" />

                                <span>
                                    Not completed today
                                </span>

                                {habit.isActive && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onComplete(
                                                habit
                                            )
                                        }
                                        disabled={isCompletionPending}
                                        className="
          ml-2
          inline-flex
          items-center
          rounded-xl
          bg-[#f4773c]
          px-3
          py-1.5
          text-xs
          font-medium
          text-white
          transition
          hover:bg-[#e96b32]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
                                    >
                                        {isCompletionPending ? "Saving..." : "Mark complete"}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {!isScheduledToday && (
                    <div className="mt-4 rounded-xl bg-[#f7f5f0] p-4">
                        <p className="text-sm font-medium text-foreground">
                            Rest day!
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            This habit isn't scheduled for today. You can continue on
                            your next scheduled day.
                        </p>
                    </div>
                )}

                <div className="mt-4 border-t border-[#ebe5dc] pt-4">
                    <Link
                        href={`/habits/${habit.id}`}
                        className="
      inline-flex
      items-center
      text-sm
      font-medium
      text-[#f4773c]
      transition
      hover:text-[#e96b32]
    "
                    >
                        View details →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function HabitsPage() {
    const {
        data: habits = [],
        isLoading: habitsLoading,
        isError: habitsError,
    } = useQuery({
        queryKey: ["habits"],
        queryFn: getHabits,
    });

    const {
        data: dashboard,
        isLoading: dashboardLoading,
        isError: dashboardError,
    } = useQuery({
        queryKey: ["dashboard", "today"],
        queryFn: getTodayDashboard,
    });

    const todayHabits =
        dashboard?.habits ?? [];

    const dashboardHabitById = new Map(
        todayHabits.map((habit) => [habit.id, habit])
    );

    const todayByHabitId = new Map(
        todayHabits.map((habit) => [habit.id, habit.today])
    );

    const isLoading =
        habitsLoading || dashboardLoading;

    const isError =
        habitsError || dashboardError;

    const queryClient = useQueryClient();
    const [editHabit, setEditHabit] = useState<Habit | null>(null);
    const [deactivateHabit, setDeactivateHabit] =
        useState<Habit | null>(null);
    const [logHabit, setLogHabit] =
        useState<Habit | null>(null);

    const [habitFilter, setHabitFilter] = useState<
        "ALL" | "ACTIVE" | "DEACTIVATED"
    >("ALL");

    const filteredHabits = habits.filter((habit) => {
        if (habitFilter === "ACTIVE") {
            return habit.isActive;
        }

        if (habitFilter === "DEACTIVATED") {
            return !habit.isActive;
        }

        return true;
    });

    const [createOpen, setCreateOpen] =
        useState(false);

    const [completionValue, setCompletionValue] =
        useState("");

    const [createForm, setCreateForm] =
        useState<CreateHabitInput>({
            name: "",
            description: "",
            goalId: "",
            targetValue: undefined,
            targetUnit: "",
            frequency: "DAILY",
            weeklyTarget: undefined,
            customDays: [],
            startDate: new Date()
                .toISOString()
                .slice(0, 10),
            endDate: undefined,
        });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const goalId = params.get("goalId");

        if (!goalId) {
            return;
        }

        setCreateForm((current) => ({
            ...current,
            goalId,
        }));

        setCreateOpen(true);
    }, []);

    const [editForm, setEditForm] =
        useState<UpdateHabitInput>({
            name: "",
            description: "",
            goalId: null,
            targetValue: null,
            targetUnit: null,
            frequency: "DAILY",
            startDate: "",
            endDate: null,
            isActive: true,
        });

    const logHabitToday =
        logHabit
            ? todayByHabitId.get(logHabit.id)
            : undefined;

    const logHabitCurrentValue =
        logHabitToday?.value ?? 0;

    const logHabitTarget =
        logHabit?.targetValue !== null &&
            logHabit?.targetValue !== undefined
            ? Number(logHabit.targetValue)
            : 0;

    const logHabitRemaining = Math.max(
        logHabitTarget - logHabitCurrentValue,
        0
    );
    function openEditForm(habit: Habit) {
        setEditForm({
            name: habit.name,
            description: habit.description ?? "",
            goalId: habit.goalId,
            targetValue:
                habit.targetValue !== null
                    ? Number(habit.targetValue)
                    : null,
            targetUnit: habit.targetUnit,
            frequency: habit.frequency,
            weeklyTarget: habit.weeklyTarget ?? undefined,
            customDays: habit.customDays ?? [],
            startDate: habit.startDate.slice(0, 10),
            endDate: habit.endDate
                ? habit.endDate.slice(0, 10)
                : null,
            isActive: habit.isActive,
        });

        setEditHabit(habit);
    }

    function openLogProgress(habit: Habit) {
        setCompletionValue("");
        setLogHabit(habit);
    }

    function handleCompletionSubmit() {
        if (!logHabit) {
            return;
        }

        if (logHabit.targetValue !== null) {
            const value = Number(completionValue);

            if (!Number.isFinite(value) || value <= 0) {
                return;
            }

            completionMutation.mutate({
                habitId: logHabit.id,
                value,
            });

            return;
        }

        completionMutation.mutate({
            habitId: logHabit.id,
        });
    }

    const goalsQuery = useQuery({
        queryKey: ["goals"],
        queryFn: getGoals,
    });


    const updateHabitMutation = useMutation({
        mutationFn: ({
            habitId,
            input,
        }: {
            habitId: string;
            input: UpdateHabitInput;
        }) => updateHabit(habitId, input),

        onSuccess: async () => {
            toast.success("Habit updated successfully");

            await queryClient.invalidateQueries({
                queryKey: ["habits"],
            });

            await queryClient.invalidateQueries({
                queryKey: ["dashboard", "today"],
            });

            setEditHabit(null);
        },
        onError: () => {
            toast.error("Couldn't update the habit. Please try again.");
        },
    });

    const deactivateHabitMutation = useMutation({
        mutationFn: (habitId: string) =>
            updateHabit(habitId, {
                isActive: false,
            }),

        onSuccess: async () => {
            toast.success("Habit deactivated successfully");

            await queryClient.invalidateQueries({
                queryKey: ["habits"],
            });

            await queryClient.invalidateQueries({
                queryKey: ["dashboard", "today"],
            });
        },
        onError: () => {
            toast.error("Couldn't deactivate the habit. Please try again.");
        },
    });

    const reactivateHabitMutation = useMutation({
        mutationFn: (habitId: string) =>
            updateHabit(habitId, {
                isActive: true,
            }),

        onSuccess: async () => {
            toast.success("Habit reactivated successfully");

            await queryClient.invalidateQueries({
                queryKey: ["habits"],
            });

            await queryClient.invalidateQueries({
                queryKey: ["dashboard", "today"],
            });
        },
        onError: () => {
            toast.error("Couldn't reactivate the habit. Please try again.");
        },
    });

    const completionMutation = useMutation({
        mutationFn: ({
            habitId,
            value,
        }: {
            habitId: string;
            value?: number;
        }) =>
            createHabitCompletion(habitId, {
                completedAt: new Date().toISOString(),
                ...(value !== undefined && {
                    value,
                }),
            }),

        onSuccess: async () => {
            toast.success("Progress recorded successfully");

            await queryClient.invalidateQueries({
                queryKey: ["habits"],
            });

            await queryClient.invalidateQueries({
                queryKey: ["dashboard", "today"],
            });

            if (logHabit) {
                await queryClient.invalidateQueries({
                    queryKey: ["habit", logHabit.id],
                });
            }

            setLogHabit(null);
        },
        onError: () => {
            toast.error(
                "Couldn't record progress. Please try again."
            );
        },
    });

    const createHabitMutation = useMutation({
        mutationFn: (input: CreateHabitInput) =>
            createHabit(input),

        onSuccess: async () => {

            toast.success("Habit created successfully");

            await queryClient.invalidateQueries({
                queryKey: ["habits"],
            });

            await queryClient.invalidateQueries({
                queryKey: ["dashboard", "today"],
            });

            setCreateOpen(false);

            setCreateForm({
                name: "",
                description: "",
                goalId: "",
                targetValue: undefined,
                targetUnit: "",
                frequency: "DAILY",
                weeklyTarget: undefined,
                customDays: [],
                startDate: new Date()
                    .toISOString()
                    .slice(0, 10),
                endDate: undefined,
            });
        },
        onError: () => {
            toast.error("Couldn't create the habit. Please try again.");
        },
    });


    return (
        <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-[#f4773c]">
                        Your routine
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        Habits
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Build consistent routines and keep track of
                        your daily progress.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[#f4773c]
            px-4
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-[#e96b32]
          "
                >
                    <Plus className="h-4 w-4" />
                    Add Habit
                </button>
            </div>

            {isLoading && (
                <div className="habitbot-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Loading your habits...
                    </p>
                </div>
            )}

            {isError && (
                <div className="habitbot-card p-8 text-center">
                    <p className="text-sm font-medium text-foreground">
                        We couldn't load your habits.
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Please try refreshing the page.
                    </p>
                </div>
            )}

            {!isLoading &&
                !isError &&
                habits.length === 0 && (
                    <div className="habitbot-card p-10 text-center">
                        <div
                            className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-[#f4773c]/10
                text-[#f4773c]
              "
                        >
                            <Plus className="h-5 w-5" />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-foreground">
                            No habits yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                            Create your first habit and start building
                            a routine that works for you.
                        </p>

                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="
                mt-5
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                bg-[#f4773c]
                px-4
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#e96b32]
              "
                        >
                            <Plus className="h-4 w-4" />
                            Create your first habit
                        </button>
                    </div>
                )}

            {!isLoading &&
                !isError &&
                habits.length === 0 && (
                    <section className="habitbot-card flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4773c]/10 text-[#f4773c]">
                            <Plus className="h-7 w-7" />
                        </div>

                        <h2 className="mt-5 text-xl font-semibold text-foreground">
                            No habits yet
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                            Start building better routines by creating your first habit.
                            Track your progress and stay consistent with HabitBot.
                        </p>

                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="
                    mt-6
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-[#f4773c]
                    px-5
                    py-2.5
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-[#e96b32]
                "
                        >
                            <Plus className="h-4 w-4" />
                            Create your first habit
                        </button>
                    </section>
                )}


            {!isLoading && !isError && habits.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {(
                        [
                            { value: "ALL", label: "All" },
                            { value: "ACTIVE", label: "Active" },
                            {
                                value: "DEACTIVATED",
                                label: "Deactivated",
                            },
                        ] as const
                    ).map((filter) => {
                        const count =
                            filter.value === "ALL"
                                ? habits.length
                                : filter.value === "ACTIVE"
                                    ? habits.filter((habit) => habit.isActive).length
                                    : habits.filter((habit) => !habit.isActive).length;

                        const isSelected = habitFilter === filter.value;

                        return (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => setHabitFilter(filter.value)}
                                aria-pressed={isSelected}
                                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${isSelected
                                    ? "border-[#f4773c] bg-[#f4773c]/10 text-[#e96b32]"
                                    : "border-[#ebe5dc] bg-[#fffdfa] text-muted-foreground hover:bg-[#f3efe8]"
                                    }`}
                            >
                                {filter.label}
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${isSelected
                                        ? "bg-[#f4773c]/15 text-[#e96b32]"
                                        : "bg-[#eee9e1] text-muted-foreground"
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}


            {!isLoading &&
                !isError &&
                habits.length > 0 && (
                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {filteredHabits.map((habit) => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                dashboardHabit={dashboardHabitById.get(habit.id)}
                                onEdit={openEditForm}
                                onDeactivate={(habit) =>
                                    setDeactivateHabit(habit)
                                }
                                onReactivate={(habit) =>
                                    reactivateHabitMutation.mutate(habit.id)
                                }
                                onLogProgress={openLogProgress}
                                onComplete={(habit) =>
                                    completionMutation.mutate({
                                        habitId: habit.id,
                                    })
                                }
                                isCompletionPending={completionMutation.isPending}
                                isReactivatePending={reactivateHabitMutation.isPending}
                            />
                        ))}
                    </section>
                )}
            {editHabit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fffdfa] p-6 shadow-xl">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    Edit habit
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Update your habit details and tracking settings.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setEditHabit(null)}
                                className="text-xl text-muted-foreground transition hover:text-foreground"
                                aria-label="Close edit habit form"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();

                                updateHabitMutation.mutate({
                                    habitId: editHabit.id,
                                    input: {
                                        ...editForm,
                                        name: editForm.name?.trim(),
                                        description:
                                            editForm.description?.trim() || null,
                                    },
                                });
                            }}
                            className="space-y-5"
                        >
                            {/* Habit name */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Habit name
                                </label>

                                <input
                                    type="text"
                                    value={editForm.name ?? ""}
                                    onChange={(event) =>
                                        setEditForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    required
                                    minLength={2}
                                    maxLength={150}
                                    className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Description
                                </label>

                                <textarea
                                    value={editForm.description ?? ""}
                                    onChange={(event) =>
                                        setEditForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    rows={3}
                                    maxLength={1000}
                                    className="w-full resize-none rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                />
                            </div>

                            {/* Goal */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Goal
                                </label>

                                <select
                                    value={editForm.goalId ?? ""}
                                    onChange={(event) =>
                                        setEditForm((current) => ({
                                            ...current,
                                            goalId: event.target.value || null,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                >
                                    <option value="">No goal</option>

                                    {goalsQuery.data?.map((goal: Goal) => (
                                        <option
                                            key={goal.id}
                                            value={goal.id}
                                        >
                                            {goal.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Frequency
                                </label>

                                <select
                                    value={editForm.frequency}
                                    onChange={(event) => {
                                        const frequency =
                                            event.target.value as Habit["frequency"];

                                        setEditForm((current) => ({
                                            ...current,
                                            frequency,
                                            weeklyTarget:
                                                frequency === "WEEKLY"
                                                    ? current.frequency === "WEEKLY"
                                                        ? current.weeklyTarget
                                                        : undefined
                                                    : undefined,
                                            customDays:
                                                frequency === "CUSTOM"
                                                    ? current.frequency === "CUSTOM"
                                                        ? current.customDays ?? []
                                                        : []
                                                    : [],
                                        }));
                                    }}
                                    className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="CUSTOM">Custom</option>
                                </select>
                            </div>

                            {/* Weekly target */}
                            {editForm.frequency === "WEEKLY" && (
                                <div className="rounded-xl border border-[#e6dfd4] bg-[#f7f5f0] p-4">
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Weekly completion target
                                    </label>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min={1}
                                            max={7}
                                            step={1}
                                            required
                                            value={editForm.weeklyTarget ?? ""}
                                            onChange={(event) =>
                                                setEditForm((current) => ({
                                                    ...current,
                                                    weeklyTarget:
                                                        event.target.value === ""
                                                            ? undefined
                                                            : Number(event.target.value),
                                                }))
                                            }
                                            className="w-28 rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4773c]"
                                        />

                                        <span className="text-sm text-muted-foreground">
                                            times per week
                                        </span>
                                    </div>

                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Choose how many days you want to complete this habit each week.
                                    </p>
                                </div>
                            )}

                            {/* Custom weekdays */}
                            {editForm.frequency === "CUSTOM" && (
                                <div className="rounded-xl border border-[#e6dfd4] bg-[#f7f5f0] p-4">
                                    <WeekdaySelector
                                        selectedDays={editForm.customDays ?? []}
                                        onChange={(days) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                customDays: days,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            {/* Target */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Target value
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={editForm.targetValue ?? ""}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                targetValue:
                                                    event.target.value === ""
                                                        ? null
                                                        : Number(event.target.value),
                                            }))
                                        }
                                        className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Target unit
                                    </label>

                                    <input
                                        type="text"
                                        value={editForm.targetUnit ?? ""}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                targetUnit:
                                                    event.target.value || null,
                                            }))
                                        }
                                        maxLength={50}
                                        placeholder="e.g. steps, minutes, pages"
                                        className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Start date
                                    </label>

                                    <input
                                        type="date"
                                        value={editForm.startDate ?? ""}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                startDate: event.target.value,
                                            }))
                                        }
                                        required
                                        className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        End date
                                    </label>

                                    <input
                                        type="date"
                                        value={editForm.endDate ?? ""}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                                ...current,
                                                endDate:
                                                    event.target.value || null,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                    />
                                </div>
                            </div>

                            {/* Active status */}
                            <label className="flex items-center gap-3 rounded-xl border border-[#e6dfd4] p-4">
                                <input
                                    type="checkbox"
                                    checked={editForm.isActive ?? true}
                                    onChange={(event) =>
                                        setEditForm((current) => ({
                                            ...current,
                                            isActive: event.target.checked,
                                        }))
                                    }
                                    className="h-4 w-4 accent-[#f4773c]"
                                />

                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Active habit
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Inactive habits will no longer be tracked.
                                    </p>
                                </div>
                            </label>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 border-t border-[#ebe5dc] pt-5">
                                <button
                                    type="button"
                                    onClick={() => setEditHabit(null)}
                                    className="rounded-xl border border-[#e6dfd4] px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-[#f7f5f0]"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={updateHabitMutation.isPending}
                                    className="rounded-xl bg-[#f4773c] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#e96b32] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {updateHabitMutation.isPending
                                        ? "Saving..."
                                        : "Save changes"}
                                </button>
                            </div>

                            {updateHabitMutation.isError && (
                                <p className="text-sm text-red-600">
                                    We couldn't update this habit. Please try again.
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fffdfa] p-6 shadow-xl">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    Create habit
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add a new habit to your routine.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setCreateOpen(false)}
                                className="text-xl text-muted-foreground transition hover:text-foreground"
                                aria-label="Close create habit form"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();

                                createHabitMutation.mutate({
                                    ...createForm,
                                    name: createForm.name.trim(),
                                    description:
                                        createForm.description?.trim() || undefined,
                                    goalId:
                                        createForm.goalId || undefined,
                                    targetValue:
                                        createForm.targetValue,
                                    targetUnit:
                                        createForm.targetUnit?.trim() || undefined,
                                    endDate:
                                        createForm.endDate || undefined,
                                });
                            }}
                            className="space-y-5"
                        >
                            {/* Habit name */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Habit name
                                </label>

                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    required
                                    minLength={2}
                                    maxLength={150}
                                    placeholder="e.g. Walk every morning"
                                    className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Description
                                </label>

                                <textarea
                                    value={createForm.description ?? ""}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    rows={3}
                                    maxLength={1000}
                                    placeholder="What do you want to accomplish?"
                                    className="w-full resize-none rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                />
                            </div>

                            {/* Goal */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Goal
                                </label>

                                <select
                                    value={createForm.goalId ?? ""}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            goalId: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                >
                                    <option value="">No goal</option>

                                    {goalsQuery.data?.map((goal: Goal) => (
                                        <option
                                            key={goal.id}
                                            value={goal.id}
                                        >
                                            {goal.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    Frequency
                                </label>

                                <select
                                    value={createForm.frequency}
                                    onChange={(event) => {
                                        const frequency =
                                            event.target.value as CreateHabitInput["frequency"];

                                        setCreateForm((current) => ({
                                            ...current,
                                            frequency,
                                            weeklyTarget: undefined,
                                            customDays: [],
                                        }));
                                    }}
                                    className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                >
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="CUSTOM">Custom</option>
                                </select>
                            </div>

                            {/* Weekly target */}
                            {createForm.frequency === "WEEKLY" && (
                                <div className="rounded-xl border border-[#e6dfd4] bg-[#f7f5f0] p-4">
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Weekly completion target
                                    </label>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min={1}
                                            max={7}
                                            step={1}
                                            required
                                            value={createForm.weeklyTarget ?? ""}
                                            onChange={(event) =>
                                                setCreateForm((current) => ({
                                                    ...current,
                                                    weeklyTarget:
                                                        event.target.value === ""
                                                            ? undefined
                                                            : Number(event.target.value),
                                                }))
                                            }
                                            className="w-28 rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4773c]"
                                        />

                                        <span className="text-sm text-muted-foreground">
                                            times per week
                                        </span>
                                    </div>

                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Choose how many days you want to complete this habit each week.
                                    </p>
                                </div>
                            )}

                            {/* Custom weekdays */}
                            {createForm.frequency === "CUSTOM" && (
                                <div className="rounded-xl border border-[#e6dfd4] bg-[#f7f5f0] p-4">
                                    <WeekdaySelector
                                        selectedDays={createForm.customDays ?? []}
                                        onChange={(days) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                customDays: days,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            {/* Target */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Target value
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={createForm.targetValue ?? ""}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                targetValue:
                                                    event.target.value === ""
                                                        ? undefined
                                                        : Number(event.target.value),
                                            }))
                                        }
                                        placeholder="e.g. 10000"
                                        className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Target unit
                                    </label>

                                    <input
                                        type="text"
                                        value={createForm.targetUnit ?? ""}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                targetUnit: event.target.value,
                                            }))
                                        }
                                        maxLength={50}
                                        placeholder="e.g. steps, minutes, pages"
                                        className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Start date
                                    </label>

                                    <input
                                        type="date"
                                        value={createForm.startDate}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                startDate: event.target.value,
                                            }))
                                        }
                                        required
                                        className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        End date
                                    </label>

                                    <input
                                        type="date"
                                        value={createForm.endDate ?? ""}
                                        onChange={(event) =>
                                            setCreateForm((current) => ({
                                                ...current,
                                                endDate:
                                                    event.target.value || undefined,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {createHabitMutation.isError && (
                                <p className="text-sm text-red-600">
                                    We couldn't create this habit. Please check your
                                    details and try again.
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 border-t border-[#ebe5dc] pt-5">
                                <button
                                    type="button"
                                    onClick={() => setCreateOpen(false)}
                                    className="rounded-xl border border-[#e6dfd4] px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-[#f7f5f0]"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={createHabitMutation.isPending}
                                    className="rounded-xl bg-[#f4773c] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#e96b32] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {createHabitMutation.isPending
                                        ? "Creating..."
                                        : "Create habit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deactivateHabit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-[#fffdfa] p-6 shadow-xl">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">
                                Deactivate habit?
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    "{deactivateHabit.name}"
                                </span>{" "}
                                will stop appearing as an active habit. Your
                                existing completion history will be preserved.
                            </p>
                        </div>

                        {deactivateHabitMutation.isError && (
                            <p className="mt-4 text-sm text-red-600">
                                We couldn't deactivate this habit. Please try
                                again.
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeactivateHabit(null)}
                                disabled={deactivateHabitMutation.isPending}
                                className="rounded-xl border border-[#e6dfd4] px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-[#f7f5f0] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    deactivateHabitMutation.mutate(
                                        deactivateHabit.id,
                                        {
                                            onSuccess: () => {
                                                setDeactivateHabit(null);
                                            },
                                        }
                                    );
                                }}
                                disabled={deactivateHabitMutation.isPending}
                                className="rounded-xl bg-[#f4773c] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#e96b32] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deactivateHabitMutation.isPending
                                    ? "Deactivating..."
                                    : "Deactivate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {logHabit && logHabit.targetValue !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-[#fffdfa] p-6 shadow-xl">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    Log progress
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Record your progress for today.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setLogHabit(null);
                                    setCompletionValue("");
                                }}
                                className="text-xl text-muted-foreground transition hover:text-foreground"
                                aria-label="Close log progress form"
                            >
                                ×
                            </button>
                        </div>

                        <div className="rounded-xl bg-[#f7f5f0] p-4">
                            <p className="text-sm font-medium text-foreground">
                                {logHabit.name}
                            </p>

                            <div className="mt-3 grid grid-cols-3 gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Target
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {logHabitTarget}
                                        {logHabit.targetUnit
                                            ? ` ${logHabit.targetUnit}`
                                            : ""}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Logged
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {logHabitCurrentValue}
                                        {logHabit.targetUnit
                                            ? ` ${logHabit.targetUnit}`
                                            : ""}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Remaining
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-[#f4773c]">
                                        {logHabitRemaining}
                                        {logHabit.targetUnit
                                            ? ` ${logHabit.targetUnit}`
                                            : ""}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className="mb-2 block text-sm font-medium text-foreground">
                                Amount
                            </label>

                            <input
                                type="number"
                                min="0"
                                max={logHabitRemaining}
                                step="any"
                                value={completionValue}
                                onChange={(event) =>
                                    setCompletionValue(event.target.value)
                                }
                                placeholder={`Enter ${logHabit.targetUnit ?? "amount"}`}
                                autoFocus
                                className="w-full rounded-xl border border-[#e6dfd4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f4773c]"
                            />

                            {logHabitRemaining > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCompletionValue(
                                            String(logHabitRemaining)
                                        )
                                    }
                                    className="mt-3 text-xs font-medium text-[#f4773c] transition hover:text-[#e96b32]"
                                >
                                    Log remaining {logHabitRemaining}
                                    {logHabit.targetUnit
                                        ? ` ${logHabit.targetUnit}`
                                        : ""}
                                </button>
                            )}

                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    {logHabit.targetUnit
                                        ? `Unit: ${logHabit.targetUnit}`
                                        : "Enter your actual progress"}
                                </span>

                                <span>
                                    Up to {logHabitRemaining}
                                    {logHabit.targetUnit
                                        ? ` ${logHabit.targetUnit}`
                                        : ""}
                                </span>
                            </div>
                        </div>

                        {completionMutation.isError && (
                            <p className="mt-4 text-sm text-red-600">
                                We couldn't record this progress. You may have
                                already reached today's target or entered too much.
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3 border-t border-[#ebe5dc] pt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setLogHabit(null);
                                    setCompletionValue("");
                                }}
                                disabled={completionMutation.isPending}
                                className="rounded-xl border border-[#e6dfd4] px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-[#f7f5f0] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleCompletionSubmit}
                                disabled={
                                    completionMutation.isPending ||
                                    !completionValue ||
                                    Number(completionValue) <= 0
                                }
                                className="rounded-xl bg-[#f4773c] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#e96b32] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {completionMutation.isPending
                                    ? "Saving..."
                                    : "Log progress"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
}