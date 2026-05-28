-- CreateEnum
CREATE TYPE "ReferralPriority" AS ENUM ('ROUTINE', 'URGENT');

-- AlterTable
ALTER TABLE "MedicalDocument" ADD COLUMN     "referralId" TEXT;

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "reason" TEXT,
    "clinicalSummary" TEXT,
    "destinationUnit" TEXT,
    "notes" TEXT,
    "priority" "ReferralPriority" NOT NULL DEFAULT 'ROUTINE',
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referral_consultationId_idx" ON "Referral"("consultationId");

-- CreateIndex
CREATE INDEX "Referral_doctorId_idx" ON "Referral"("doctorId");

-- CreateIndex
CREATE INDEX "Referral_patientId_idx" ON "Referral"("patientId");

-- CreateIndex
CREATE INDEX "MedicalDocument_referralId_idx" ON "MedicalDocument"("referralId");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
