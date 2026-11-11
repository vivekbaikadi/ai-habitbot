import { getTodayDashboard } from "../../dashboard/dashboard.service.js";

export async function getTodayDashboardTool(
  userId: string
) {
  const dashboard =
    await getTodayDashboard(userId);

  const completedHabits =
    dashboard.habits.filter(
      (habit) => habit.today.completed
    ).length;

  const pendingHabits =
    dashboard.habits.length -
    completedHabits;

  return {
    date: dashboard.date,

    user: dashboard.user,

    goals: dashboard.goals,

    habits: dashboard.habits,

    summary: {
      totalHabits:
        dashboard.habits.length,

      completedHabits,

      pendingHabits
    }
  };
}