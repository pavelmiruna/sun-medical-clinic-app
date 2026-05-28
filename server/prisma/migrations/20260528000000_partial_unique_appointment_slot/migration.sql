-- Drop the old full unique constraint that blocks re-booking canceled slots
DROP INDEX IF EXISTS "Appointment_doctorId_scheduledAt_key";

-- Create a partial unique index that only enforces uniqueness for non-canceled appointments
CREATE UNIQUE INDEX "Appointment_doctorId_scheduledAt_active_key"
  ON "Appointment" ("doctorId", "scheduledAt")
  WHERE status != 'CANCELED';
