import { z } from "zod";

export const createConsultationSchema = z.object({
  appointmentId: z.string().min(1, "appointmentId este obligatoriu"),
  chiefComplaint: z.string().trim().max(2000).optional(),
  diagnosis: z.string().trim().max(2000).optional(),
  treatment: z.string().trim().max(2000).optional(),
  objectiveFindings: z.string().trim().max(3000).optional(),
  notes: z.string().trim().max(5000).optional(),
  recommendations: z.string().trim().max(3000).optional(),
  plan: z.string().trim().max(3000).optional(),
});

export const updateConsultationSchema = z.object({
  chiefComplaint: z.string().trim().max(2000).optional(),
  diagnosis: z.string().trim().max(2000).optional(),
  treatment: z.string().trim().max(2000).optional(),
  objectiveFindings: z.string().trim().max(3000).optional(),
  notes: z.string().trim().max(5000).optional(),
  recommendations: z.string().trim().max(3000).optional(),
  plan: z.string().trim().max(3000).optional(),
});