import { Router } from "express";

import {
  create,
  list,
  stats
} from "./completion.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/habits/:id/completions",
  create
);

router.get(
  "/habits/:id/completions",
  list
);

router.get(
  "/habits/:id/stats",
  stats
);

export default router;