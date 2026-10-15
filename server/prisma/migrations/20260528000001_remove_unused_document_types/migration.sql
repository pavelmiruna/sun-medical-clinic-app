-- Remove MEDICAL_LETTER and OTHER from MedicalDocumentType enum
-- These values were never used in any rows, so the cast is safe.

CREATE TYPE "MedicalDocumentType_new" AS ENUM ('PRESCRIPTION', 'REFERRAL');

ALTER TABLE "MedicalDocument"
  ALTER COLUMN "type" TYPE "MedicalDocumentType_new"
  USING "type"::text::"MedicalDocumentType_new";

DROP TYPE "MedicalDocumentType";

ALTER TYPE "MedicalDocumentType_new" RENAME TO "MedicalDocumentType";
