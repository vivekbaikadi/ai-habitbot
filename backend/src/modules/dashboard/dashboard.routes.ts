import { Router } from "express";

import {
  today
} from "./dashboard.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/today",
  today
);

export default router;