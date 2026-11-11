import { Router } from "express";

import {
  create,
  list,
  getOne,
  update,
  remove
} from "./goal.controller.js";

import {
  authMiddleware
} from "../../common/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", create);
router.get("/", list);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;