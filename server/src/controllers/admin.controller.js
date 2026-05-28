import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, role: true, createdAt: true,
      assignedDoctorId: true,
      assignedDoctor: { select: { id: true, email: true } },
      patientProfile: { select: { firstName: true, lastName: true } },
      doctorProfile: { select: { firstName: true, lastName: true } },
    },
  });
  res.json(users);
});

export const assignAssistantToDoctor = asyncHandler(async (req, res) => {
  const { assistantId } = req.params;
  const { doctorId } = req.body;

  const assistant = await prisma.user.findUnique({ where: { id: assistantId } });
  if (!assistant || assistant.role !== "ASSISTANT") {
    return res.status(400).json({ message: "Utilizatorul nu este asistent." });
  }

  if (doctorId) {
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== "DOCTOR") {
      return res.status(400).json({ message: "Utilizatorul selectat nu este doctor." });
    }
  }

  const updated = await prisma.user.update({
    where: { id: assistantId },
    data: { assignedDoctorId: doctorId ?? null },
    select: { id: true, email: true, role: true, assignedDoctorId: true,
      assignedDoctor: { select: { id: true, email: true } } },
  });

  res.json(updated);
});

const emailValidator = z
  .string()
  .email({ message: "Adresa de email nu este validă (ex: nume@gmail.com)." })
  .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val), {
    message: "Adresa de email trebuie să conțină @ și o extensie validă (ex: .com, .ro).",
  });

const createStaffSchema = z.object({
  email: emailValidator,
  password: z.string()
    .min(6, { message: "Parola trebuie să aibă minim 6 caractere." })
    .regex(/[0-9]/, { message: "Parola trebuie să conțină cel puțin o cifră." })
    .regex(/[^a-zA-Z0-9]/, { message: "Parola trebuie să conțină cel puțin un semn special." }),
  role: z.enum(["DOCTOR", "ASSISTANT", "ADMIN"]),
});

export const createStaff = asyncHandler(async (req, res) => {
  let dto;
  try {
    dto = createStaffSchema.parse(req.body);
  } catch (e) {
    const message = e.errors?.[0]?.message || "Date invalide.";
    return res.status(400).json({ message });
  }

  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) return res.status(409).json({ message: "Există deja un cont cu acest email." });

  const passwordHash = await bcrypt.hash(dto.password, 10);

  const user = await prisma.user.create({
    data: {
      email: dto.email,
      passwordHash,
      role: dto.role,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json(user);
});

export const listPatientAccesses = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      accesses: {
        select: {
          userId: true,
          role: true,
          createdAt: true,
          user: { select: { id: true, email: true } },
        },
      },
    },
  });

  if (!profile) return res.status(404).json({ message: "Profilul de pacient nu a fost găsit." });

  res.json({
    patientId: profile.id,
    patientName: `${profile.firstName} ${profile.lastName}`,
    accesses: profile.accesses.map((a) => ({
      guardianUserId: a.userId,
      guardianEmail: a.user.email,
      role: a.role,
      since: a.createdAt,
    })),
  });
});

export const revokePatientAccessAsAdmin = asyncHandler(async (req, res) => {
  const { patientId, guardianUserId } = req.params;

  const access = await prisma.patientAccess.findUnique({
    where: { userId_patientId: { userId: guardianUserId, patientId } },
  });

  if (!access) return res.status(404).json({ message: "Accesul de tutelă nu a fost găsit." });

  await prisma.patientAccess.delete({
    where: { userId_patientId: { userId: guardianUserId, patientId } },
  });

  res.json({ success: true, message: "Accesul de tutelă a fost revocat." });
});

export const reassignPatientDoctor = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { doctorId } = req.body;

  const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ message: "Pacientul nu a fost găsit." });

  if (doctorId) {
    const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== "DOCTOR") {
      return res.status(400).json({ message: "Utilizatorul selectat nu este doctor." });
    }
  }

  const updated = await prisma.patientProfile.update({
    where: { id: patientId },
    data: { assignedDoctorId: doctorId ?? null },
    select: { id: true, firstName: true, lastName: true, assignedDoctorId: true },
  });

  res.json(updated);
});

// ─── Clinic ───────────────────────────────────────────────────
export const getClinic = asyncHandler(async (req, res) => {
  const clinic = await prisma.clinic.findFirst();
  res.json(clinic ?? null);
});

const clinicSchema = z.object({
  name: z.string().min(1, { message: "Numele clinicii este obligatoriu." }),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional().refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    { message: "Adresa de email nu este validă." }
  ),
  serialPrefix: z.string().optional(),
  website: z.string().optional(),
  cui: z.string().optional(),
});

export const upsertClinic = asyncHandler(async (req, res) => {
  let dto;
  try {
    dto = clinicSchema.parse(req.body);
  } catch (e) {
    return res.status(400).json({ message: e.errors?.[0]?.message || "Date invalide." });
  }

  const data = {
    name: dto.name,
    address: dto.address || null,
    phone: dto.phone || null,
    email: dto.email || null,
    serialPrefix: dto.serialPrefix || null,
  };

  const existing = await prisma.clinic.findFirst();
  const clinic = existing
    ? await prisma.clinic.update({ where: { id: existing.id }, data })
    : await prisma.clinic.create({ data });

  res.json(clinic);
});