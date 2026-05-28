import { prisma } from "../db/prisma.js";
import { hashClaimCode, generateClaimCode, getClaimExpiryDate } from "../utils/claimCode.js";

export async function claimPatientProfile({ userId, claimCode }) {
  const claimCodeHash = hashClaimCode(claimCode);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.patientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existing) {
      const err = new Error("Ai deja un profil de pacient activat pe acest cont.");
      err.status = 409;
      throw err;
    }

    const profile = await tx.patientProfile.findUnique({
      where: { claimCodeHash },
      select: {
        id: true,
        userId: true,
        claimCodeExpiresAt: true,
        claimedAt: true,
      },
    });

    if (!profile) {
      const err = new Error("Codul de activare nu este valid.");
      err.status = 400;
      throw err;
    }

    if (profile.userId || profile.claimedAt) {
      const err = new Error("Acest profil este deja asociat unui cont.");
      err.status = 409;
      throw err;
    }

    if (!profile.claimCodeExpiresAt || profile.claimCodeExpiresAt < now) {
      const err = new Error("Codul de activare a expirat. Solicită un cod nou de la cabinet.");
      err.status = 410;
      throw err;
    }

    const updated = await tx.patientProfile.update({
      where: { id: profile.id },
      data: {
        userId,
        claimedAt: now,
        claimCodeHash: null,
        claimCodeExpiresAt: null,
      },
      select: { id: true, firstName: true, lastName: true, userId: true },
    });

    return updated;
  });
}

export async function claimGuardianAccess({ userId, claimCode, accessRole = "GUARDIAN" }) {
  if (!userId) {
    const err = new Error("Missing userId");
    err.status = 401;
    throw err;
  }

  const claimCodeHash = hashClaimCode(claimCode);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const profile = await tx.patientProfile.findUnique({
      where: { claimCodeHash },
      select: {
        id: true,
        userId: true,
        claimCodeExpiresAt: true,
        claimedAt: true,
      },
    });

    if (!profile) {
      const err = new Error("Codul de activare nu este valid.");
      err.status = 400;
      throw err;
    }

    if (!profile.claimCodeExpiresAt || profile.claimCodeExpiresAt < now) {
      const err = new Error("Codul de activare a expirat. Solicită un cod nou de la cabinet.");
      err.status = 410;
      throw err;
    }

    try {
      await tx.patientAccess.create({
        data: {
          userId,
          patientId: profile.id,
          role: accessRole,
        },
      });
    } catch (e) {
      const err = new Error("Ai deja acces la profilul acestui pacient.");
      err.status = 409;
      throw err;
    }

    await tx.patientProfile.update({
      where: { id: profile.id },
      data: {
        claimCodeHash: null,
        claimCodeExpiresAt: null,
        claimedAt: now,
      },
    });

    return { patientId: profile.id, accessRole };
  });
}

export async function regenerateClaimCodeForProfile({ patientId }) {
  const claimCode = generateClaimCode();
  const claimCodeHash = hashClaimCode(claimCode);
  const claimCodeExpiresAt = getClaimExpiryDate();

  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { id: true, userId: true, firstName: true, lastName: true },
  });

  if (!patient) {
    const err = new Error("Pacientul nu a fost găsit.");
    err.status = 404;
    throw err;
  }

  if (patient.userId) {
    const err = new Error("Acest pacient are deja un cont activ și nu mai necesită cod de activare.");
    err.status = 409;
    throw err;
  }

  await prisma.patientProfile.update({
    where: { id: patientId },
    data: {
      claimCodeHash,
      claimCodeExpiresAt,
      claimedAt: null,
    },
  });

  return {
    patientId: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    claimCode,
    claimCodeExpiresAt,
  };
}