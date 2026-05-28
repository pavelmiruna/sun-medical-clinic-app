import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  createReferralController,
  getReferralByIdController,
  updateReferralController,
  getMyDoctorReferralsController,
  getPatientReferralsController,
} from "../controllers/referral.controller.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  createReferralController
);

router.get(
  "/doctor/me",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT", "ADMIN"),
  getMyDoctorReferralsController
);

router.get(
  "/patient/:patientId",
  requireAuth,
  getPatientReferralsController
);

router.get(
  "/:id",
  requireAuth,
  getReferralByIdController
);

router.put(
  "/:id",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  updateReferralController
);

export default router;