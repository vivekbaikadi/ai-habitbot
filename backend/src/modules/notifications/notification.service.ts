
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../common/errors/app.error.js";

export async function getNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId,
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),

    prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    }),
  ]);

  return {
    notifications,
    unreadCount,
  };
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new AppError(
      "Notification not found",
      404,
      "NOTIFICATION_NOT_FOUND"
    );
  }

  if (notification.readAt) {
    return notification;
  }

  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(
  userId: string
) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return {
    updatedCount: result.count,
  };
}
