import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../db/prisma.js";
import bcrypt from "bcrypt";

export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      assignedDoctorId: true,
    },
  });

  res.json(user);
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Câmpurile sunt obligatorii" });
  if (newPassword.length < 6)
    return res.status(400).json({ message: "Parola nouă trebuie să aibă cel puțin 6 caractere" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Parola curentă este incorectă" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  res.json({ message: "Parola a fost schimbată cu succes" });
});

export const listDoctors = asyncHandler(async (req, res) => {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
  });
  res.json(doctors);
});