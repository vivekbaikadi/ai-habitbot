
import apiClient from "./client";

export interface CreateCompletionInput {
  completedAt: string;
  value?: number;
  notes?: string;
}

export interface Completion {
  id: string;
  habitId: string;
  completedAt: string;
  value: number | null;
  notes: string | null;
  createdAt: string;
}

export interface WeeklyProgress {
  target: number;
  completed: number;
  remaining: number;
  achieved: boolean;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  lastCompletedAt: string | null;
  weeklyProgress: WeeklyProgress | null;
}

export async function createHabitCompletion(
  habitId: string,
  input: CreateCompletionInput
): Promise<Completion> {
  const response = await apiClient.post<{
    success: boolean;
    data: {
      completion: Completion;
    };
  }>(
    `/habits/${habitId}/completions`,
    input
  );

  return response.data.data.completion;
}

export async function getHabitCompletions(
  habitId: string,
  from?: string,
  to?: string
): Promise<Completion[]> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      completions: Completion[];
    };
  }>(`/habits/${habitId}/completions`, {
    params: {
      ...(from && { from }),
      ...(to && { to })
    }
  });

  return response.data.data.completions;
}

export async function getHabitStats(
  habitId: string
): Promise<HabitStats> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      stats: HabitStats;
    };
  }>(`/habits/${habitId}/stats`);

  return response.data.data.stats;
}
