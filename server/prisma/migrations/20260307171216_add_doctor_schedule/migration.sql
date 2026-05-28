-- CreateTable
CREATE TABLE "DoctorSchedule" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorSchedule_doctorId_idx" ON "DoctorSchedule"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorSchedule_weekday_idx" ON "DoctorSchedule"("weekday");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorSchedule_doctorId_weekday_startTime_endTime_key" ON "DoctorSchedule"("doctorId", "weekday", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
