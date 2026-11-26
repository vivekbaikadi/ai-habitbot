import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { AppError } from "../../common/errors/app.error.js";

import type {
  AuthenticatedRequest,
} from "../../common/middleware/auth.middleware.js";

import { env } from "../../config/env.js";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notification.service.js";

import {
  pushSubscriptionSchema,
} from "./push-subscription.schema.js";

import {
  savePushSubscription,
  removePushSubscription,
} from "./push-subscription.service.js";

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}

function getNotificationId(req: Request): string {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(
      "Invalid notification ID",
      400,
      "INVALID_NOTIFICATION_ID"
    );
  }

  return id;
}

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getNotifications(getUserId(req));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const notification = await markNotificationAsRead(
      getUserId(req),
      getNotificationId(req)
    );

    res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await markAllNotificationsAsRead(
      getUserId(req)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVapidPublicKey(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      data: {
        publicKey: env.VAPID_PUBLIC_KEY,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function subscribeToPush(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = pushSubscriptionSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        "Invalid push subscription data",
        400,
        "INVALID_PUSH_SUBSCRIPTION"
      );
    }

    const userAgent = req.get("user-agent") ?? undefined;

    const subscription = await savePushSubscription(
      getUserId(req),
      parsed.data,
      userAgent
    );

    res.status(201).json({
      success: true,
      data: {
        message: "Push subscription saved successfully",
        subscriptionId: subscription.id,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function unsubscribeFromPush(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const endpointSchema = pushSubscriptionSchema.pick({
      endpoint: true,
    });

    const parsed = endpointSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        "Invalid push subscription endpoint",
        400,
        "INVALID_PUSH_ENDPOINT"
      );
    }

    const result = await removePushSubscription(
      getUserId(req),
      parsed.data.endpoint
    );

    res.status(200).json({
      success: true,
      data: {
        message: "Push subscription removed successfully",
        deletedCount: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
}