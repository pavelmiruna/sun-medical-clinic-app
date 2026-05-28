import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════
// CLINIC
// ═══════════════════════════════════════════════════════════

export const getClinic = asyncHandler(async (req, res) => {
  const clinic = await prisma.clinic.findFirst();
  res.json(clinic ?? null);
});

export const createClinic = asyncHandler(async (req, res) => {
  const { name, address, phone, email, serialPrefix } = req.body;
  if (!name) return res.status(400).json({ message: "Numele clinicii este obligatoriu" });

  const clinic = await prisma.clinic.create({
    data: { name, address, phone, email, serialPrefix },
  });
  res.status(201).json(clinic);
});

export const updateClinic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, serialPrefix } = req.body;

  const clinic = await prisma.clinic.update({
    where: { id },
    data: { name, address, phone, email, serialPrefix },
  });
  res.json(clinic);
});

// ═══════════════════════════════════════════════════════════
// DOCTOR PROFILE
// ═══════════════════════════════════════════════════════════

export const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: { clinic: true },
  });

  res.json(profile ?? null);
});

export const upsertMyDoctorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, specialization, parafaCode, clinicId } = req.body;

  const profile = await prisma.doctorProfile.upsert({
    where: { userId },
    create: {
      userId,
      firstName,
      lastName,
      specialization,
      parafaCode,
      clinicId: clinicId || null,
    },
    update: {
      firstName,
      lastName,
      specialization,
      parafaCode,
      clinicId: clinicId || null,
    },
    include: { clinic: true },
  });

  res.json(profile);
});

export const uploadSignature = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: "Niciun fișier încărcat" });
  }

  const signatureUrl = `/uploads/signatures/${req.file.filename}`;

  const profile = await prisma.doctorProfile.upsert({
    where: { userId },
    create: { userId, signatureUrl },
    update: { signatureUrl },
  });

  res.json({ signatureUrl: profile.signatureUrl });
});

export const uploadParafa = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: "Niciun fișier încărcat" });
  }

  const parafaImageUrl = `/uploads/parafe/${req.file.filename}`;

  const profile = await prisma.doctorProfile.upsert({
    where: { userId },
    create: { userId, parafaImageUrl },
    update: { parafaImageUrl },
  });

  res.json({ parafaImageUrl: profile.parafaImageUrl });
});

export const getDoctorProfileByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const profile = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: { clinic: true },
  });

  if (!profile) return res.status(404).json({ message: "Profil doctor negăsit" });
  res.json(profile);
});