import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateClaimCode, hashClaimCode, getClaimExpiryDate,} from "../utils/claimCode.js"
import { regenerateClaimCodeForProfile } from "../services/claim.service.js";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(6).optional(),
  dateOfBirth: z.string().datetime().optional(),
  isMinor: z.boolean().optional(),
  assignedDoctorId: z.string().optional(),
  cnp: z.string().regex(/^\d{13}$/, { message: "CNP-ul trebuie să conțină exact 13 cifre." }),
  sex: z.enum(["M", "F"], { message: "Sexul este obligatoriu." }),
});

export const createPatientProfile = asyncHandler(async (req, res) => {
    const dto = schema.parse(req.body);

    const claimCode = generateClaimCode();
    const claimCodeHash = hashClaimCode(claimCode);
    const claimCodeExpiresAt = getClaimExpiryDate();


  const callerId = req.user.sub || req.user.id;
  const callerRole = req.user.role;

  const assignedDoctorId =
    callerRole === "DOCTOR"
      ? callerId
      : (dto.assignedDoctorId ?? null);

  const patient = await prisma.patientProfile.create({
    data: {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      isMinor: dto.isMinor ?? false,
      cnp: dto.cnp ?? null,
      sex: dto.sex ?? null,
      userId: null,
      createdByUserId: callerId,
      assignedDoctorId,

      claimCodeHash,
      claimCodeExpiresAt,
      claimedAt: null,
    },
  });

  res.status(201).json({
    patient,
    claimCode,
    claimCodeExpiresAt,
    });
});

export const listDoctors = asyncHandler(async (req, res) => {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: {
      id: true,
      email: true,
      doctorProfile: {
        select: { firstName: true, lastName: true, specialization: true },
      },
    },
    orderBy: { email: "asc" },
  });

  const result = doctors.map((d) => ({
    id: d.id,
    firstName: d.doctorProfile?.firstName ?? null,
    lastName: d.doctorProfile?.lastName ?? null,
    specialization: d.doctorProfile?.specialization ?? null,
    email: d.email,
  }));

  res.json(result);
});

export const regeneratePatientClaimCode = asyncHandler(async (req, res) => {
  const patientId = req.params.id;

  const result = await regenerateClaimCodeForProfile({ patientId });

  res.json({
    message: "Claim code regenerated",
    ...result,
  });
});

export const getMyPatients = asyncHandler(async (req, res) => {
  const userId = req.user.sub || req.user.id;
  const role = req.user.role;

  let effectiveDoctorId = userId;
  if (role === "ASSISTANT") {
    const assistant = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedDoctorId: true },
    });
    effectiveDoctorId = assistant?.assignedDoctorId ?? null;
  }

  const where = (role === "DOCTOR" || (role === "ASSISTANT" && effectiveDoctorId))
    ? {
        OR: [
          { appointments: { some: { doctorId: effectiveDoctorId } } },
          { createdByUserId: effectiveDoctorId },
          { assignedDoctorId: effectiveDoctorId },
        ],
      }
    : {};  // asistent neatribuit → vede tot (fallback temporar)

  const apptFilter = effectiveDoctorId ? { doctorId: effectiveDoctorId } : {};

  const patients = await prisma.patientProfile.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      isMinor: true,
      userId: true,
      claimedAt: true,
      appointments: {
        where: apptFilter,
        select: { scheduledAt: true },
        orderBy: { scheduledAt: "desc" },
        take: 1,
      },
      _count: {
        select: { appointments: { where: apptFilter } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const result = patients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    isMinor: p.isMinor,
    userId: p.userId,
    claimedAt: p.claimedAt,
    appointmentsCount: p._count.appointments,
    lastAppointment: p.appointments[0]?.scheduledAt ?? null,
  }));

  res.json(result);
});