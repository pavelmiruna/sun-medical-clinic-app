import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { listUsers, createStaff, assignAssistantToDoctor, listPatientAccesses, revokePatientAccessAsAdmin, reassignPatientDoctor, getClinic, upsertClinic } from "../controllers/admin.controller.js";

const router = Router();

router.get("/users", requireAuth, requireRole("ADMIN"), listUsers);
router.post("/users", requireAuth, requireRole("ADMIN"), createStaff);
router.patch("/users/:assistantId/assign-doctor", requireAuth, requireRole("ADMIN"), assignAssistantToDoctor);

router.get("/users/:userId/patient-accesses", requireAuth, requireRole("ADMIN"), listPatientAccesses);
router.delete("/patient-accesses/:patientId/:guardianUserId", requireAuth, requireRole("ADMIN"), revokePatientAccessAsAdmin);

router.patch("/patients/:patientId/assign-doctor", requireAuth, requireRole("ADMIN"), reassignPatientDoctor);

// Clinică
router.get("/clinic", requireAuth, requireRole("ADMIN"), getClinic);
router.put("/clinic", requireAuth, requireRole("ADMIN"), upsertClinic);

// Test email
router.post("/test-email", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { sendAppointmentConfirmation } = await import("../services/email.service.js");
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: "Câmpul 'to' este obligatoriu." });
  try {
    await sendAppointmentConfirmation({
      to,
      patientName: "Test Pacient",
      doctorName: "Dr. Test",
      scheduledAt: new Date(),
      reason: "ROUTINE_CHECK",
    });
    res.json({ success: true, message: `Email trimis cu succes la ${to}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: err.code, responseCode: err.responseCode });
  }
});

export default router;