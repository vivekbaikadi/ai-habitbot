import { Router } from "express";

import {
  getContext
} from "./ai-context.controller.js";

import {
  coach
} from "./coach.controller.js";

import {
  list,
  getOne,
  remove
} from "./conversation.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

/*
 * AI context
 */
router.get(
  "/context",
  getContext
);

/*
 * AI coach
 */
router.post(
  "/coach",
  coach
);

/*
 * Conversations
 */
router.get(
  "/conversations",
  list
);

router.get(
  "/conversations/:id",
  getOne
);

router.delete("/conversations/:id", remove);

export default router;