import cron from "node-cron";
import { prisma } from "../db/prisma.js";
import { sendAppointmentReminder } from "../services/email.service.js";

export async function sendPendingReminders() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "SCHEDULED",
      reminderSentAt: null,
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
    select: {
      id: true,
      scheduledAt: true,
      reason: true,
      patient: {
        select: {
          firstName: true, lastName: true,
          user: { select: { email: true } },
        },
      },
      doctor: {
        select: {
          email: true,
          doctorProfile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (appointments.length === 0) return;

  let sent = 0;
  for (const appt of appointments) {
    const email = appt.patient?.user?.email;
    if (!email) continue;

    const doctorName = appt.doctor?.doctorProfile?.firstName
      ? `Dr. ${appt.doctor.doctorProfile.firstName} ${appt.doctor.doctorProfile.lastName}`
      : appt.doctor?.email ?? "Medicul dumneavoastră";

    try {
      await sendAppointmentReminder({
        to: email,
        patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
        doctorName,
        scheduledAt: appt.scheduledAt,
        reason: appt.reason,
      });

      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: now },
      });

      sent++;
    } catch (e) {
      console.error(`[ReminderJob] Failed for appointment ${appt.id}:`, e.message);
    }
  }

  if (sent > 0) {
    console.log(`[ReminderJob] Sent ${sent} reminder(s)`);
  }
}

export function startReminderJob() {
  cron.schedule("0 * * * *", () => {
    sendPendingReminders().catch((e) =>
      console.error("[ReminderJob] Error:", e.message)
    );
  });

  console.log("[ReminderJob] Started — runs every hour");
}
