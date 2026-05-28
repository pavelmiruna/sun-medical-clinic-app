import { prisma } from "../db/prisma.js";

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createConsultation({
  appointment,
  chiefComplaint,
  diagnosis,
  treatment,
  objectiveFindings,
  notes,
  recommendations,
  plan,
}) {
  if (!appointment) {
    throw createError("Programarea nu a fost încărcată", 400);
  }

  if (appointment.status === "CANCELED") {
    throw createError("Nu poți crea consultație pentru o programare anulată", 400);
  }

  if (appointment.consultation) {
    throw createError("Există deja o consultație pentru această programare", 409);
  }

  const consultation = await prisma.$transaction(async (tx) => {
    const createdConsultation = await tx.consultation.create({
    data: {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        chiefComplaint,
        diagnosis,
        treatment,
        objectiveFindings,
        notes,
        recommendations,
        plan,
    },
      include: {
        appointment: true,
        patient: true,
        doctor: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "COMPLETED",
      },
    });

    return createdConsultation;
  });

  return consultation;
}

export async function getConsultationById(consultationId, currentUser) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      appointment: true,
      patient: {
        include: {
          accesses: true,
          user: true,
        },
      },
      doctor: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!consultation) {
    throw createError("Consultația nu a fost găsită", 404);
  }

  const userId = currentUser.sub || currentUser.id;
  const role = currentUser.role;

  const isDoctorOwner = consultation.doctorId === userId;
  const isStaff = role === "DOCTOR" || role === "ASSISTANT" || role === "ADMIN";
  const isPatientOwner = consultation.patient.userId === userId;
  const hasPatientAccess = consultation.patient.accesses.some(
    (access) => access.userId === userId
  );

  if (!isDoctorOwner && !isStaff && !isPatientOwner && !hasPatientAccess) {
    throw createError("Nu ai acces la această consultație", 403);
  }

  return consultation;
}

export async function updateConsultation(consultationId, data) {
  const existing = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!existing) {
    throw createError("Consultația nu a fost găsită", 404);
  }

  return prisma.consultation.update({
    where: { id: consultationId },
    data: {
        chiefComplaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        objectiveFindings: data.objectiveFindings,
        notes: data.notes,
        recommendations: data.recommendations,
        plan: data.plan,
    },
    include: {
      appointment: true,
      patient: true,
      doctor: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function createWalkInConsultation({
  doctorId,
  patientId,
  chiefComplaint,
  diagnosis,
  treatment,
  objectiveFindings,
  notes,
  recommendations,
  plan,
}) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { id: true },
  });
  if (!patient) throw createError("Pacientul nu a fost găsit", 404);

  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.create({
      data: {
        patientId,
        doctorId,
        createdByUserId: doctorId,
        scheduledAt: new Date(),
        reason: "ADMINISTRATIVE",
        status: "COMPLETED",
      },
    });

    return tx.consultation.create({
      data: {
        appointmentId: appointment.id,
        doctorId,
        patientId,
        chiefComplaint,
        diagnosis,
        treatment,
        objectiveFindings,
        notes,
        recommendations,
        plan,
      },
      include: {
        appointment: true,
        patient: true,
        doctor: { select: { id: true, email: true, role: true } },
      },
    });
  });
}

export async function getMyDoctorConsultations(currentUser) {
  const userId = currentUser.id || currentUser.sub;
  const role = currentUser.role;

  let where = { doctorId: userId };

  if (role === "ASSISTANT") {
    const assistant = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedDoctorId: true },
    });
    where = assistant?.assignedDoctorId
      ? { doctorId: assistant.assignedDoctorId }
      : {};
  }

  return prisma.consultation.findMany({
    where,
    include: {
      appointment: true,
      patient: true,
      doctor: { select: { id: true, email: true } },
    },
    orderBy: { appointment: { scheduledAt: "desc" } },
  });
}

export async function getPatientConsultations(patientId, currentUser) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      accesses: true,
    },
  });

  if (!patient) {
    throw createError("Pacientul nu a fost găsit", 404);
  }

  const userId = currentUser.sub || currentUser.id;
  const role = currentUser.role;

  const isStaff = role === "DOCTOR" || role === "ASSISTANT" || role === "ADMIN";
  const isOwner = patient.userId === userId;
  const hasAccess = patient.accesses.some((access) => access.userId === userId);

  if (!isStaff && !isOwner && !hasAccess) {
    throw createError("Nu ai acces la consultațiile acestui pacient", 403);
  }

  return prisma.consultation.findMany({
    where: {
      patientId,
    },
    include: {
      appointment: true,
      doctor: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { appointment: { scheduledAt: "desc" } },
  });
}