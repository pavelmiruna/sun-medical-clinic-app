import { z } from "zod";

export const createReferralSchema = z.object({
  consultationId: z.string().min(1),
  specialty: z.string().min(1, "Specialty is required"),
  reason: z.string().optional().nullable(),
  clinicalSummary: z.string().optional().nullable(),
  destinationUnit: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  priority: z.enum(["ROUTINE", "URGENT"]).optional(),
  issuedAt: z.string().datetime().optional().nullable(),
});

export const updateReferralSchema = z.object({
  specialty: z.string().min(1).optional(),
  reason: z.string().optional().nullable(),
  clinicalSummary: z.string().optional().nullable(),
  destinationUnit: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  priority: z.enum(["ROUTINE", "URGENT"]).optional(),
  issuedAt: z.string().datetime().optional().nullable(),
});