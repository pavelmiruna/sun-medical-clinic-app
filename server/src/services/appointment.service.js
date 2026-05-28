import { prisma } from "../db/prisma.js";
import { assertDoctorSlotAvailable } from "./doctorSchedule.service.js";
import { sendAppointmentConfirmation } from "./email.service.js";

export async function createAppointment({
  requesterId,
  requesterRole,
  patientId,
  doctorId,
  scheduledAt,
  reason,
}) {
  const date = new Date(scheduledAt);

  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    select: { id: true, role: true },
  });

  if (!doctor || doctor.role !== "DOCTOR") {
    const err = new Error("Medicul selectat nu este valid.");
    err.status = 400;
    throw err;
  }

  if (requesterRole === "PATIENT") {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { userId: true },
    });

    if (!patient) {
      const err = new Error("Pacientul nu a fost găsit.");
      err.status = 404;
      throw err;
    }

    const hasAccess =
      patient.userId === requesterId ||
      !!(await prisma.patientAccess.findUnique({
        where: {
          userId_patientId: {
            userId: requesterId,
            patientId,
          },
        },
        select: { id: true },
      }));

    if (!hasAccess) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }
  }

  await assertDoctorSlotAvailable({
    doctorId,
    scheduledAt: date,
  });

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        createdByUserId: requesterId,
        scheduledAt: date,
        reason: reason ?? null,
        status: "SCHEDULED",
      },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        createdByUserId: true,
        scheduledAt: true,
        reason: true,
        status: true,
        createdAt: true,
        consultation: {
          select: {
            id: true,
          },
        },
      },
    });

    sendAppointmentConfirmationIfPossible(appointment).catch((err) => {
      console.error("[Email] Eroare la trimitere confirmare:", err.message);
    });

    return appointment;
  } catch (e) {
    if (e.code === "P2002") {
      const err = new Error("Acest slot este deja ocupat. Te rugăm să alegi altă oră.");
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

async function sendAppointmentConfirmationIfPossible(appointment) {
  const [patientProfile, doctor] = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { id: appointment.patientId },
      select: {
        firstName: true, lastName: true,
        user: { select: { email: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: appointment.doctorId },
      select: {
        email: true,
        doctorProfile: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const email = patientProfile?.user?.email;
  if (!email) return;

  const doctorName = doctor?.doctorProfile?.firstName
    ? `Dr. ${doctor.doctorProfile.firstName} ${doctor.doctorProfile.lastName}`
    : doctor?.email ?? "Medicul dumneavoastră";

  await sendAppointmentConfirmation({
    to: email,
    patientName: `${patientProfile.firstName} ${patientProfile.lastName}`,
    doctorName,
    scheduledAt: appointment.scheduledAt,
    reason: appointment.reason,
  });
}

export async function getMyAppointments({ requesterId, requesterRole }) {
  if (requesterRole === "DOCTOR") {
    return prisma.appointment.findMany({
      where: { doctorId: requesterId },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        scheduledAt: true,
        reason: true,
        status: true,
        consultation: {
          select: {
            id: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            claimedAt: true,
            dateOfBirth: true,
            isMinor: true,
          },
        },
      },
    });
  }

  if (requesterRole === "PATIENT") {
    return prisma.appointment.findMany({
      where: {
        OR: [
          {
            patient: {
              userId: requesterId,
            },
          },
          {
            patient: {
              accesses: {
                some: {
                  userId: requesterId,
                },
              },
            },
          },
        ],
      },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        scheduledAt: true,
        reason: true,
        status: true,
        consultation: {
          select: {
            id: true,
          },
        },
        doctor: {
          select: {
            id: true,
            email: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  if (requesterRole === "ASSISTANT") {
    const assistant = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { assignedDoctorId: true },
    });
    const assignedDoctorId = assistant?.assignedDoctorId;

    return prisma.appointment.findMany({
      where: assignedDoctorId ? { doctorId: assignedDoctorId } : {},
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        scheduledAt: true,
        reason: true,
        status: true,
        consultation: { select: { id: true } },
        doctor: { select: { id: true, email: true } },
        patient: {
          select: {
            id: true, firstName: true, lastName: true,
            userId: true, claimedAt: true, dateOfBirth: true, isMinor: true,
          },
        },
      },
    });
  }

  return [];
}

export async function cancelAppointment({ appointmentId, requesterId, requesterRole }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      doctorId: true,
      patientId: true,
      consultation: {
        select: {
          id: true,
        },
      },
      patient: {
        select: { userId: true },
      },
    },
  });

  if (!appointment) {
    const err = new Error("Programarea nu a fost găsită.");
    err.status = 404;
    throw err;
  }

  if (appointment.consultation) {
    const err = new Error("Nu poți anula o programare care are deja o consultație înregistrată.");
    err.status = 400;
    throw err;
  }

  let allowed = false;

  if (requesterRole === "DOCTOR" && appointment.doctorId === requesterId) {
    allowed = true;
  }

  if (requesterRole === "ASSISTANT") {
    allowed = true;
  }

  if (requesterRole === "PATIENT") {
    const hasAccess =
      appointment.patient.userId === requesterId ||
      !!(await prisma.patientAccess.findUnique({
        where: {
          userId_patientId: {
            userId: requesterId,
            patientId: appointment.patientId,
          },
        },
        select: { id: true },
      }));

    if (hasAccess) allowed = true;
  }

  if (!allowed) {
    const err = new Error("Nu ai permisiunea de a efectua această acțiune.");
    err.status = 403;
    throw err;
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELED" },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      consultation: {
        select: {
          id: true,
        },
      },
    },
  });
}

export async function completeAppointment(appointmentId, currentUser) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, doctorId: true, status: true },
  });

  if (!appointment) {
    const err = new Error("Programarea nu a fost găsită");
    err.statusCode = 404; throw err;
  }

  if (appointment.doctorId !== currentUser.id) {
    const err = new Error("Forbidden");
    err.statusCode = 403; throw err;
  }

  if (appointment.status !== "NO_SHOW") {
    const err = new Error("Doar programările marcate ca absent pot fi finalizate");
    err.statusCode = 400; throw err;
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" },
  });
}