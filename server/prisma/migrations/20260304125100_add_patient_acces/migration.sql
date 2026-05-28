-- CreateEnum
CREATE TYPE "PatientAccessRole" AS ENUM ('OWNER', 'GUARDIAN', 'PROXY');

-- CreateTable
CREATE TABLE "PatientAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "role" "PatientAccessRole" NOT NULL DEFAULT 'GUARDIAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientAccess_patientId_idx" ON "PatientAccess"("patientId");

-- CreateIndex
CREATE INDEX "PatientAccess_userId_idx" ON "PatientAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAccess_userId_patientId_key" ON "PatientAccess"("userId", "patientId");

-- AddForeignKey
ALTER TABLE "PatientAccess" ADD CONSTRAINT "PatientAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAccess" ADD CONSTRAINT "PatientAccess_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
