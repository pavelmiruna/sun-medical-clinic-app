import express from "express";
import cors from "cors";
import morgan from "morgan";
import { prisma } from "./db/prisma.js";
import authRoutes from "./routers/auth.routes.js";
import userRoutes from "./routers/user.routes.js";
import adminRoutes from "./routers/admin.routes.js"
import doctorRoutes from "./routers/doctor.routes.js"
import patientsRoutes from "./routers/patients.routes.js"
import appointmentRoutes from "./routers/appointment.routes.js";
import doctorScheduleRoutes from "./routers/doctorSchedule.routes.js";
import consultationRoutes from "./routers/consultation.routes.js";
import prescriptionRoutes from "./routers/prescription.routes.js"
import medicalDocumentRoutes from "./routers/medical-document.routes.js";
import referralRoutes from "./routers/referral.routes.js";
import path from "path";
import announcementRoutes from "./routers/announcement.routes.js";
import vaccinationRoutes from "./routers/vaccination.routes.js";
import aiRoutes from "./routers/ai_routes.js";
import clinicRoutes from "./routers/clinic_doctorProfile.routes.js";

import { fileURLToPath } from "url";


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/db", async (req, res, next) => {
  try {
    const users = await prisma.user.count();
    res.json({ ok: true, users });
  } catch (e) {
    next(e);
  }
});

app.get("/api/public/doctors", async (req, res) => {
  const { prisma } = await import("./db/prisma.js");
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: {
      id: true,
      doctorProfile: { select: { firstName: true, lastName: true, specialization: true } },
    },
    orderBy: { id: "asc" },
  });
  res.json(doctors.map((d) => ({
    id: d.id,
    name: d.doctorProfile?.firstName && d.doctorProfile?.lastName
      ? `Dr. ${d.doctorProfile.firstName} ${d.doctorProfile.lastName}`
      : "Doctor",
    specialization: d.doctorProfile?.specialization ?? null,
  })));
});

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorScheduleRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/documents", medicalDocumentRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/announcements", announcementRoutes);
app.use("/api/vaccinations", vaccinationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", clinicRoutes);

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  res.status(safeStatus).json({
    message: err.message || "Eroare internă de server",
  });
});

export default app;