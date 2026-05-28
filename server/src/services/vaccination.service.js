import { prisma } from "../db/prisma.js";

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertVaccinationEditor(user) {
  if (!user || !["DOCTOR", "ASSISTANT", "ADMIN"].includes(user.role)) {
    throw createError("Forbidden", 403);
  }
}

export async function createVaccinationRecord(data, currentUser) {
  assertVaccinationEditor(currentUser);

  const patient = await prisma.patientProfile.findUnique({
    where: { id: data.patientId },
    include: {
      accesses: true,
      user: true,
    },
  });

  if (!patient) {
    throw createError("Pacientul nu a fost găsit", 404);
  }

  return prisma.vaccinationRecord.create({
    data: {
      patientId: data.patientId,
      createdByUserId: currentUser.id,
      vaccineName: data.vaccineName,
      doseLabel: data.doseLabel,
      status: data.status ?? "COMPLETED",
      administeredAt: data.administeredAt ? new Date(data.administeredAt) : null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      manufacturer: data.manufacturer,
      batchNumber: data.batchNumber,
      site: data.site,
      route: data.route,
      notes: data.notes,
    },
    include: {
      patient: {
        include: {
          accesses: true,
          user: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getVaccinationRecordById(recordId, currentUser) {
  const record = await prisma.vaccinationRecord.findUnique({
    where: { id: recordId },
    include: {
      patient: {
        include: {
          accesses: true,
          user: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!record) {
    throw createError("Vaccination record not found", 404);
  }

  const userId = currentUser.sub || currentUser.id;
  const role = currentUser.role;

  const isStaff = ["DOCTOR", "ASSISTANT", "ADMIN"].includes(role);
  const isPatientOwner = record.patient.userId === userId;
  const hasPatientAccess = record.patient.accesses.some(
    (access) => access.userId === userId
  );

  if (!isStaff && !isPatientOwner && !hasPatientAccess) {
    throw createError("Nu ai acces la această înregistrare", 403);
  }

  return record;
}

export async function getPatientVaccinationHistory(patientId, currentUser) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      accesses: true,
      user: true,
    },
  });

  if (!patient) {
    throw createError("Pacientul nu a fost găsit", 404);
  }

  const userId = currentUser.sub || currentUser.id;
  const role = currentUser.role;

  const isStaff = ["DOCTOR", "ASSISTANT", "ADMIN"].includes(role);
  const isOwner = patient.userId === userId;
  const hasAccess = patient.accesses.some((access) => access.userId === userId);

  if (!isStaff && !isOwner && !hasAccess) {
    throw createError("Nu ai acces la istoricul vaccinărilor acestui pacient", 403);
  }

  return prisma.vaccinationRecord.findMany({
    where: {
      patientId,
    },
    include: {
      createdByUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: [
      { administeredAt: "desc" },
      { scheduledAt: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function updateVaccinationRecord(recordId, data, currentUser) {
  assertVaccinationEditor(currentUser);

  const existing = await prisma.vaccinationRecord.findUnique({
    where: { id: recordId },
  });

  if (!existing) {
    throw createError("Vaccination record not found", 404);
  }

  return prisma.vaccinationRecord.update({
    where: { id: recordId },
    data: {
      vaccineName: data.vaccineName,
      doseLabel: data.doseLabel,
      status: data.status,
      administeredAt:
        data.administeredAt === null
          ? null
          : data.administeredAt
          ? new Date(data.administeredAt)
          : undefined,
      scheduledAt:
        data.scheduledAt === null
          ? null
          : data.scheduledAt
          ? new Date(data.scheduledAt)
          : undefined,
      manufacturer: data.manufacturer,
      batchNumber: data.batchNumber,
      site: data.site,
      route: data.route,
      notes: data.notes,
    },
    include: {
      patient: true,
      createdByUser: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function deleteVaccinationRecord(recordId, currentUser) {
  assertVaccinationEditor(currentUser);

  const existing = await prisma.vaccinationRecord.findUnique({
    where: { id: recordId },
  });

  if (!existing) {
    throw createError("Vaccination record not found", 404);
  }

  await prisma.vaccinationRecord.delete({
    where: { id: recordId },
  });

  return { message: "Vaccination record deleted successfully" };
}