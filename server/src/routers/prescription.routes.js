import { Router } from "express";
import {
  createPrescriptionController,
  getPrescriptionByIdController,
  updatePrescriptionController,
  getMyDoctorPrescriptionsController,
  getPatientPrescriptionsController,
  addPrescriptionItemController,
  updatePrescriptionItemController,
  deletePrescriptionItemController,
} from "../controllers/prescription.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  createPrescriptionController
);

router.get(
  "/doctor/me",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  getMyDoctorPrescriptionsController
);

router.get(
  "/patient/:patientId",
  requireAuth,
  getPatientPrescriptionsController
);

router.get(
  "/:id",
  requireAuth,
  getPrescriptionByIdController
);

router.put(
  "/:id",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  updatePrescriptionController
);

router.post(
  "/:id/items",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  addPrescriptionItemController
);

router.put(
  "/items/:itemId",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  updatePrescriptionItemController
);

router.delete(
  "/items/:itemId",
  requireAuth,
  requireRole("DOCTOR", "ASSISTANT"),
  deletePrescriptionItemController
);

export default router;