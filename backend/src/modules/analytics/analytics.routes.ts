import { Router } from "express";

import {
  get
} from "./analytics.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  get
);

export default router;