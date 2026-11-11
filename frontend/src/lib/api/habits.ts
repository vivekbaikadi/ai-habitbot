import apiClient from "./client";

export interface HabitGoal {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  goalId: string | null;

  name: string;
  description: string | null;

  isActive: boolean;

  targetValue: number | string | null;
  targetUnit: string | null;

  frequency: "DAILY" | "WEEKLY" | "CUSTOM";

  startDate: string;
  endDate: string | null;

  createdAt: string;
  updatedAt: string;

  goal: HabitGoal | null;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  goalId?: string;
  targetValue?: number;
  targetUnit?: string;
  frequency: "DAILY" | "WEEKLY" | "CUSTOM";
  startDate: string;
  endDate?: string;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string | null;
  goalId?: string | null;
  targetValue?: number | null;
  targetUnit?: string | null;
  frequency?: "DAILY" | "WEEKLY" | "CUSTOM";
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
}

export async function getHabits(): Promise<Habit[]> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      habits: Habit[];
    };
  }>("/habits");

  return response.data.data.habits;
}

export async function getHabitById(
  habitId: string
): Promise<Habit> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      habit: Habit;
    };
  }>(`/habits/${habitId}`);

  return response.data.data.habit;
}

export async function createHabit(
  input: CreateHabitInput
): Promise<Habit> {
  const response = await apiClient.post<{
    success: boolean;
    data: {
      habit: Habit;
    };
  }>("/habits", input);

  return response.data.data.habit;
}

export async function updateHabit(
  habitId: string,
  input: UpdateHabitInput
): Promise<Habit> {
  const response = await apiClient.patch<{
    success: boolean;
    data: {
      habit: Habit;
    };
  }>(`/habits/${habitId}`, input);

  return response.data.data.habit;
}

export async function deleteHabit(
  habitId: string
): Promise<void> {
  await apiClient.delete(`/habits/${habitId}`);
}