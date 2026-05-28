import { prisma } from "../db/prisma.js";

export async function requireDoctorConsultationOwnership(req, res, next) {
  try {
    const doctorUserId = req.user.sub || req.user.id;
    const consultationId = req.params.id;

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        appointment: true,
        patient: true,
      },
    });

    if (!consultation) {
      return res.status(404).json({
        message: "Consultația nu a fost găsită",
      });
    }

    const role = req.user.role;
    if (role !== "ASSISTANT" && consultation.doctorId !== doctorUserId) {
      return res.status(403).json({
        message: "Nu ai acces la această consultație",
      });
    }

    req.consultation = consultation;
    next();
  } catch (error) {
    next(error);
  }
}