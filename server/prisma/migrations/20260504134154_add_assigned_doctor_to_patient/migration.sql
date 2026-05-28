-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "assignedDoctorId" TEXT;

-- CreateIndex
CREATE INDEX "PatientProfile_assignedDoctorId_idx" ON "PatientProfile"("assignedDoctorId");

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
