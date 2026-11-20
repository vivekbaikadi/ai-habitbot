
import { Router } from "express";

import {
  completeOnboarding,
  updateActivityLevel,
} from "./profile.controller.js";

import {
  authMiddleware,
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.put("/onboarding", completeOnboarding);
router.put("/activity-level", updateActivityLevel);

export default router;
