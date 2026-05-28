import { prisma } from "../db/prisma.js";

export async function getPatientGuardians({ patientId, requesterId }) {

  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { userId: true }
  });

  if (!patient) {
    const err = new Error("Patient not found");
    err.status = 404;
    throw err;
  }

  if (patient.userId !== requesterId) {
    const err = new Error("Only the owner can view guardians");
    err.status = 403;
    throw err;
  }

  const guardians = await prisma.patientAccess.findMany({
    where: { patientId },
    select: {
      userId: true,
      role: true,
      user: {
        select: {
          email: true,
          id: true
        }
      }
    }
  });

  return guardians.map(g => ({
    userId: g.userId,
    email: g.user.email,
    role: g.role
  }));
}

export async function revokeGuardianAccess({ patientId, guardianUserId, ownerId }) {

  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { userId: true }
  });

  if (!patient) {
    const err = new Error("Patient not found");
    err.status = 404;
    throw err;
  }

  const isSelfRevoke = guardianUserId === ownerId;
  if (!isSelfRevoke && patient.userId !== ownerId) {
    const err = new Error("Doar proprietarul profilului sau tutorele însuși poate revoca accesul.");
    err.status = 403;
    throw err;
  }

  await prisma.patientAccess.delete({
    where: {
      userId_patientId: {
        userId: guardianUserId,
        patientId
      }
    }
  });

  return { success: true };
}