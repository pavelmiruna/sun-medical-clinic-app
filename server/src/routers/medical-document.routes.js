import { Router } from "express";
import {
  generateFromPrescriptionController,
  getMedicalDocumentByIdController,
  updateMedicalDocumentDraftController,
  finalizeMedicalDocumentController,
  generateFromReferralController,
  getMedicalDocumentPdfController
} from "../controllers/medical-document.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.post(
  "/generate-from-prescription/:prescriptionId",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT", "PATIENT"),
  generateFromPrescriptionController
);

router.get(
  "/:id",
  requireAuth,
  getMedicalDocumentByIdController
);

router.put(
  "/:id/draft",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  updateMedicalDocumentDraftController
);

router.post(
  "/:id/finalize",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT", "PATIENT"),
  finalizeMedicalDocumentController
);

router.post(
  "/generate-from-referral/:referralId",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT", "PATIENT"),
  generateFromReferralController
);

router.get(
  "/:id/pdf",
  requireAuth,
  getMedicalDocumentPdfController
);

export default router;