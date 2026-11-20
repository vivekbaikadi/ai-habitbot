
import { Router } from "express";

import {
  getProfile,
  updateProfile,
  completeOnboarding,
  updateActivityLevel,
} from "./profile.controller.js";

import { authMiddleware } from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getProfile);
router.put("/", updateProfile);

router.put("/onboarding", completeOnboarding);
router.put("/activity-level", updateActivityLevel);

export default router;
