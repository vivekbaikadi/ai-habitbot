"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
  type Goal,
} from "@/lib/api/goals";
import { getHabits } from "@/lib/api/habits";
import { getTodayDashboard } from "@/lib/api/dashboard";

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const {
    data: goals = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: getGoals,
  });

  const { data: habits = [] } = useQuery({
    queryKey: ["habits"],
    queryFn: getHabits,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard", "today"],
    queryFn: getTodayDashboard,
  });

  const getGoalProgress = (goalId: string) => {
    const linkedHabits = habits.filter(
      (habit) => habit.goalId === goalId
    );

    const todayHabits =
      dashboard?.habits.filter(
        (habit) => habit.goalId === goalId
      ) ?? [];

    const completedToday = todayHabits.filter(
      (habit) => habit.today.completed
    ).length;

    return {
      linkedHabits,
      linkedHabitsCount: linkedHabits.length,
      totalToday: todayHabits.length,
      completedToday,
      percentage:
        todayHabits.length > 0
          ? Math.round(
            (completedToday / todayHabits.length) * 100
          )
          : 0,
    };
  };

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["goals"],
      });

      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      title,
      description,
    }: {
      id: string;
      title: string;
      description: string;
    }) =>
      updateGoal(id, {
        title,
        description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["goals"],
      });

      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["goals"],
      });
    },
  });

  function openCreateForm() {
    setTitle("");
    setDescription("");
    setEditingGoal(null);
    setIsCreateOpen(true);
  }

  function openEditForm(goal: Goal) {
    setTitle(goal.title);
    setDescription(goal.description ?? "");
    setEditingGoal(goal);
    setIsCreateOpen(true);
  }

  function closeForm() {
    setIsCreateOpen(false);
    setEditingGoal(null);
    setTitle("");
    setDescription("");
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      return;
    }

    if (editingGoal) {
      updateMutation.mutate({
        id: editingGoal.id,
        title: trimmedTitle,
        description: trimmedDescription,
      });

      return;
    }

    createMutation.mutate({
      title: trimmedTitle,
      description: trimmedDescription || undefined,
    });
  }

  function handleDelete(goal: Goal) {
    const confirmed = window.confirm(
      `Delete "${goal.title}"?`
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(goal.id);
  }

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="size-6" />

            <h1 className="text-3xl font-bold tracking-tight">
              Goals
            </h1>
          </div>

          <p className="mt-2 text-muted-foreground">
            Define what you want to achieve and build habits around it.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New goal
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="rounded-xl border bg-background p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Loading your goals...
          </p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
          <h2 className="font-semibold">
            Unable to load goals
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Please refresh the page and try again.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && goals.length === 0 && (
        <div className="rounded-xl border border-dashed bg-background p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Target className="size-6 text-primary" />
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            No goals yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Start with one meaningful goal. Your habits will help you get there.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your first goal
          </button>
        </div>
      )}

      {/* Goals */}
      {!isLoading && !isError && goals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = getGoalProgress(goal.id);

            return (
              <div
                key={goal.id}
                className="rounded-xl border bg-background p-5"
              >
                {/* Goal header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="size-5 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-semibold">
                        {goal.title}
                      </h2>

                      {goal.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${goal.isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {goal.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Goal progress */}
                <div className="mt-5 space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Linked habits
                    </span>

                    <span className="font-medium">
                      {progress.linkedHabitsCount}
                    </span>
                  </div>

                  {progress.linkedHabitsCount > 0 && (
                    <div className="space-y-3 pt-2">
                      {progress.linkedHabits.map((habit) => {
                        const todayHabit = dashboard?.habits.find(
                          (item) => item.id === habit.id
                        );

                        return (
                          <button
                            key={habit.id}
                            type="button"
                            onClick={() => router.push(`/habits/${habit.id}`)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-3 text-left transition-colors hover:bg-muted"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {habit.name}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {habit.isActive ? "Active" : "Inactive"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${!habit.isActive
                                ? "bg-muted text-muted-foreground"
                                : todayHabit?.today.completed
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {!habit.isActive
                                ? "Inactive"
                                : todayHabit
                                  ? todayHabit.today.completed
                                    ? "Completed"
                                    : "Not completed"
                                  : "Not tracked today"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}


                  {progress.totalToday > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">
                          Today's tracked habits
                        </span>

                        <span className="text-right font-medium">
                          {progress.completedToday} of{" "}
                          {progress.totalToday} tracked
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-label={`Today's progress for ${goal.title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress.percentage}
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{
                            width: `${progress.percentage}%`,
                          }}
                        />
                      </div>

                      <p className="text-right text-xs text-muted-foreground">
                        {progress.percentage}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {progress.linkedHabitsCount > 0
                        ? "No habit progress available for today."
                        : "Link habits to this goal to track progress."}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/habits?goalId=${encodeURIComponent(goal.id)}`)
                    }
                    className="rounded-md bg-[#f4773c] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#e96b32]"
                  >
                    <Plus className="mr-1 inline size-4" />
                    Create habit
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditForm(goal)}
                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/habits")}
                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Manage habits
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(goal)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingGoal ? "Edit goal" : "Create goal"}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {editingGoal
                    ? "Update your goal."
                    : "What do you want to achieve?"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-md p-2 hover:bg-muted"
                aria-label="Close goal form"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="goal-title"
                  className="text-sm font-medium"
                >
                  Title
                </label>

                <input
                  id="goal-title"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Improve fitness"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="goal-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="goal-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe what you want to accomplish..."
                  rows={4}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {(createMutation.isError ||
                updateMutation.isError) && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Unable to save the goal. Please try again.
                  </div>
                )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving..."
                    : editingGoal
                      ? "Save changes"
                      : "Create goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}