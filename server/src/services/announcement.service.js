import { prisma } from "../db/prisma.js";
import { sendAnnouncementEmail } from "./email.service.js";

const AUDIENCE_ROLES = {
  ALL:        ["DOCTOR", "ASSISTANT", "PATIENT", "ADMIN"],
  PATIENTS:   ["PATIENT"],
  DOCTORS:    ["DOCTOR"],
  ASSISTANTS: ["ASSISTANT"],
  STAFF:      ["DOCTOR", "ASSISTANT"],
};

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertAnnouncementManager(user) {
  if (!user || !["DOCTOR","ASSISTANT", "ADMIN"].includes(user.role)) {
    throw createError("Forbidden", 403);
  }
}

function getBaseAudienceForRole(role) {
  if (role === "DOCTOR")    return ["ALL", "DOCTORS", "STAFF"];
  if (role === "ASSISTANT") return ["ALL", "ASSISTANTS", "STAFF"];
  if (role === "PATIENT")   return ["ALL", "PATIENTS"];
  if (role === "ADMIN")     return ["ALL", "DOCTORS", "ASSISTANTS", "PATIENTS", "STAFF", "MY_PATIENTS", "MY_ASSISTANTS"];
  return ["ALL"];
}

export async function createAnnouncement(data, currentUser) {
  assertAnnouncementManager(currentUser);

  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      audience: data.audience ?? "ALL",
      status: "ACTIVE",
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      createdByUserId: currentUser.id,
    },
    include: {
      createdByUser: {
        select: { id: true, email: true, role: true },
      },
    },
  });

  sendAnnouncementEmails(announcement).catch(() => {});

  return announcement;
}

async function sendAnnouncementEmails(announcement) {
  let users = [];

  if (announcement.audience === "MY_PATIENTS") {
    const patients = await prisma.patientProfile.findMany({
      where: {
        OR: [
          { assignedDoctorId: announcement.createdByUserId },
          { appointments: { some: { doctorId: announcement.createdByUserId } } },
        ],
        userId: { not: null },
      },
      select: { user: { select: { email: true } } },
    });
    users = patients.map((p) => ({ email: p.user?.email })).filter((u) => u.email);
  } else if (announcement.audience === "MY_ASSISTANTS") {
    users = await prisma.user.findMany({
      where: { role: "ASSISTANT", assignedDoctorId: announcement.createdByUserId },
      select: { email: true },
    });
  } else {
    const roles = AUDIENCE_ROLES[announcement.audience] ?? [];
    if (roles.length === 0) return;
    users = await prisma.user.findMany({
      where: { role: { in: roles } },
      select: { email: true },
    });
  }

  const emails = users.map((u) => u.email).filter(Boolean);
  if (emails.length === 0) return;

  let sent = 0;
  for (const email of emails) {
    try {
      await sendAnnouncementEmail({
        to: email,
        title: announcement.title,
        content: announcement.content,
      });
      sent++;
    } catch (e) {
      console.error(`[Announcements] Failed for ${email}:`, e.message);
    }
  }

  console.log(`[Announcements] Sent ${sent}/${emails.length} for audience=${announcement.audience}`);
}

export async function getDashboardAnnouncements(currentUser) {
  const now = new Date();
  const userId = currentUser.id || currentUser.sub;
  const role = currentUser.role;
  const baseAudiences = getBaseAudienceForRole(role);

  const timeFilter = {
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };

  const audienceConditions = [{ audience: { in: baseAudiences } }];

  if (role === "PATIENT") {
    const profile = await prisma.patientProfile.findFirst({
      where: { userId },
      select: { assignedDoctorId: true },
    });
    if (profile?.assignedDoctorId) {
      audienceConditions.push({
        audience: "MY_PATIENTS",
        createdByUserId: profile.assignedDoctorId,
      });
    }
  } else if (role === "ASSISTANT") {
    const assistant = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedDoctorId: true },
    });
    if (assistant?.assignedDoctorId) {
      audienceConditions.push({
        audience: "MY_ASSISTANTS",
        createdByUserId: assistant.assignedDoctorId,
      });
    }
  }

  return prisma.announcement.findMany({
    where: {
      status: "ACTIVE",
      OR: audienceConditions,
      ...timeFilter,
    },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    include: {
      createdByUser: { select: { id: true, email: true, role: true } },
    },
  });
}

async function getTeamUserIds(currentUser) {
  const userId = currentUser.id || currentUser.sub;
  const role = currentUser.role;

  if (role === "DOCTOR") {
    const assistants = await prisma.user.findMany({
      where: { role: "ASSISTANT", assignedDoctorId: userId },
      select: { id: true },
    });
    return [userId, ...assistants.map((a) => a.id)];
  }

  if (role === "ASSISTANT") {
    const assistant = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedDoctorId: true },
    });
    return assistant?.assignedDoctorId
      ? [userId, assistant.assignedDoctorId]
      : [userId];
  }

  return [userId];
}

export async function getAllAnnouncements(currentUser) {
  assertAnnouncementManager(currentUser);

  const isAdmin = currentUser.role === "ADMIN";

  let where = {};
  if (!isAdmin) {
    const teamIds = await getTeamUserIds(currentUser);
    where = { createdByUserId: { in: teamIds } };
  }

  return prisma.announcement.findMany({
    where,
    orderBy: {
      createdAt: "desc",
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
  });
}

export async function updateAnnouncement(announcementId, data, currentUser) {
  assertAnnouncementManager(currentUser);

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });

  if (!existing) {
    throw createError("Anunțul nu a fost găsit.", 404);
  }

  if (currentUser.role !== "ADMIN") {
    const teamIds = await getTeamUserIds(currentUser);
    if (!teamIds.includes(existing.createdByUserId)) {
      throw createError("Nu poți modifica un anunț care nu aparține echipei tale.", 403);
    }
  }

  return prisma.announcement.update({
    where: { id: announcementId },
    data: {
      title: data.title,
      content: data.content,
      audience: data.audience,
      status: data.status,
      startsAt:
        data.startsAt === null
          ? null
          : data.startsAt
          ? new Date(data.startsAt)
          : undefined,
      endsAt:
        data.endsAt === null
          ? null
          : data.endsAt
          ? new Date(data.endsAt)
          : undefined,
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
  });
}

export async function deactivateAnnouncement(announcementId, currentUser) {
  assertAnnouncementManager(currentUser);

  const existing = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });

  if (!existing) {
    throw createError("Anunțul nu a fost găsit.", 404);
  }

  if (currentUser.role !== "ADMIN") {
    const teamIds = await getTeamUserIds(currentUser);
    if (!teamIds.includes(existing.createdByUserId)) {
      throw createError("Nu poți dezactiva un anunț care nu aparține echipei tale.", 403);
    }
  }

  return prisma.announcement.update({
    where: { id: announcementId },
    data: { status: "INACTIVE" },
  });
}