import apiClient from "./client";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export async function getGoals(): Promise<Goal[]> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      goals: Goal[];
    };
  }>("/goals");

  return response.data.data.goals;
}

export async function getGoal(
  id: string
): Promise<Goal> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      goal: Goal;
    };
  }>(`/goals/${id}`);

  return response.data.data.goal;
}

export async function createGoal(
  input: CreateGoalInput
): Promise<Goal> {
  const response = await apiClient.post<{
    success: boolean;
    data: {
      goal: Goal;
    };
  }>("/goals", input);

  return response.data.data.goal;
}

export async function updateGoal(
  id: string,
  input: UpdateGoalInput
): Promise<Goal> {
  const response = await apiClient.patch<{
    success: boolean;
    data: {
      goal: Goal;
    };
  }>(`/goals/${id}`, input);

  return response.data.data.goal;
}

export async function deleteGoal(
  id: string
): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}