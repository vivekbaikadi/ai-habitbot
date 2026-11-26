
import apiClient from "./client";

export type NotificationType =
  | "HABIT_REMINDER"
  | "SYSTEM";

export interface NotificationHabit {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  userId: string;
  habitId: string | null;
  reminderId: string | null;
  localDate: string | null;
  type: NotificationType;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  habit: NotificationHabit | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export async function getNotifications(): Promise<NotificationsResponse> {
  const response = await apiClient.get<{
    success: boolean;
    data: NotificationsResponse;
  }>("/notifications");

  return response.data.data;
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<Notification> {
  const response = await apiClient.patch<{
    success: boolean;
    data: {
      notification: Notification;
    };
  }>(`/notifications/${notificationId}/read`);

  return response.data.data.notification;
}

export async function markAllNotificationsAsRead(): Promise<{
  updatedCount: number;
}> {
  const response = await apiClient.patch<{
    success: boolean;
    data: {
      updatedCount: number;
    };
  }>("/notifications/read-all");

  return response.data.data;
}
