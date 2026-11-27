
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flame,
  Target,
  Trophy,
  TrendingUp,
  Bell,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { getHabitById, type Habit, type HabitWeekday } from "@/lib/api/habits";
import {
  getHabitCompletions,
  getHabitStats,
  type Completion,
} from "@/lib/api/completions";

import {
  useHabitReminders,
  useCreateHabitReminder,
  useUpdateHabitReminder,
  useDeleteHabitReminder,
} from "@/hooks/use-habit-reminders";


const ACCENT = "#f4773c";
const OLIVE = "#7c865b";
const LAVENDER = "#7563a8";

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "Not set";

  const datePart = date.split("T")[0];
  const parts = datePart.split("-");

  if (parts.length !== 3) return "Not set";

  const [year, month, day] = parts.map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "Not set";
  }

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatFrequency(frequency: Habit["frequency"]): string {
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

const WEEKDAYS: { value: HabitWeekday; label: string }[] = [
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
  { value: "SATURDAY", label: "Sat" },
  { value: "SUNDAY", label: "Sun" },
];

function formatSchedule(habit: Habit): string {
  switch (habit.frequency) {
    case "DAILY":
      return "Every day";

    case "WEEKLY":
      return `${habit.weeklyTarget ?? 0} times per week`;

    case "CUSTOM":
      return (habit.customDays ?? [])
        .map(
          (day) =>
            WEEKDAYS.find((weekday) => weekday.value === day)?.label
        )
        .filter(Boolean)
        .join(", ") || "No days selected";

    default:
      return formatFrequency(habit.frequency);
  }
}

function isScheduledOnDate(habit: Habit, date: string): boolean {
  const startDate = habit.startDate.slice(0, 10);
  const endDate = habit.endDate?.slice(0, 10);

  if (date < startDate || (endDate && date > endDate)) {
    return false;
  }

  if (habit.frequency === "DAILY" || habit.frequency === "WEEKLY") {
    return true;
  }

  const weekdayIndex = new Date(`${date}T00:00:00Z`).getUTCDay();

  const weekdayMap: HabitWeekday[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return (habit.customDays ?? []).includes(weekdayMap[weekdayIndex]);
}

type DailyHistory = {
  date: string;
  value: number;
  completed: boolean;
};

function buildDailyHistory(
  habit: Habit,
  completions: Completion[]
): DailyHistory[] {
  const history = new Map<string, DailyHistory>();

  for (const completion of completions) {
    const date = getLocalDateKey(new Date(completion.completedAt));
    const existing = history.get(date);

    if (existing) {
      if (habit.targetValue !== null) {
        existing.value += Number(completion.value ?? 0);
      }
      existing.completed = true;
      continue;
    }

    history.set(date, {
      date,
      value:
        habit.targetValue !== null
          ? Number(completion.value ?? 0)
          : 0,
      completed: true,
    });
  }

  return Array.from(history.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

function StatCard({
  label,
  value,
  suffix,
  description,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  description: string;
  icon: typeof Flame;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="habitbot-card min-w-0 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>
        <Icon
          className="h-5 w-5 shrink-0"
          style={{ color: accent }}
        />
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {loading ? "—" : value}
        {!loading && suffix && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default function HabitDetailsPage() {
  const params = useParams<{ id: string }>();
  const habitId = params.id;

  const [newReminderTime, setNewReminderTime] = useState("08:00");
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingReminderTime, setEditingReminderTime] = useState("");

  const {
    data: reminders = [],
    isLoading: remindersLoading,
    isError: remindersError,
  } = useHabitReminders(habitId);

  const createReminder = useCreateHabitReminder(habitId);
  const updateReminder = useUpdateHabitReminder(habitId);
  const deleteReminder = useDeleteHabitReminder(habitId);

  const handleAddReminder = () => {
    createReminder.mutate(
      { time: newReminderTime },
      {
        onSuccess: () => {
          // Keep the selected time for convenient additional reminders.
        },
      }
    );
  };

  const handleUpdateReminder = (reminderId: string) => {
    if (!editingReminderTime) return;

    updateReminder.mutate(
      {
        reminderId,
        input: { time: editingReminderTime },
      },
      {
        onSuccess: () => {
          setEditingReminderId(null);
          setEditingReminderTime("");
        },
      }
    );
  };

  const handleToggleReminder = (
    reminderId: string,
    isEnabled: boolean
  ) => {
    updateReminder.mutate({
      reminderId,
      input: { isEnabled: !isEnabled },
    });
  };

  const handleDeleteReminder = (reminderId: string) => {
    if (!window.confirm("Delete this reminder?")) return;

    deleteReminder.mutate(reminderId);
  };

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    data: habit,
    isLoading: habitLoading,
    isError: habitError,
  } = useQuery({
    queryKey: ["habit", habitId],
    queryFn: () => getHabitById(habitId),
    enabled: Boolean(habitId),
  });

  const {
    data: completions = [],
    isLoading: completionsLoading,
    isError: completionsError,
  } = useQuery({
    queryKey: ["habit", habitId, "completions"],
    queryFn: () => getHabitCompletions(habitId),
    enabled: Boolean(habitId),
  });

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["habit", habitId, "stats"],
    queryFn: () => getHabitStats(habitId),
    enabled: Boolean(habitId),
  });

  if (habitLoading) {
    return (
      <main className="space-y-6">
        <div className="habitbot-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Loading habit...
          </p>
        </div>
      </main>
    );
  }

  if (habitError || !habit) {
    return (
      <main className="space-y-6">
        <Link
          href="/habits"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to habits
        </Link>

        <div className="habitbot-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            We couldn&apos;t load this habit.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The habit may no longer exist.
          </p>
        </div>
      </main>
    );
  }

  const isMeasurable = habit.targetValue !== null;
  const target = isMeasurable ? Number(habit.targetValue) : null;
  const today = getLocalDateKey(new Date());

  const todayCompletions = completions.filter(
    (completion) =>
      getLocalDateKey(new Date(completion.completedAt)) === today
  );

  const todayValue = todayCompletions.reduce(
    (sum, completion) => sum + Number(completion.value ?? 0),
    0
  );

  const todayCompleted = isMeasurable
    ? target !== null && target > 0 && todayValue >= target
    : todayCompletions.length > 0;

  const todayProgress =
    isMeasurable && target !== null && target > 0
      ? Math.min(Math.round((todayValue / target) * 100), 100)
      : todayCompleted
        ? 100
        : 0;

  const dailyHistory = buildDailyHistory(habit, completions);

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();

  const daysInMonth = new Date(
    calendarYear,
    calendarMonthIndex + 1,
    0
  ).getDate();

  const startingDayOffset =
    (new Date(calendarYear, calendarMonthIndex, 1).getDay() + 6) % 7;

  const calendarDays = Array.from(
    { length: startingDayOffset + daysInMonth },
    (_, index) =>
      index < startingDayOffset
        ? null
        : index - startingDayOffset + 1
  );

  const calendarMonthLabel = calendarMonth.toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const previousMonth = () => {
    setCalendarMonth(
      new Date(calendarYear, calendarMonthIndex - 1, 1)
    );
  };

  const nextMonth = () => {
    setCalendarMonth(
      new Date(calendarYear, calendarMonthIndex + 1, 1)
    );
  };

  const historyByDate = new Map(
    dailyHistory.map((entry) => [entry.date, entry])
  );

  return (
    <main className="space-y-5">
      <Link
        href="/habits"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to habits
      </Link>

      {/* Habit heading */}
      <section>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4773c]/10 text-[#f4773c]">
            {todayCompleted ? (
              <Check className="h-5 w-5" />
            ) : (
              <Target className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {habit.name}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{formatSchedule(habit)}</span>
              {habit.goal && (
                <>
                  <span>·</span>
                  <span>{habit.goal.title}</span>
                </>
              )}
              {!habit.isActive && (
                <>
                  <span>·</span>
                  <span className="text-[#f4773c]">Inactive</span>
                </>
              )}
            </div>
          </div>
        </div>

        {habit.description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {habit.description}
          </p>
        )}
      </section>

      {/* Habit schedule */}
      <section className="habitbot-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#7c865b]" />
          <h2 className="text-base font-semibold text-foreground">
            Habit schedule
          </h2>
        </div>

        <p className="mt-2 text-sm font-medium text-foreground">
          {formatSchedule(habit)}
        </p>

        {habit.frequency === "WEEKLY" && (
          <p className="mt-1 text-xs text-muted-foreground">
            Complete this habit on any {habit.weeklyTarget} days of the week.
          </p>
        )}

        {habit.frequency === "CUSTOM" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const selected = (habit.customDays ?? []).includes(day.value);

              return (
                <span
                  key={day.value}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selected
                    ? "bg-[#7c865b]/10 text-[#68734b]"
                    : "bg-[#f7f5f0] text-muted-foreground"
                    }`}
                >
                  {day.label}
                </span>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Started {formatDate(habit.startDate)}
          {habit.endDate ? ` · Ends ${formatDate(habit.endDate)}` : ""}
        </p>
      </section>


      {/* Habit reminders */}
      <section className="habitbot-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#f4773c]" />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Reminders
            </h2>
            <p className="text-xs text-muted-foreground">
              Get notified when it's time to work on this habit.
            </p>
          </div>
        </div>

        {/* Add reminder */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="time"
              value={newReminderTime}
              onChange={(event) => setNewReminderTime(event.target.value)}
              className="w-full rounded-xl border border-[#e6dfd4] bg-white py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-[#f4773c] focus:ring-2 focus:ring-[#f4773c]/15"
              aria-label="New reminder time"
            />
          </div>

          <button
            type="button"
            onClick={handleAddReminder}
            disabled={createReminder.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f4773c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#e96830] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {createReminder.isPending ? "Adding..." : "Add reminder"}
          </button>
        </div>

        {createReminder.isError && (
          <p className="mt-2 text-xs text-red-600">
            Could not add reminder. Check whether this time already exists.
          </p>
        )}

        {/* Reminder list */}
        <div className="mt-4 space-y-2">
          {remindersLoading && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Loading reminders...
            </p>
          )}

          {remindersError && (
            <p className="py-4 text-center text-sm text-red-600">
              Could not load reminders. Please try again.
            </p>
          )}

          {!remindersLoading &&
            !remindersError &&
            reminders.length === 0 && (
              <div className="rounded-xl bg-[#f7f5f0] p-5 text-center">
                <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No reminders yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add a reminder to stay consistent with this habit.
                </p>
              </div>
            )}

          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ebe5dc] bg-white p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f4773c]/10 text-[#f4773c]">
                  <Clock className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  {editingReminderId === reminder.id ? (
                    <input
                      type="time"
                      value={editingReminderTime}
                      onChange={(event) =>
                        setEditingReminderTime(event.target.value)
                      }
                      className="w-full max-w-36 rounded-lg border border-[#e6dfd4] px-2 py-1.5 text-sm outline-none focus:border-[#f4773c]"
                      aria-label="Edit reminder time"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-foreground">
                      {reminder.time}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {reminder.isEnabled ? "Active" : "Disabled"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {editingReminderId === reminder.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateReminder(reminder.id)}
                      disabled={
                        updateReminder.isPending || !editingReminderTime
                      }
                      className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#7c865b] transition hover:bg-[#7c865b]/10 disabled:opacity-50"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingReminderId(null);
                        setEditingReminderTime("");
                      }}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-[#f7f5f0]"
                      aria-label="Cancel editing"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReminderId(reminder.id);
                        setEditingReminderTime(reminder.time);
                      }}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-[#f7f5f0] hover:text-foreground"
                      aria-label="Edit reminder"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleReminder(
                          reminder.id,
                          reminder.isEnabled
                        )
                      }
                      disabled={updateReminder.isPending}
                      className={`relative h-6 w-11 rounded-full transition ${reminder.isEnabled
                          ? "bg-[#7c865b]"
                          : "bg-[#d6d0c6]"
                        } disabled:opacity-50`}
                      role="switch"
                      aria-checked={reminder.isEnabled}
                      aria-label={`${reminder.isEnabled ? "Disable" : "Enable"
                        } reminder at ${reminder.time}`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${reminder.isEnabled
                            ? "left-[22px]"
                            : "left-0.5"
                          }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      disabled={deleteReminder.isPending}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label="Delete reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {updateReminder.isError && (
          <p className="mt-2 text-xs text-red-600">
            Could not update reminder. Please check the time and try again.
          </p>
        )}

        {deleteReminder.isError && (
          <p className="mt-2 text-xs text-red-600">
            Could not delete reminder. Please try again.
          </p>
        )}
      </section>


      {/* Today's progress and activity */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="habitbot-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Today&apos;s Progress
              </p>

              {isMeasurable ? (
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {todayValue.toLocaleString()}
                  <span className="text-base font-normal text-muted-foreground">
                    {" / "}
                    {habit.targetValue}
                    {habit.targetUnit ? ` ${habit.targetUnit}` : ""}
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {todayCompleted ? "Completed" : "Not completed"}
                </p>
              )}
            </div>

            <span className="text-2xl font-semibold text-[#f4773c]">
              {todayProgress}%
            </span>
          </div>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee9e1]"
            role="progressbar"
            aria-label="Today's habit progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={todayProgress}
          >
            <div
              className="h-full rounded-full bg-[#f4773c] transition-all duration-300"
              style={{ width: `${todayProgress}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {isMeasurable && target !== null
              ? todayProgress >= 100
                ? "Daily target reached"
                : `${Math.max(target - todayValue, 0).toLocaleString()}${habit.targetUnit ? ` ${habit.targetUnit}` : ""} remaining`
              : todayCompleted
                ? "Nice work — habit completed today"
                : "Complete this habit to build your streak"}
          </p>
        </div>

        <div className="habitbot-card flex items-center gap-3 p-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7c865b]/10 text-[#7c865b]">
            <Flame className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Activity
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {dailyHistory.length}
            </p>
            <p className="text-xs text-muted-foreground">
              days with recorded activity
            </p>
          </div>
        </div>
      </section>

      {/* Weekly target progress */}
      {habit.frequency === "WEEKLY" && stats?.weeklyProgress && (
        <section className="habitbot-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                This week's progress
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your weekly completion target
              </p>
            </div>

            <Target className="h-5 w-5 text-[#7c865b]" />
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold text-foreground">
              {stats.weeklyProgress.completed}
              <span className="text-base font-normal text-muted-foreground">
                {" / "}
                {stats.weeklyProgress.target} days
              </span>
            </p>

            <span className="text-sm font-semibold text-[#7c865b]">
              {stats.weeklyProgress.achieved
                ? "Target achieved"
                : `${stats.weeklyProgress.remaining} remaining`}
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee9e1]">
            <div
              className="h-full rounded-full bg-[#7c865b] transition-all"
              style={{
                width: `${stats.weeklyProgress.target > 0
                  ? Math.min(
                    (stats.weeklyProgress.completed /
                      stats.weeklyProgress.target) *
                    100,
                    100
                  )
                  : 0
                  }%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {stats.weeklyProgress.achieved
              ? "You've reached your weekly target. Keep it up!"
              : "You can complete this habit on any remaining day this week."}
          </p>
        </section>
      )}

      {/* Streak statistics */}
      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Your consistency
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick look at your progress over time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Current Streak"
            value={stats?.currentStreak ?? 0}
            suffix={habit.frequency === "WEEKLY" ? "weeks" : "days"}
            description={
              habit.frequency === "WEEKLY"
                ? "Consecutive weeks meeting your target"
                : "Consecutive scheduled days completed"
            }
            icon={Flame}
            accent={ACCENT}
            loading={statsLoading || statsError}
          />

          <StatCard
            label="Longest Streak"
            value={stats?.longestStreak ?? 0}
            suffix={habit.frequency === "WEEKLY" ? "weeks" : "days"}
            description="Your personal best"
            icon={Trophy}
            accent={OLIVE}
            loading={statsLoading || statsError}
          />

          <StatCard
            label="Completion Rate"
            value={`${Math.round(stats?.completionRate ?? 0)}%`}
            description="Across your tracking history"
            icon={TrendingUp}
            accent={LAVENDER}
            loading={statsLoading || statsError}
          />
        </div>
      </section>

      {/* Calendar and history */}
      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        {/* Habit calendar */}
        <div className="habitbot-card min-w-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Habit Calendar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your day-by-day consistency.
              </p>
            </div>
            <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              {calendarMonthLabel}
            </h3>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={previousMonth}
                aria-label="Previous month"
                className="rounded-lg border border-[#ebe5dc] p-2 transition hover:bg-[#f7f5f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4773c]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="rounded-lg border border-[#ebe5dc] p-2 transition hover:bg-[#f7f5f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4773c]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-[11px] font-medium text-muted-foreground sm:text-xs"
                >
                  {day}
                </div>
              )
            )}


            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} aria-hidden="true" />;
              }

              const dateKey = [
                calendarYear,
                String(calendarMonthIndex + 1).padStart(2, "0"),
                String(day).padStart(2, "0"),
              ].join("-");

              const isToday = dateKey === today;
              const isFuture = dateKey > today;
              const isWeekly = habit.frequency === "WEEKLY";
              const isScheduled = isScheduledOnDate(habit, dateKey);
              const dayHistory = historyByDate.get(dateKey);

              const isCompleted = isMeasurable
                ? Boolean(
                  dayHistory &&
                  target !== null &&
                  target > 0 &&
                  dayHistory.value >= target
                )
                : Boolean(dayHistory?.completed);

              // Weekly habits are flexible: an incomplete day is not a missed day.
              const isMissed =
                !isWeekly && !isFuture && isScheduled && !isCompleted;

              const status = isCompleted
                ? "Completed"
                : !isScheduled
                  ? "Rest day"
                  : isToday
                    ? "Today"
                    : isFuture
                      ? "Available"
                      : isWeekly
                        ? "Flexible day — no completion recorded"
                        : "Not completed";

              return (
                <div
                  key={dateKey}
                  title={`${formatDate(dateKey)} — ${status}`}
                  aria-label={`${formatDate(dateKey)} — ${status}`}
                  className={`flex h-8 w-full items-center justify-center rounded-md border text-xs font-medium transition sm:h-9 ${isCompleted
                    ? "border-[#7c865b] bg-[#7c865b] text-white"
                    : isToday
                      ? "border-[#f4773c] bg-[#f4773c]/10 font-bold text-[#f4773c] ring-1 ring-[#f4773c]/30"
                      : !isScheduled
                        ? "border-dashed border-[#ebe5dc] text-muted-foreground/50"
                        : isWeekly
                          ? "border-[#ebe5dc] bg-white text-muted-foreground"
                          : isMissed
                            ? "border-[#ebe5dc] bg-[#f7f5f0] text-muted-foreground"
                            : "border-[#ebe5dc] text-muted-foreground"
                    }`}
                >
                  {day}
                </div>
              );
            })}

          </div>


          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#7c865b]" />
              Completed
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border-2 border-[#f4773c]" />
              Today
            </span>

            {habit.frequency === "WEEKLY" ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-[#ebe5dc] bg-white" />
                Flexible day
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-[#ebe5dc] bg-[#f7f5f0]" />
                  Not completed
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-[#ebe5dc]" />
                  Rest day
                </span>
              </>
            )}
          </div>

        </div>

        {/* Habit history */}
        <div className="habitbot-card min-w-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                History
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest recorded activity.
              </p>
            </div>
            <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>

          {completionsLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading history...
            </p>
          )}

          {completionsError && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              We couldn&apos;t load the habit history.
            </p>
          )}

          {!completionsLoading &&
            !completionsError &&
            dailyHistory.length === 0 && (
              <div className="mt-5 rounded-xl bg-[#f7f5f0] p-5 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No activity yet
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Complete this habit to start building your history.
                </p>
              </div>
            )}

          {!completionsLoading &&
            !completionsError &&
            dailyHistory.length > 0 && (
              <div className="mt-3 divide-y divide-[#ebe5dc]">
                {dailyHistory.slice(0, 14).map((day) => {
                  const dayProgress =
                    isMeasurable && target !== null && target > 0
                      ? Math.min(
                        Math.round((day.value / target) * 100),
                        100
                      )
                      : day.completed
                        ? 100
                        : 0;

                  const dayCompleted = dayProgress >= 100;

                  return (
                    <div key={day.date} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${dayCompleted
                              ? "bg-[#7c865b]/10 text-[#7c865b]"
                              : "bg-[#f4773c]/10 text-[#f4773c]"
                              }`}
                          >
                            {dayCompleted ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {formatShortDate(day.date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(day.date)}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {isMeasurable ? (
                            <>
                              <p className="text-xs font-semibold text-foreground sm:text-sm">
                                {day.value.toLocaleString()}
                                {habit.targetUnit
                                  ? ` ${habit.targetUnit}`
                                  : ""}
                                {" / "}
                                {habit.targetValue}
                                {habit.targetUnit
                                  ? ` ${habit.targetUnit}`
                                  : ""}
                              </p>
                              <p
                                className="mt-0.5 text-xs"
                                style={{
                                  color: dayCompleted
                                    ? OLIVE
                                    : "var(--muted-foreground)",
                                }}
                              >
                                {dayCompleted
                                  ? "Target reached"
                                  : `${dayProgress}% complete`}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-[#7c865b]">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {isMeasurable && (
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#eee9e1]">
                          <div
                            className="h-full rounded-full bg-[#f4773c] transition-all"
                            style={{ width: `${dayProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </section>
    </main>
  );
}
