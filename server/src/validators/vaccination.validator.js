import { z } from "zod";

export const createVaccinationRecordSchema = z.object({
  patientId: z.string().min(1),
  vaccineName: z.string().min(1, "Vaccine name is required"),
  doseLabel: z.string().optional().nullable(),
  status: z.enum(["COMPLETED", "SCHEDULED", "CANCELED"]).optional(),
  administeredAt: z.string().datetime().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  route: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateVaccinationRecordSchema = z.object({
  vaccineName: z.string().min(1).optional(),
  doseLabel: z.string().optional().nullable(),
  status: z.enum(["COMPLETED", "SCHEDULED", "CANCELED"]).optional(),
  administeredAt: z.string().datetime().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  route: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});