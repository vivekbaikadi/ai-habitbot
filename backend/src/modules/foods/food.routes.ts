import { Router } from "express";

import {
  list,
  getOne,
  recent,
  frequent
} from "./food.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", list);
router.get("/recent", recent);
router.get("/frequent", frequent);
router.get("/:id", getOne);

export default router;