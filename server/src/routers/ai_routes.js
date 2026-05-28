import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  patientSummaryController,
  patientChatController,
  cabinetInsightsController,
} from "../controllers/ai_controller.js";

const router = Router();

router.get(
  "/summary/:patientId",
  requireAuth,
  patientSummaryController
);

router.post(
  "/chat/:patientId",
  requireAuth,
  patientChatController
);

router.get(
  "/insights",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT", "ADMIN"),
  cabinetInsightsController
);

export default router;