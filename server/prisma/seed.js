import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  // ADMIN
  await prisma.user.upsert({
    where: { email: "admin@cabinet.ro" },
    update: {},
    create: {
      email: "admin@cabinet.ro",
      passwordHash,
      role: "ADMIN",
    },
  });

  // DOCTOR
  await prisma.user.upsert({
    where: { email: "doctor@cabinet.ro" },
    update: {},
    create: {
      email: "doctor@cabinet.ro",
      passwordHash: await bcrypt.hash("Doctor123!", 10),
      role: "DOCTOR",
    },
  });

  // ASSISTANT
  await prisma.user.upsert({
    where: { email: "assistant@cabinet.ro" },
    update: {},
    create: {
      email: "assistant@cabinet.ro",
      passwordHash: await bcrypt.hash("Assistant123!", 10),
      role: "ASSISTANT",
    },
  });

  console.log("Seed complete ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });