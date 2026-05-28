import { z } from "zod";

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  reason: z.enum([
    "ROUTINE_CHECK",
    "PRESCRIPTION_RENEWAL",
    "SICK_VISIT",
    "LAB_RESULTS",
    "VACCINATION",
    "ADMINISTRATIVE"
  ]).optional(),});

export const cancelAppointmentParamsSchema = z.object({
  id: z.string().min(1),
});