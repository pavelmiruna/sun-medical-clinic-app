-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'DOCTORS', 'ASSISTANTS', 'PATIENTS', 'STAFF');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");

-- CreateIndex
CREATE INDEX "Announcement_status_idx" ON "Announcement"("status");

-- CreateIndex
CREATE INDEX "Announcement_startsAt_idx" ON "Announcement"("startsAt");

-- CreateIndex
CREATE INDEX "Announcement_endsAt_idx" ON "Announcement"("endsAt");

-- CreateIndex
CREATE INDEX "Announcement_createdByUserId_idx" ON "Announcement"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
