/*
  Warnings:

  - A unique constraint covering the columns `[claimCodeHash]` on the table `PatientProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "claimCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "claimCodeHash" TEXT,
ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_claimCodeHash_key" ON "PatientProfile"("claimCodeHash");
