import {prisma} from "../db/prisma.js";
import {
  parseTimeToMinutes,
  generateSlots,
  getWeekdayFromDateString,
  getDayBounds,
  timeFromDate,
  isTimeInsideInterval,
  isValidSlotBoundary,
} from "../utils/time.js";

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

async function ensureDoctorExists(doctorId) {
  const doctor = await prisma.user.findFirst({
    where: {
      id: doctorId,
      role: "DOCTOR",
    },
  });

  if (!doctor) {
    throw createError("Doctorul nu există", 404);
  }

  return doctor;
}

async function ensureNoScheduleOverlap({
  doctorId,
  weekday,
  startTime,
  endTime,
  excludeId = null,
}) {
  const existing = await prisma.doctorSchedule.findMany({
    where: {
      doctorId,
      weekday,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  const newStart = parseTimeToMinutes(startTime);
  const newEnd = parseTimeToMinutes(endTime);

  for (const row of existing) {
    const existingStart = parseTimeToMinutes(row.startTime);
    const existingEnd = parseTimeToMinutes(row.endTime);

    if (intervalsOverlap(newStart, newEnd, existingStart, existingEnd)) {
      throw createError(
        "Intervalul se suprapune peste alt interval deja existent pentru această zi",
        409
      );
    }
  }
}

export async function createDoctorSchedule({
  doctorId,
  weekday,
  startTime,
  endTime,
  slotMinutes,
}) {
  await ensureDoctorExists(doctorId);

  await ensureNoScheduleOverlap({
    doctorId,
    weekday,
    startTime,
    endTime,
  });

  return prisma.doctorSchedule.create({
    data: {
      doctorId,
      weekday,
      startTime,
      endTime,
      slotMinutes,
    },
  });
}

export async function getMyDoctorSchedules(doctorId) {
  await ensureDoctorExists(doctorId);

  return prisma.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
}

export async function updateDoctorSchedule(scheduleId, doctorId, data) {
  const existing = await prisma.doctorSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!existing) {
    throw createError("Intervalul nu a fost găsit", 404);
  }

  if (existing.doctorId !== doctorId) {
    throw createError("Nu ai acces la acest interval", 403);
  }

  const nextWeekday = data.weekday ?? existing.weekday;
  const nextStartTime = data.startTime ?? existing.startTime;
  const nextEndTime = data.endTime ?? existing.endTime;
  const nextSlotMinutes = data.slotMinutes ?? existing.slotMinutes;

  if (nextStartTime >= nextEndTime) {
    throw createError("startTime trebuie să fie mai mic decât endTime", 400);
  }

  await ensureNoScheduleOverlap({
    doctorId,
    weekday: nextWeekday,
    startTime: nextStartTime,
    endTime: nextEndTime,
    excludeId: scheduleId,
  });

  return prisma.doctorSchedule.update({
    where: { id: scheduleId },
    data: {
      weekday: nextWeekday,
      startTime: nextStartTime,
      endTime: nextEndTime,
      slotMinutes: nextSlotMinutes,
    },
  });
}

export async function deleteDoctorSchedule(scheduleId, doctorId) {
  const existing = await prisma.doctorSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!existing) {
    throw createError("Intervalul nu a fost găsit", 404);
  }

  if (existing.doctorId !== doctorId) {
    throw createError("Nu ai acces la acest interval", 403);
  }

  await prisma.doctorSchedule.delete({
    where: { id: scheduleId },
  });

  return { message: "Interval șters cu succes" };
}

export async function getDoctorAvailableSlots(doctorId, date) {
  await ensureDoctorExists(doctorId);

  const weekday = getWeekdayFromDateString(date);

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId,
      weekday,
    },
    orderBy: { startTime: "asc" },
  });

  if (!schedules.length) {
    return [];
  }

  const { start, end } = getDayBounds(date);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: {
        gte: start,
        lte: end,
      },
      status: {
        not: "CANCELED",
      },
    },
    select: {
      scheduledAt: true,
    },
  });

  const occupiedTimes = new Set(appointments.map((a) => timeFromDate(a.scheduledAt)));

  const available = [];

  for (const schedule of schedules) {
    const slots = generateSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotMinutes
    );

    for (const time of slots) {
      if (!occupiedTimes.has(time)) {
        available.push({
          time,
          scheduledAt: new Date(`${date}T${time}:00`),
        });
      }
    }
  }

  return available;
}

export async function assertDoctorSlotAvailable({ doctorId, scheduledAt }) {
  await ensureDoctorExists(doctorId);

  const dateObj = new Date(scheduledAt);
  if (Number.isNaN(dateObj.getTime())) {
    throw createError("scheduledAt invalid", 400);
  }

  const dateString = [
    dateObj.getFullYear(),
    String(dateObj.getMonth() + 1).padStart(2, "0"),
    String(dateObj.getDate()).padStart(2, "0"),
  ].join("-");

  const weekday = dateObj.getDay();
  const requestedTime = timeFromDate(dateObj);

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId,
      weekday,
    },
    orderBy: { startTime: "asc" },
  });

  if (!schedules.length) {
    throw createError("Doctorul nu are program în ziua selectată", 400);
  }

  const matchingSchedule = schedules.find((schedule) => {
    return (
      isTimeInsideInterval(requestedTime, schedule.startTime, schedule.endTime) &&
      isValidSlotBoundary(requestedTime, schedule.startTime, schedule.slotMinutes)
    );
  });

  if (!matchingSchedule) {
    throw createError("Ora selectată nu face parte din programul doctorului", 400);
  }

  const { start, end } = getDayBounds(dateString);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      scheduledAt: {
        gte: start,
        lte: end,
      },
      status: {
        not: "CANCELED",
      },
    },
  });

  if (existingAppointment) {
    const existingTime = timeFromDate(existingAppointment.scheduledAt);
    if (existingTime === requestedTime) {
      throw createError("Slotul selectat este deja ocupat", 409);
    }
  }

  return true;
}