
import { Router } from "express";

import {
  create,
  list,
  getOne,
  update,
  remove
} from "./habit.controller.js";

import {
  createReminder,
  listReminders,
  updateReminder,
  removeReminder
} from "./reminder.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// Habit reminder routes
router.post("/:id/reminders", createReminder);
router.get("/:id/reminders", listReminders);
router.patch("/:id/reminders/:reminderId", updateReminder);
router.delete("/:id/reminders/:reminderId", removeReminder);

// Habit routes
router.post("/", create);
router.get("/", list);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
