import { prisma } from "../db/prisma.js";

export const requirePatientAccess = () => {
  return async (req, res, next) => {
    try {
      const patientId = req.params.id;   // din URL /patients/:id
      const userId = req.user.id;        // setat de requireAuth
      const role = req.user.role;

      if (role === "DOCTOR" || role === "ASSISTANT") return next();

      const patient = await prisma.patientProfile.findUnique({
        where: { id: patientId },
        select: { userId: true },
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      if (patient.userId === userId) return next();

      const access = await prisma.patientAccess.findUnique({
        where: {
          userId_patientId: { userId, patientId },
        },
        select: { role: true },
      });

      if (access) return next();

      return res.status(403).json({ message: "Forbidden" });
    } catch (err) {
      next(err);
    }
  };
};