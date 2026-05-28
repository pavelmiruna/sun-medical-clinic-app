import { prisma } from "../db/prisma.js";

export async function requireDoctorAppointmentOwnership(req, res, next) {
  try {
    const doctorUserId = req.user.sub || req.user.id;
    const appointmentId = req.params.id || req.body.appointmentId;

    if (!appointmentId) {
      return res.status(400).json({
        message: "appointmentId este obligatoriu",
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        consultation: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Programarea nu a fost găsită",
      });
    }

    const role = req.user.role;
    if (role !== "ASSISTANT" && appointment.doctorId !== doctorUserId) {
      return res.status(403).json({
        message: "Nu ai acces la această programare",
      });
    }

    req.appointment = appointment;
    next();
  } catch (error) {
    next(error);
  }
}