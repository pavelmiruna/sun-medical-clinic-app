-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX "PatientProfile_createdByUserId_idx" ON "PatientProfile"("createdByUserId");

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
