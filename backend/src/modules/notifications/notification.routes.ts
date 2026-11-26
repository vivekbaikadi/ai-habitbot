import { Router } from "express";

import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  getVapidPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
} from "./notification.controller.js";

import {
  authMiddleware,
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listNotifications);

router.get("/vapid-public-key", getVapidPublicKey);

router.post("/push/subscribe", subscribeToPush);

router.delete("/push/unsubscribe", unsubscribeFromPush);

router.patch("/read-all", markAllAsRead);

router.patch("/:id/read", markAsRead);

export default router;