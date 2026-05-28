import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { createPatientProfile, regeneratePatientClaimCode, getMyPatients, listDoctors } from "../controllers/doctor.controller.js";
const router = Router();

router.post(
  "/patients",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  createPatientProfile
);

router.post(
  "/patients/:id/claim-code",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  regeneratePatientClaimCode
);

router.get(
  "/patients",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  getMyPatients
);

router.get(
  "/list",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  listDoctors
);

export default router;