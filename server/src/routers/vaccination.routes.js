import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  createVaccinationRecordController,
  getVaccinationRecordByIdController,
  getPatientVaccinationHistoryController,
  updateVaccinationRecordController,
  deleteVaccinationRecordController,
} from "../controllers/vaccination.controller.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT", "ADMIN"),
  createVaccinationRecordController
);

router.get(
  "/patient/:patientId",
  requireAuth,
  getPatientVaccinationHistoryController
);

router.get(
  "/:id",
  requireAuth,
  getVaccinationRecordByIdController
);

router.put(
  "/:id",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT", "ADMIN"),
  updateVaccinationRecordController
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT", "ADMIN"),
  deleteVaccinationRecordController
);

export default router;