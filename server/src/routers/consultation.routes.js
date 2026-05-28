import { Router } from "express";
import {
  createConsultationController,
  createWalkInConsultationController,
  getConsultationByIdController,
  updateConsultationController,
  getMyDoctorConsultationsController,
  getPatientConsultationsController,
} from "../controllers/consultation.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { requireDoctorAppointmentOwnership } from "../middleware/requireDoctorAppointmentOwnership.js";
import { requireDoctorConsultationOwnership } from "../middleware/requireDoctorConsultationOwnership.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  requireDoctorAppointmentOwnership,
  createConsultationController
);

router.get(
  "/doctor/me",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  getMyDoctorConsultationsController
);

router.get(
  "/patient/:patientId",
  requireAuth,
  getPatientConsultationsController
);

router.post(
  "/walk-in",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  createWalkInConsultationController
);

router.get(
  "/:id",
  requireAuth,
  getConsultationByIdController
);

router.put(
  "/:id",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  requireDoctorConsultationOwnership,
  updateConsultationController
);

export default router;