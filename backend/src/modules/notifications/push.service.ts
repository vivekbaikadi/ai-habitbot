
import * as webpush from "web-push";

import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";

webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

interface PushPayload {
  title: string;
  message: string;
  url?: string;
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId,
    },
  });

  if (subscriptions.length === 0) {
    return;
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.message,
    url: payload.url ?? "/dashboard",
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationPayload
        );
      } catch (error) {
        const statusCode = (
          error as { statusCode?: number }
        ).statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: {
              id: subscription.id,
            },
          });

          return;
        }

        console.error(
          `Push notification failed for subscription ${subscription.id}:`,
          error
        );
      }
    })
  );
}