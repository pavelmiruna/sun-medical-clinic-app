-- CreateEnum
CREATE TYPE "MedicalDocumentType" AS ENUM ('PRESCRIPTION', 'REFERRAL', 'MEDICAL_LETTER', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalDocumentStatus" AS ENUM ('DRAFT', 'FINALIZED', 'CANCELED');

-- CreateTable
CREATE TABLE "MedicalDocument" (
    "id" TEXT NOT NULL,
    "type" "MedicalDocumentType" NOT NULL,
    "status" "MedicalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "consultationId" TEXT,
    "prescriptionId" TEXT,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT,
    "templateKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "sourceSnapshot" JSONB,
    "generatedContent" JSONB,
    "overrides" JSONB,
    "finalContent" JSONB,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalDocument_type_idx" ON "MedicalDocument"("type");

-- CreateIndex
CREATE INDEX "MedicalDocument_status_idx" ON "MedicalDocument"("status");

-- CreateIndex
CREATE INDEX "MedicalDocument_doctorId_idx" ON "MedicalDocument"("doctorId");

-- CreateIndex
CREATE INDEX "MedicalDocument_patientId_idx" ON "MedicalDocument"("patientId");

-- CreateIndex
CREATE INDEX "MedicalDocument_consultationId_idx" ON "MedicalDocument"("consultationId");

-- CreateIndex
CREATE INDEX "MedicalDocument_prescriptionId_idx" ON "MedicalDocument"("prescriptionId");

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDocument" ADD CONSTRAINT "MedicalDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
