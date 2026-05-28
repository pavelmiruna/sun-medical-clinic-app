import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMe, changePassword, listDoctors } from "../controllers/user.controller.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.patch("/me/password", requireAuth, changePassword);
router.get("/doctors", requireAuth, listDoctors);

export default router;