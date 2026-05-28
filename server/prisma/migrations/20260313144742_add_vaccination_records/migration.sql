-- CreateEnum
CREATE TYPE "VaccinationStatus" AS ENUM ('COMPLETED', 'SCHEDULED', 'CANCELED');

-- CreateTable
CREATE TABLE "VaccinationRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "doseLabel" TEXT,
    "status" "VaccinationStatus" NOT NULL DEFAULT 'COMPLETED',
    "administeredAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "manufacturer" TEXT,
    "batchNumber" TEXT,
    "site" TEXT,
    "route" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaccinationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VaccinationRecord_patientId_idx" ON "VaccinationRecord"("patientId");

-- CreateIndex
CREATE INDEX "VaccinationRecord_createdByUserId_idx" ON "VaccinationRecord"("createdByUserId");

-- CreateIndex
CREATE INDEX "VaccinationRecord_status_idx" ON "VaccinationRecord"("status");

-- CreateIndex
CREATE INDEX "VaccinationRecord_administeredAt_idx" ON "VaccinationRecord"("administeredAt");

-- CreateIndex
CREATE INDEX "VaccinationRecord_scheduledAt_idx" ON "VaccinationRecord"("scheduledAt");

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
