import { GoogleGenAI } from "@google/genai";
import { prisma } from "../db/prisma.js";
import { generateSlots, getWeekdayFromDateString, timeFromDate } from "../utils/time.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

async function callGemini(contents) {
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    try {
      const result = await ai.models.generateContent({ model: GEMINI_MODELS[i], contents });
      return result.text;
    } catch (e) {
      if (e.status === 503 && i < GEMINI_MODELS.length - 1) continue;
      throw e;
    }
  }
}

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const WEEKDAY_NAMES_RO = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

function toLocalDateString(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function formatDate(date) {
  if (!date) return "necunoscută";
  return new Date(date).toLocaleDateString("ro-RO");
}

// ─────────────────────────────────────────────
// 1. SUMARIZARE DOSAR MEDICAL
// ─────────────────────────────────────────────

export async function getPatientMedicalSummary(patientId, currentUser) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      accesses: true,
    },
  });

  if (!patient) {
    throw createError("Pacientul nu a fost găsit", 404);
  }

  const userId = currentUser.id;
  const role = currentUser.role;

  const isStaff = ["DOCTOR", "ASSISTANT", "ADMIN"].includes(role);
  const isOwner = patient.userId === userId;
  const hasAccess = patient.accesses.some((a) => a.userId === userId);

  if (!isStaff && !isOwner && !hasAccess) {
    throw createError("Nu ai acces la dosarul acestui pacient", 403);
  }

  const [consultations, prescriptions, referrals, vaccinations] =
    await Promise.all([
      prisma.consultation.findMany({
        where: { patientId },
        include: {
          appointment: { select: { scheduledAt: true, reason: true } },
          doctor: { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.prescription.findMany({
        where: { patientId },
        include: {
          items: { orderBy: { orderIndex: "asc" } },
          doctor: { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.referral.findMany({
        where: { patientId },
        include: {
          doctor: { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.vaccinationRecord.findMany({
        where: { patientId },
        orderBy: { administeredAt: "desc" },
      }),
    ]);

  const age = calculateAge(patient.dateOfBirth);

  const prompt = `
Ești un asistent medical. Generează un sumar clinic concis și structurat al dosarului medical al pacientului de mai jos.
Scrie în română. Fii obiectiv, precis și folosește un limbaj medical adecvat.
Nu inventa informații. Dacă o secțiune nu are date, menționează scurt că nu există înregistrări.

=== DATE PACIENT ===
Nume: ${patient.firstName} ${patient.lastName}
Vârstă: ${age !== null ? `${age} ani` : "necunoscută"}
Data nașterii: ${formatDate(patient.dateOfBirth)}
Minor: ${patient.isMinor ? "Da" : "Nu"}

=== CONSULTAȚII (${consultations.length} total) ===
${
  consultations.length === 0
    ? "Nicio consultație înregistrată."
    : consultations
        .map(
          (c, i) => `
[${i + 1}] Data: ${formatDate(c.appointment?.scheduledAt)} | Doctor: ${c.doctor?.email}
  Motiv prezentare: ${c.chiefComplaint || "-"}
  Constatări obiective: ${c.objectiveFindings || "-"}
  Diagnostic: ${c.diagnosis || "-"}
  Tratament: ${c.treatment || "-"}
  Recomandări: ${c.recommendations || "-"}
  Plan: ${c.plan || "-"}
`
        )
        .join("")
}

=== REȚETE (${prescriptions.length} total) ===
${
  prescriptions.length === 0
    ? "Nicio rețetă înregistrată."
    : prescriptions
        .map(
          (p, i) => `
[${i + 1}] Data: ${formatDate(p.issuedAt || p.createdAt)} | Doctor: ${p.doctor?.email}
  Instrucțiuni generale: ${p.generalInstructions || "-"}
  Medicamente:
  ${
    p.items.length === 0
      ? "  (niciun medicament adăugat)"
      : p.items
          .map(
            (item) =>
              `  - ${item.medicationName}${item.form ? ` (${item.form})` : ""}${item.concentration ? ` ${item.concentration}` : ""} | Doză: ${item.dosage || "-"} | Frecvență: ${item.frequency || "-"} | Durată: ${item.duration || "-"}`
          )
          .join("\n")
  }
`
        )
        .join("")
}

=== TRIMITERI (${referrals.length} total) ===
${
  referrals.length === 0
    ? "Nicio trimitere înregistrată."
    : referrals
        .map(
          (r, i) => `
[${i + 1}] Data: ${formatDate(r.issuedAt || r.createdAt)} | Doctor: ${r.doctor?.email}
  Specialitate: ${r.specialty}
  Prioritate: ${r.priority}
  Motiv: ${r.reason || "-"}
  Sumar clinic: ${r.clinicalSummary || "-"}
  Unitate destinație: ${r.destinationUnit || "-"}
`
        )
        .join("")
}

=== VACCINURI (${vaccinations.length} total) ===
${
  vaccinations.length === 0
    ? "Niciun vaccin înregistrat."
    : vaccinations
        .map(
          (v) =>
            `- ${v.vaccineName}${v.doseLabel ? ` (${v.doseLabel})` : ""} | Status: ${v.status} | Data: ${formatDate(v.administeredAt || v.scheduledAt)}`
        )
        .join("\n")
}

=== INSTRUCȚIUNI SUMAR ===
Structurează răspunsul în secțiunile:
1. Prezentare generală pacient
2. Istoric consultații și diagnostice principale
3. Tratamente și medicație curentă/recentă
4. Trimiteri și investigații
5. Istoricul vaccinărilor
6. Observații și recomandări (dacă există pattern-uri relevante)

Fii concis. Maxim 400 cuvinte.
`;

  let summary;
  try {
    summary = await callGemini(prompt);
  } catch (e) {
    throw createError("Serviciul AI este temporar indisponibil. Încearcă din nou.", 503);
  }

  return {
    patientId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    generatedAt: new Date().toISOString(),
    summary,
    dataSnapshot: {
      consultationsCount: consultations.length,
      prescriptionsCount: prescriptions.length,
      referralsCount: referrals.length,
      vaccinationsCount: vaccinations.length,
    },
  };
}

// ─────────────────────────────────────────────
// 2. CHATBOT PACIENT
// ─────────────────────────────────────────────

export async function patientChatMessage({ message, patientId, currentUser, isFirstMessage = false }) {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: { accesses: true },
  });

  if (!patient) {
    throw createError("Pacientul nu a fost găsit", 404);
  }

  const userId = currentUser.id;
  const role = currentUser.role;

  const isStaff = ["DOCTOR", "ASSISTANT", "ADMIN"].includes(role);
  const isOwner = patient.userId === userId;
  const hasAccess = patient.accesses.some((a) => a.userId === userId);

  if (!isStaff && !isOwner && !hasAccess) {
    throw createError("Nu ai acces la datele acestui pacient", 403);
  }

  const assignedDoctorId = patient.assignedDoctorId;

  const [appointments, prescriptions, vaccinations, referrals, clinic, doctorProfile, doctorSchedules] =
    await Promise.all([
      prisma.appointment.findMany({
        where: { patientId },
        orderBy: { scheduledAt: "desc" },
        take: 10,
        include: {
          doctor: { select: { email: true } },
          consultation: { select: { id: true, diagnosis: true } },
        },
      }),

      prisma.prescription.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: { orderBy: { orderIndex: "asc" } },
          doctor: { select: { email: true } },
        },
      }),

      prisma.vaccinationRecord.findMany({
        where: { patientId },
        orderBy: { administeredAt: "desc" },
        take: 10,
      }),

      prisma.referral.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          doctor: { select: { email: true } },
        },
      }),

      prisma.clinic.findFirst(),

      assignedDoctorId
        ? prisma.doctorProfile.findUnique({
            where: { userId: assignedDoctorId },
            select: { firstName: true, lastName: true, specialization: true },
          })
        : null,

      assignedDoctorId
        ? prisma.doctorSchedule.findMany({
            where: { doctorId: assignedDoctorId },
            orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
          })
        : [],
    ]);

  let availableSlotsByDate = [];
  if (assignedDoctorId && doctorSchedules.length > 0) {
    const today = new Date();
    const datesToCheck = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      datesToCheck.push(toLocalDateString(d));
    }

    const rangeStart = new Date(today);
    rangeStart.setDate(today.getDate() + 1);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(today);
    rangeEnd.setDate(today.getDate() + 7);
    rangeEnd.setHours(23, 59, 59, 999);

    const upcomingAppts = await prisma.appointment.findMany({
      where: {
        doctorId: assignedDoctorId,
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
        status: { not: "CANCELED" },
      },
      select: { scheduledAt: true },
    });

    const apptsByDate = {};
    for (const appt of upcomingAppts) {
      const key = toLocalDateString(appt.scheduledAt);
      if (!apptsByDate[key]) apptsByDate[key] = new Set();
      apptsByDate[key].add(timeFromDate(appt.scheduledAt));
    }

    for (const dateStr of datesToCheck) {
      const weekday = getWeekdayFromDateString(dateStr);
      const daySchedules = doctorSchedules.filter((s) => s.weekday === weekday);
      if (daySchedules.length === 0) continue;

      const occupied = apptsByDate[dateStr] || new Set();
      const freeSlots = [];
      for (const sched of daySchedules) {
        const slots = generateSlots(sched.startTime, sched.endTime, sched.slotMinutes);
        for (const slot of slots) {
          if (!occupied.has(slot)) freeSlots.push(slot);
        }
      }
      if (freeSlots.length > 0) {
        availableSlotsByDate.push({ date: dateStr, weekdayName: WEEKDAY_NAMES_RO[weekday], slots: freeSlots });
      }
    }
  }

  const age = calculateAge(patient.dateOfBirth);

  const doctorName = doctorProfile
    ? `Dr. ${doctorProfile.firstName || ""} ${doctorProfile.lastName || ""}`.trim()
    : null;

  const context = `
Ești un asistent virtual al cabinetului medical pentru pacientul ${patient.firstName} ${patient.lastName}, ${age !== null ? `${age} ani` : "vârstă necunoscută"}.
Răspunzi pe baza datelor furnizate mai jos. Nu inventa informații.
Dacă nu știi ceva sau datele nu sunt disponibile, spune că nu ai informații despre asta.
Răspunde în română, pe un ton prietenos și clar. Nu da sfaturi medicale, redirecționează întotdeauna către doctor pentru decizii medicale.
Poți răspunde la întrebări despre: datele medicale ale pacientului, informații despre cabinet (adresă, telefon, email), programul și sloturile disponibile ale medicului curant.
${isFirstMessage
  ? "Acesta este primul mesaj al conversației — salută pacientul scurt (ex: 'Bună!') înainte de răspuns."
  : "Aceasta NU este prima interacțiune — NU saluta pacientul, nu folosi 'Bună', 'Bună ziua' sau formule de salut. Răspunde direct la întrebare."
}

=== INFORMAȚII CABINET ===
${clinic
  ? [
      clinic.name ? `Nume: ${clinic.name}` : null,
      clinic.address ? `Adresă: ${clinic.address}` : null,
      clinic.phone ? `Telefon: ${clinic.phone}` : null,
      clinic.email ? `Email: ${clinic.email}` : null,
    ].filter(Boolean).join("\n")
  : "Informațiile despre cabinet nu sunt disponibile."
}

=== MEDICUL CURANT ===
${
  doctorName
    ? `${doctorName}${doctorProfile?.specialization ? ` — ${doctorProfile.specialization}` : ""}`
    : assignedDoctorId
    ? "Informații despre medic indisponibile."
    : "Pacientul nu are medic curant atribuit."
}

=== PROGRAM SĂPTĂMÂNAL MEDIC ===
${
  doctorSchedules.length === 0
    ? "Programul medicului nu este configurat."
    : doctorSchedules
        .map((s) =>
          `- ${WEEKDAY_NAMES_RO[s.weekday]}: ${s.startTime} – ${s.endTime} (slot ${s.slotMinutes} min)`
        )
        .join("\n")
}

=== SLOTURI DISPONIBILE (URMĂTOARELE 7 ZILE) ===
${
  availableSlotsByDate.length === 0
    ? "Nu există sloturi disponibile în următoarele 7 zile."
    : availableSlotsByDate
        .map((d) => `- ${d.weekdayName}, ${d.date}: ${d.slots.join(", ")}`)
        .join("\n")
}

=== PROGRAMĂRI RECENTE ===
${
  appointments.length === 0
    ? "Nicio programare."
    : appointments
        .map(
          (a) =>
            `- ${formatDate(a.scheduledAt)} | Status: ${a.status} | Motiv: ${a.reason || "nespecificat"} | Doctor: ${a.doctor?.email}${a.consultation?.diagnosis ? ` | Diagnostic: ${a.consultation.diagnosis}` : ""}`
        )
        .join("\n")
}

=== REȚETE RECENTE ===
${
  prescriptions.length === 0
    ? "Nicio rețetă."
    : prescriptions
        .map(
          (p) =>
            `- ${formatDate(p.issuedAt || p.createdAt)} | Doctor: ${p.doctor?.email}\n  Medicamente: ${p.items.map((i) => `${i.medicationName} ${i.dosage || ""} ${i.frequency || ""}`).join(", ") || "nespecificate"}`
        )
        .join("\n")
}

=== VACCINURI ===
${
  vaccinations.length === 0
    ? "Niciun vaccin înregistrat."
    : vaccinations
        .map(
          (v) =>
            `- ${v.vaccineName}${v.doseLabel ? ` (${v.doseLabel})` : ""} | ${formatDate(v.administeredAt)} | Status: ${v.status}`
        )
        .join("\n")
}

=== TRIMITERI ===
${
  referrals.length === 0
    ? "Nicio trimitere."
    : referrals
        .map(
          (r) =>
            `- ${r.specialty} | Prioritate: ${r.priority} | Data: ${formatDate(r.issuedAt || r.createdAt)}`
        )
        .join("\n")
}
`;

  const fullPrompt = `${context}\n\nÎntrebarea pacientului: ${message}`;

  let reply;
  try {
    reply = await callGemini(fullPrompt);
  } catch (e) {
    throw createError("Serviciul AI este temporar indisponibil. Încearcă din nou.", 503);
  }

  return {
    message: reply,
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// 3. STATISTICI INTELIGENTE CABINET
// ─────────────────────────────────────────────

export async function getCabinetInsights(currentUser) {
  const role = currentUser.role;
  const userId = currentUser.id || currentUser.sub;

  if (!["DOCTOR", "ASSISTANT", "ADMIN"].includes(role)) {
    throw createError("Acces interzis", 403);
  }

  let effectiveDoctorId = null;
  if (role === "DOCTOR") {
    effectiveDoctorId = userId;
  } else if (role === "ASSISTANT") {
    const assistant = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedDoctorId: true },
    });
    effectiveDoctorId = assistant?.assignedDoctorId ?? null;
  }

  const apptWhere = effectiveDoctorId ? { doctorId: effectiveDoctorId } : {};
  const consultWhere = effectiveDoctorId ? { doctorId: effectiveDoctorId } : {};
  const prescWhere = effectiveDoctorId ? { doctorId: effectiveDoctorId } : {};
  const refWhere = effectiveDoctorId ? { doctorId: effectiveDoctorId } : {};

  const patientWhere = effectiveDoctorId
    ? {
        OR: [
          { appointments: { some: { doctorId: effectiveDoctorId } } },
          { assignedDoctorId: effectiveDoctorId },
          { createdByUserId: effectiveDoctorId },
        ],
      }
    : {};

  const patientIds = effectiveDoctorId
    ? (await prisma.patientProfile.findMany({ where: patientWhere, select: { id: true } }))
        .map((p) => p.id)
    : null;
  const vaccWhere = patientIds ? { patientId: { in: patientIds } } : {};

  const [
    totalPatients,
    totalAppointments,
    appointmentsByStatus,
    appointmentsByReason,
    totalConsultations,
    totalPrescriptions,
    totalReferrals,
    referralsByPriority,
    vaccinationsByStatus,
    recentAppointments,
  ] = await Promise.all([
    prisma.patientProfile.count({ where: patientWhere }),

    prisma.appointment.count({ where: apptWhere }),

    prisma.appointment.groupBy({
      by: ["status"],
      where: apptWhere,
      _count: { status: true },
    }),

    prisma.appointment.groupBy({
      by: ["reason"],
      where: apptWhere,
      _count: { reason: true },
    }),

    prisma.consultation.count({ where: consultWhere }),

    prisma.prescription.count({ where: prescWhere }),

    prisma.referral.count({ where: refWhere }),

    prisma.referral.groupBy({
      by: ["priority"],
      where: refWhere,
      _count: { priority: true },
    }),

    prisma.vaccinationRecord.groupBy({
      by: ["status"],
      where: vaccWhere,
      _count: { status: true },
    }),

    prisma.appointment.findMany({
      where: {
        ...apptWhere,
        scheduledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { status: true, reason: true, scheduledAt: true },
    }),
  ]);

  const noShow =
    appointmentsByStatus.find((s) => s.status === "NO_SHOW")?._count.status ??
    0;
  const canceled =
    appointmentsByStatus.find((s) => s.status === "CANCELED")?._count.status ??
    0;
  const completed =
    appointmentsByStatus.find((s) => s.status === "COMPLETED")?._count.status ??
    0;

  const noShowRate =
    totalAppointments > 0
      ? ((noShow / totalAppointments) * 100).toFixed(1)
      : 0;
  const cancelRate =
    totalAppointments > 0
      ? ((canceled / totalAppointments) * 100).toFixed(1)
      : 0;

  const recentNoShow = recentAppointments.filter(
    (a) => a.status === "NO_SHOW"
  ).length;
  const recentCanceled = recentAppointments.filter(
    (a) => a.status === "CANCELED"
  ).length;

  const scopeLabel = effectiveDoctorId
    ? "statisticile proprii ale medicului (pacienți, programări, consultații etc. legate direct de acest medic)"
    : "statisticile întregului cabinet medical (toți medicii, toți pacienții)";

  const prompt = `
Ești un analist de date medicale. Analizează ${scopeLabel} și oferă insights utile.
Răspunde în română. Fii concis, direct și orientat pe acțiuni concrete.

=== STATISTICI GENERALE ===
Total pacienți înregistrați: ${totalPatients}
Total programări: ${totalAppointments}
  - Finalizate: ${completed} (${totalAppointments > 0 ? ((completed / totalAppointments) * 100).toFixed(1) : 0}%)
  - Anulate: ${canceled} (${cancelRate}%)
  - Absenți: ${noShow} (${noShowRate}%)
  - Programate: ${appointmentsByStatus.find((s) => s.status === "SCHEDULED")?._count.status ?? 0}

Total consultații: ${totalConsultations}
Total rețete emise: ${totalPrescriptions}
Total trimiteri: ${totalReferrals}
  - Urgente: ${referralsByPriority.find((r) => r.priority === "URGENT")?._count.priority ?? 0}
  - Rutină: ${referralsByPriority.find((r) => r.priority === "ROUTINE")?._count.priority ?? 0}

=== MOTIVE PROGRAMĂRI ===
${appointmentsByReason.map((r) => `- ${r.reason || "Nespecificat"}: ${r._count.reason}`).join("\n")}

=== VACCINĂRI ===
${vaccinationsByStatus.map((v) => `- ${v.status}: ${v._count.status}`).join("\n")}

=== ULTIMELE 30 ZILE ===
Programări: ${recentAppointments.length}
Anulate recent: ${recentCanceled}
Absenți recent: ${recentNoShow}

=== INSTRUCȚIUNI ===
Oferă o analiză structurată cu:
1. Rezumat general al activității cabinetului
2. Aspecte pozitive (ce merge bine)
3. Aspecte îngrijorătoare sau care necesită atenție
4. 2-3 recomandări concrete și acționabile
Maxim 350 cuvinte. Fii direct, fără introduceri lungi.
`;

  let insights;
  try {
    insights = await callGemini(prompt);
  } catch (e) {
    throw createError("Serviciul AI este temporar indisponibil. Încearcă din nou.", 503);
  }

  return {
    generatedAt: new Date().toISOString(),
    rawStats: {
      totalPatients,
      totalAppointments,
      totalConsultations,
      totalPrescriptions,
      totalReferrals,
      appointmentsByStatus,
      appointmentsByReason,
      referralsByPriority,
      vaccinationsByStatus,
      last30Days: {
        appointments: recentAppointments.length,
        canceled: recentCanceled,
        noShow: recentNoShow,
      },
      rates: {
        noShowRate: `${noShowRate}%`,
        cancelRate: `${cancelRate}%`,
      },
    },
    insights,
  };
}