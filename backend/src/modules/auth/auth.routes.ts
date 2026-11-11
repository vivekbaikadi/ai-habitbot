import { Router } from "express";

import {
  register,
  login,
  getMe,
  refresh,
  logout
} from "./auth.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.post("/refresh", refresh);
router.post("/logout", logout);

router.get(
  "/me",
  authMiddleware,
  getMe
);

export default router;