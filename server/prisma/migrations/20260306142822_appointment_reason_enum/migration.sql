/*
  Warnings:

  - The `reason` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AppointmentReason" AS ENUM ('ROUTINE_CHECK', 'PRESCRIPTION_RENEWAL', 'SICK_VISIT', 'LAB_RESULTS', 'VACCINATION', 'ADMINISTRATIVE');

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "reason",
ADD COLUMN     "reason" "AppointmentReason";
