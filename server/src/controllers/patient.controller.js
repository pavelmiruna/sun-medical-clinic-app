import { claimPatientProfile } from "../services/claim.service.js";
import { claimGuardianAccess } from "../services/claim.service.js";
import { prisma } from "../db/prisma.js";
import { revokeGuardianAccess } from "../services/patientAccess.service.js";
import { getPatientGuardians } from "../services/patientAccess.service.js";


export const claimProfile = async (req, res, next) => {
  try {
    const { claimCode } = req.body;
    const userId = req.user.id;

    const profile = await claimPatientProfile({ userId, claimCode });

    res.status(200).json({
      message: "Profile claimed successfully",
      profile,
    });
  } catch (err) {
    next(err);
  }
};

export const claimGuardian = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { claimCode } = req.body;

    const result = await claimGuardianAccess({ userId, claimCode, accessRole: "GUARDIAN" });

    res.status(200).json({
      message: "Guardian access granted",
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const patientId = req.params.id;

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        cnp: true,
        sex: true,
        dateOfBirth: true,
        isMinor: true,
        userId: true,
        createdAt: true,
      },
    });

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.json(patient);
  } catch (e) {
    next(e);
  }
};

export const getMyPatientProfiles = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profiles = await prisma.patientProfile.findMany({
      where: {
        OR: [
          { userId },
          {
            accesses: {
              some: {
                userId
              }
            }
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        cnp: true,
        sex: true,
        dateOfBirth: true,
        isMinor: true,
        userId: true,
        assignedDoctorId: true,
        accesses: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      }
    });

    const result = profiles.map((p) => ({
      ...p,
      accessRole: p.userId === userId ? "OWNER" : (p.accesses?.[0]?.role ?? "GUARDIAN"),
      accesses: undefined,
    }));

    res.json(result);
  } catch (e) {
    next(e);
  }
};


export const revokeGuardian = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { id: patientId, guardianUserId } = req.params;

    const result = await revokeGuardianAccess({
      patientId,
      guardianUserId,
      ownerId
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
};


export const updateMyPatientProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.patientProfile.findFirst({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profilul nu a fost găsit." });

    const { phone, firstName, lastName, dateOfBirth, sex } = req.body;

    if (phone !== undefined && phone !== "") {
      const cleaned = phone.trim().replace(/\s/g, "");
      if (!/^07\d{8}$/.test(cleaned)) {
        return res.status(400).json({ message: "Numărul de telefon trebuie să aibă 10 cifre și să înceapă cu 07." });
      }
    }

    const updated = await prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        ...(phone !== undefined ? { phone: phone.trim().replace(/\s/g, "") || null } : {}),
        ...(firstName !== undefined && firstName !== "" ? { firstName } : {}),
        ...(lastName !== undefined && lastName !== "" ? { lastName } : {}),
        ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
        ...(sex !== undefined ? { sex: sex || null } : {}),
      },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        dateOfBirth: true, isMinor: true, sex: true, cnp: true,
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
};

export const listGuardians = async (req, res, next) => {
  try {

    const requesterId = req.user.id;
    const patientId = req.params.id;

    const guardians = await getPatientGuardians({
      patientId,
      requesterId
    });

    res.json(guardians);

  } catch (e) {
    next(e);
  }
};