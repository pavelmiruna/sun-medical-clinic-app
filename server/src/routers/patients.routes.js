import { Router } from "express";
import { claimProfile, claimGuardian, listGuardians, revokeGuardian, updateMyPatientProfile } from "../controllers/patient.controller.js";
import { claimProfileSchema } from "../validators/claim.validator.js";
import { validateBody } from "../middleware/validateBody.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { getPatientById, getMyPatientProfiles } from "../controllers/patient.controller.js";
import { requirePatientAccess } from "../middleware/patientAccess.js";

const router = Router();

router.post(
  "/claim",
  requireAuth,
  requireRole("PATIENT"),
  validateBody(claimProfileSchema),
  claimProfile
);

router.post(
  "/claim-guardian",
  requireAuth,
  requireRole("PATIENT"),
  validateBody(claimProfileSchema),
  claimGuardian
);

router.get(
  "/my-profiles",
  requireAuth,
  requireRole("PATIENT"),
  getMyPatientProfiles
);

router.patch(
  "/my-profile",
  requireAuth,
  requireRole("PATIENT"),
  updateMyPatientProfile
);
router.get(
  "/:id",
  requireAuth,
  requirePatientAccess(),
  getPatientById
);

router.delete(
  "/:id/guardian/:guardianUserId",
  requireAuth,
  requireRole("PATIENT"),
  revokeGuardian
);

router.get(
  "/:id/guardians",
  requireAuth,
  requireRole("PATIENT"),
  listGuardians
);



export default router;