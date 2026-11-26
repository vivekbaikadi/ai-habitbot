import { prisma } from "../../database/prisma.js";
import type { PushSubscriptionInput } from "./push-subscription.schema.js";

export async function savePushSubscription(
  userId: string,
  input: PushSubscriptionInput,
  userAgent?: string
) {
  const expirationTime =
    input.expirationTime != null
      ? new Date(input.expirationTime)
      : null;

  const subscriptionData = {
    userId,
    endpoint: input.endpoint,
    p256dh: input.keys.p256dh,
    auth: input.keys.auth,
    expirationTime,
    userAgent: userAgent ?? null,
  };

  return prisma.pushSubscription.upsert({
    where: {
      endpoint: input.endpoint,
    },
    create: subscriptionData,
    update: {
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      expirationTime,
      userAgent: userAgent ?? null,
      userId,
    },
  });
}

export async function removePushSubscription(
  userId: string,
  endpoint: string
) {
  return prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint,
    },
  });
}