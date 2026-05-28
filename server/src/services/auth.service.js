import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { hashClaimCode } from "../utils/claimCode.js";

export async function registerPatient({
  email,
  password,
  claimCode,
  firstName,
  lastName,
  phone,
  dateOfBirth,
  sex,
  cnp,
  assignedDoctorId,
}) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Există deja un cont cu această adresă de email.");
    err.status = 409;
    throw err;
  }

  if (
    password.length < 6 ||
    !/[0-9]/.test(password) ||
    !/[^a-zA-Z0-9]/.test(password)
  ) {
    const err = new Error("Parola trebuie să aibă minim 6 caractere, o cifră și un semn special.");
    err.status = 400;
    throw err;
  }

  if (!claimCode) {
    if (cnp) {
      const trimmedCnp = cnp.trim();
      if (!/^\d{13}$/.test(trimmedCnp)) {
        const err = new Error("CNP-ul trebuie să conțină exact 13 cifre numerice.");
        err.status = 400;
        throw err;
      }
      const existingCnp = await prisma.patientProfile.findFirst({ where: { cnp: trimmedCnp } });
      if (existingCnp) {
        const err = new Error("Există deja un profil înregistrat cu acest CNP.");
        err.status = 409;
        throw err;
      }
    }

    if (phone) {
      const cleanPhone = phone.trim().replace(/\s/g, "");
      if (!/^07\d{8}$/.test(cleanPhone)) {
        const err = new Error("Numărul de telefon trebuie să aibă 10 cifre și să înceapă cu 07 (ex: 0712 345 678).");
        err.status = 400;
        throw err;
      }
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "PATIENT",
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    let profile = null;

    if (claimCode) {
      const claimCodeHash = hashClaimCode(claimCode);

      const existingProfile = await tx.patientProfile.findUnique({
        where: { claimCodeHash },
        select: {
          id: true,
          userId: true,
          claimCodeExpiresAt: true,
          claimedAt: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          isMinor: true,
          createdAt: true,
        },
      });

      if (!existingProfile) {
        const err = new Error("Codul de activare nu este valid.");
        err.status = 400;
        throw err;
      }

      if (existingProfile.userId || existingProfile.claimedAt) {
        const err = new Error("Acest profil este deja asociat unui cont.");
        err.status = 409;
        throw err;
      }

      if (!existingProfile.claimCodeExpiresAt || existingProfile.claimCodeExpiresAt < now) {
        const err = new Error("Codul de activare a expirat. Solicită un cod nou de la cabinet.");
        err.status = 410;
        throw err;
      }

      profile = await tx.patientProfile.update({
        where: { id: existingProfile.id },
        data: {
          userId: user.id,
          claimedAt: now,
          claimCodeHash: null,
          claimCodeExpiresAt: null,
        },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          isMinor: true,
          createdAt: true,
        },
      });
    } else {
      profile = await tx.patientProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone: phone ?? null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          cnp: cnp ?? null,
          sex: sex ?? null,
          isMinor: false,
          assignedDoctorId: assignedDoctorId ?? null,
        },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          isMinor: true,
          createdAt: true,
        },
      });
    }

    return { user, profile };
  });
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("Email sau parolă incorectă.");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Email sau parolă incorectă.");
    err.status = 401;
    throw err;
  }

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "2h" }
  );

  return { accessToken };
}