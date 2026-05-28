import { prisma } from "../db/prisma.js";

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createPrescription({
  consultationId,
  generalInstructions,
  issuedAt,
  doctorUserId,
  callerRole,
}) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      patient: {
        include: {
          accesses: true,
        },
      },
      appointment: true,
      doctor: {
        include: {
          doctorProfile: {
            include: { clinic: true },
          },
        },
      },
      prescriptions: true,
    },
  });

  if (!consultation) {
    throw createError("Consultația nu a fost găsită", 404);
  }

  if (callerRole !== "ASSISTANT" && consultation.doctorId !== doctorUserId) {
    throw createError("Poți crea rețete doar pentru consultațiile tale", 403);
  }

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      INSERT INTO "DocumentCounter" (type, value)
      VALUES ('PRESCRIPTION', 1)
      ON CONFLICT (type) DO UPDATE SET value = "DocumentCounter".value + 1
      RETURNING value
    `;
    const serialNumber = Number(rows[0].value);

    return tx.prescription.create({
      data: {
        consultationId: consultation.id,
        doctorId: consultation.doctorId,
        patientId: consultation.patientId,
        generalInstructions,
        issuedAt: issuedAt ? new Date(issuedAt) : null,
        serialNumber,
      },
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
        items: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });
  });
}

export async function getPrescriptionById(prescriptionId, currentUser) {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      consultation: true,
      items: {
        orderBy: {
          orderIndex: "asc",
        },
      },
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

  if (!prescription) {
    throw createError("Rețeta nu a fost găsită", 404);
  }

  const userId = currentUser.sub || currentUser.id;
  const role = currentUser.role;

  const isDoctorOwner = prescription.doctorId === userId;
  const isStaff = role === "DOCTOR" || role === "ASSISTANT" || role === "ADMIN";
  const isPatientOwner = prescription.patient.userId === userId;
  const hasPatientAccess = prescription.patient.accesses.some(
    (access) => access.userId === userId
  );

  if (!isDoctorOwner && !isStaff && !isPatientOwner && !hasPatientAccess) {
    throw createError("Nu ai acces la această rețetă", 403);
  }

  return prescription;
}

export async function updatePrescription(prescriptionId, currentUser, data) {
  const userId = currentUser.id || currentUser.sub;
  const existing = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
  });

  if (!existing) {
    throw createError("Rețeta nu a fost găsită", 404);
  }

  if (currentUser.role !== "ASSISTANT" && existing.doctorId !== userId) {
    throw createError("Poți modifica doar rețetele tale", 403);
  }

  return prisma.prescription.update({
    where: { id: prescriptionId },
    data: {
      generalInstructions: data.generalInstructions,
      issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
    },
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
      items: {
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });
}

export async function getMyDoctorPrescriptions(doctorUserId) {
  return prisma.prescription.findMany({
    where: {
      doctorId: doctorUserId,
    },
    include: {
      consultation: true,
      patient: true,
      items: {
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPatientPrescriptions(patientId, currentUser) {
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
    throw createError("Nu ai acces la rețetele acestui pacient", 403);
  }

  return prisma.prescription.findMany({
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
      items: {
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function addPrescriptionItem(prescriptionId, currentUser, data) {
  const userId = currentUser.id || currentUser.sub;
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
  });

  if (!prescription) {
    throw createError("Rețeta nu a fost găsită", 404);
  }

  if (currentUser.role !== "ASSISTANT" && prescription.doctorId !== userId) {
    throw createError("Poți modifica doar rețetele tale", 403);
  }

  return prisma.prescriptionItem.create({
    data: {
      prescriptionId,
      medicationName: data.medicationName,
      form: data.form,
      concentration: data.concentration,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      route: data.route,
      instructions: data.instructions,
      quantity: data.quantity,
      orderIndex: data.orderIndex ?? 0,
    },
  });
}

export async function updatePrescriptionItem(itemId, currentUser, data) {
  const userId = currentUser.id || currentUser.sub;
  const item = await prisma.prescriptionItem.findUnique({
    where: { id: itemId },
    include: { prescription: true },
  });

  if (!item) {
    throw createError("Linia de rețetă nu a fost găsită", 404);
  }

  if (currentUser.role !== "ASSISTANT" && item.prescription.doctorId !== userId) {
    throw createError("Poți modifica doar rețetele tale", 403);
  }

  return prisma.prescriptionItem.update({
    where: { id: itemId },
    data: {
      medicationName: data.medicationName,
      form: data.form,
      concentration: data.concentration,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      route: data.route,
      instructions: data.instructions,
      quantity: data.quantity,
      orderIndex: data.orderIndex,
    },
  });
}

export async function deletePrescriptionItem(itemId, currentUser) {
  const userId = currentUser.id || currentUser.sub;
  const item = await prisma.prescriptionItem.findUnique({
    where: { id: itemId },
    include: { prescription: true },
  });

  if (!item) {
    throw createError("Linia de rețetă nu a fost găsită", 404);
  }

  if (currentUser.role !== "ASSISTANT" && item.prescription.doctorId !== userId) {
    throw createError("Poți modifica doar rețetele tale", 403);
  }

  await prisma.prescriptionItem.delete({
    where: { id: itemId },
  });

  return { message: "Linie de rețetă ștearsă cu succes" };
}