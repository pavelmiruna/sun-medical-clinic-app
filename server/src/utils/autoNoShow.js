import { prisma } from "../db/prisma.js";

export async function markPastAppointmentsAsNoShow() {
  const now = new Date();

  const pastAppointments = await prisma.appointment.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lt: now },
      consultation: null,
    },
    select: {
      id: true,
      doctorId: true,
      scheduledAt: true,
    },
  });

  if (pastAppointments.length === 0) return 0;

  const idsToMark = [];

  for (const appt of pastAppointments) {
    const scheduledAt = new Date(appt.scheduledAt);
    const weekday = scheduledAt.getDay();
    const hours = String(scheduledAt.getHours()).padStart(2, "0");
    const minutes = String(scheduledAt.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId: appt.doctorId,
        weekday,
        startTime: { lte: timeStr },
        endTime: { gt: timeStr },
      },
    });

    const slotMinutes = schedule?.slotMinutes ?? 30;
    const endTime = new Date(scheduledAt.getTime() + slotMinutes * 60 * 1000);

    if (endTime <= now) {
      idsToMark.push(appt.id);
    }
  }

  if (idsToMark.length === 0) return 0;

  const result = await prisma.appointment.updateMany({
    where: { id: { in: idsToMark } },
    data: { status: "NO_SHOW" },
  });

  if (result.count > 0) {
    console.log(`[AutoNoShow] Marked ${result.count} appointment(s) as NO_SHOW`);
  }

  return result.count;
}