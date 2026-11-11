import { Router } from "express";

import {
  list,
  getOne
} from "./food.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", list);

router.get("/:id", getOne);

export default router;