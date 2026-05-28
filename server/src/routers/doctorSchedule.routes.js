import { Router } from "express";
import {
  createDoctorScheduleController,
  getMyDoctorSchedulesController,
  updateDoctorScheduleController,
  deleteDoctorScheduleController,
  getDoctorAvailableSlotsController,
} from "../controllers/doctorSchedule.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.post(
  "/me/schedules",
  requireAuth,
  requireRole("DOCTOR"),
  createDoctorScheduleController
);

router.get(
  "/me/schedules",
  requireAuth,
  requireRole("DOCTOR"),
  getMyDoctorSchedulesController
);

router.put(
  "/me/schedules/:id",
  requireAuth,
  requireRole("DOCTOR"),
  updateDoctorScheduleController
);

router.delete(
  "/me/schedules/:id",
  requireAuth,
  requireRole("DOCTOR"),
  deleteDoctorScheduleController
);

router.get(
  "/:id/available-slots",
  requireAuth,
  getDoctorAvailableSlotsController
);

export default router;