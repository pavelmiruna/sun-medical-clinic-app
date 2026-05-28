-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "chiefComplaint" TEXT,
ADD COLUMN     "objectiveFindings" TEXT,
ADD COLUMN     "plan" TEXT;

-- CreateIndex
CREATE INDEX "Consultation_appointmentId_idx" ON "Consultation"("appointmentId");
