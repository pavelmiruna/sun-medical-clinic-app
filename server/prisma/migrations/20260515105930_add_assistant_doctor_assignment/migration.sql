-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedDoctorId" TEXT;

-- CreateIndex
CREATE INDEX "User_assignedDoctorId_idx" ON "User"("assignedDoctorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
