import apiClient from "./client";

export interface DashboardHabit {
  id: string;
  name: string;
  description: string | null;
  goalId: string | null;
  targetValue: number | string | null;
  targetUnit: string | null;
  frequency: string;

  today: {
    completed: boolean;
    completionCount: number;
    value: number | null;
    lastCompletedAt: string | null;
  };
}

export interface DashboardGoal {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
}

export interface DashboardResponse {
  date: string;

  user: {
    id: string;
    name: string;
    timezone: string;

    profile: {
      primaryGoal:
        | "WEIGHT_LOSS"
        | "WEIGHT_MAINTENANCE"
        | "MUSCLE_GAIN"
        | "GENERAL_HEALTH"
        | null;

      heightCm: number | string | null;
      weightKg: number | string | null;
    };

    dietType:
      | "VEGETARIAN"
      | "NON_VEGETARIAN"
      | "EGGETARIAN"
      | "VEGAN"
      | null;
  };

  goals: DashboardGoal[];
  habits: DashboardHabit[];
}

export async function getTodayDashboard(): Promise<DashboardResponse> {
  const response = await apiClient.get<{
    success: boolean;
    data: DashboardResponse;
  }>("/dashboard/today");

  return response.data.data;
}