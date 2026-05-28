import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validateBody } from "../middleware/validateBody.js";
import { completeAppointmentController } from "../controllers/appointment.controller.js";


import {
  createAppointmentController,
  getMyAppointmentsController,
  cancelAppointmentController,
} from "../controllers/appointment.controller.js";

import { createAppointmentSchema } from "../validators/appointment.validator.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("PATIENT", "DOCTOR", "ASSISTANT"),
  validateBody(createAppointmentSchema),
  createAppointmentController
);

router.get(
  "/my",
  requireAuth,
  requireRole("PATIENT", "DOCTOR", "ASSISTANT"),
  getMyAppointmentsController
);

router.patch(
  "/:id/cancel",
  requireAuth,
  requireRole("PATIENT", "DOCTOR", "ASSISTANT"),
  cancelAppointmentController
);

router.patch(
  "/:id/complete",
   requireAuth,
    requireRole("DOCTOR"),
    completeAppointmentController
);


export default router;