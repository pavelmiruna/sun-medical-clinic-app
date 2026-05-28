-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "serialNumber" INTEGER;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "serialNumber" INTEGER;

-- CreateTable
CREATE TABLE "DocumentCounter" (
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("type")
);
