import { prisma } from "../db/prisma.js";

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createReferral({
  consultationId,
  specialty,
  reason,
  clinicalSummary,
  destinationUnit,
  notes,
  priority,
  issuedAt,
  currentUser,
}) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      patient: {
        include: {
          accesses: true,
          user: true,
        },
      },
      doctor: true,
      referrals: true,
    },
  });

  if (!consultation) {
    throw createError("Consultația nu a fost găsită", 404);
  }

  const canCreate =
    (currentUser.role === "DOCTOR" && consultation.doctorId === currentUser.id) ||
    currentUser.role === "ASSISTANT";

  if (!canCreate) {
    throw createError("Nu ai voie să creezi trimitere pentru această consultație", 403);
  }

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      INSERT INTO "DocumentCounter" (type, value)
      VALUES ('REFERRAL', 1)
      ON CONFLICT (type) DO UPDATE SET value = "DocumentCounter".value + 1
      RETURNING value
    `;
    const serialNumber = Number(rows[0].value);

    return tx.referral.create({
      data: {
        consultationId: consultation.id,
        doctorId: consultation.doctorId,
        patientId: consultation.patientId,
        specialty,
        reason,
        clinicalSummary,
        destinationUnit,
        notes,
        priority: priority ?? "ROUTINE",
        issuedAt: issuedAt ? new Date(issuedAt) : null,
        serialNumber,
      },
      include: {
        consultation: true,
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
  });
}

export async function getReferralById(referralId, currentUser) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      consultation: true,
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

  if (!referral) {
    throw createError("Trimiterea nu a fost găsită", 404);
  }

  const userId = currentUser.sub || currentUser.id;
  const role = currentUser.role;

  const isDoctorOwner = referral.doctorId === userId;
  const isStaff = role === "DOCTOR" || role === "ASSISTANT" || role === "ADMIN";
  const isPatientOwner = referral.patient.userId === userId;
  const hasPatientAccess = referral.patient.accesses.some(
    (access) => access.userId === userId
  );

  if (!isDoctorOwner && !isStaff && !isPatientOwner && !hasPatientAccess) {
    throw createError("Nu ai acces la această trimitere", 403);
  }

  return referral;
}

export async function updateReferral(referralId, currentUser, data) {
  const existing = await prisma.referral.findUnique({
    where: { id: referralId },
  });

  if (!existing) {
    throw createError("Trimiterea nu a fost găsită", 404);
  }

  const canEdit =
    (currentUser.role === "DOCTOR" && existing.doctorId === currentUser.id) ||
    currentUser.role === "ASSISTANT";

  if (!canEdit) {
    throw createError("Nu ai voie să modifici această trimitere", 403);
  }

  return prisma.referral.update({
    where: { id: referralId },
    data: {
      specialty: data.specialty,
      reason: data.reason,
      clinicalSummary: data.clinicalSummary,
      destinationUnit: data.destinationUnit,
      notes: data.notes,
      priority: data.priority,
      issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
    },
    include: {
      consultation: true,
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
}

export async function getMyDoctorReferrals(currentUser) {
  if (!["DOCTOR", "ASSISTANT", "ADMIN"].includes(currentUser.role)) {
    throw createError("Forbidden", 403);
  }

  const whereClause =
    currentUser.role === "DOCTOR"
      ? { doctorId: currentUser.id }
      : {};

  return prisma.referral.findMany({
    where: whereClause,
    include: {
      consultation: true,
      patient: true,
      doctor: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPatientReferrals(patientId, currentUser) {
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

  const isStaff = role === "DOCTOR" || role === "ASSISTANT" || role === "ADMIN";
  const isOwner = patient.userId === userId;
  const hasAccess = patient.accesses.some((access) => access.userId === userId);

  if (!isStaff && !isOwner && !hasAccess) {
    throw createError("Nu ai acces la trimiterile acestui pacient", 403);
  }

  return prisma.referral.findMany({
    where: {
      patientId,
    },
    include: {
      consultation: true,
      doctor: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}