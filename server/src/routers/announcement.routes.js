import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  createAnnouncementController,
  getDashboardAnnouncementsController,
  getAllAnnouncementsController,
  updateAnnouncementController,
  deactivateAnnouncementController,
} from "../controllers/announcement.controller.js";

const router = Router();

router.get(
  "/dashboard",
  requireAuth,
  getDashboardAnnouncementsController
);

router.get(
  "/",
  requireAuth,
  requireRole("DOCTOR","ASSISTANT", "ADMIN"),
  getAllAnnouncementsController
);

router.post(
  "/",
  requireAuth,
  requireRole("DOCTOR","ASSISTANT", "ADMIN"),
  createAnnouncementController
);

router.put(
  "/:id",
  requireAuth,
  requireRole("DOCTOR","ASSISTANT", "ADMIN"),
  updateAnnouncementController
);

router.patch(
  "/:id/deactivate",
  requireAuth,
  requireRole("DOCTOR","ASSISTANT", "ADMIN"),
  deactivateAnnouncementController
);

export default router;