import { z } from "zod";

export const createPrescriptionSchema = z.object({
  consultationId: z.string().min(1, "consultationId este obligatoriu"),
  generalInstructions: z.string().trim().max(3000).optional(),
  issuedAt: z.string().datetime().optional(),
});

export const updatePrescriptionSchema = z.object({
  generalInstructions: z.string().trim().max(3000).optional(),
  issuedAt: z.string().datetime().optional(),
});

export const createPrescriptionItemSchema = z.object({
  medicationName: z.string().trim().min(1, "medicationName este obligatoriu").max(255),
  form: z.string().trim().max(255).optional(),
  concentration: z.string().trim().max(255).optional(),
  dosage: z.string().trim().max(255).optional(),
  frequency: z.string().trim().max(255).optional(),
  duration: z.string().trim().max(255).optional(),
  route: z.string().trim().max(255).optional(),
  instructions: z.string().trim().max(1000).optional(),
  quantity: z.string().trim().max(255).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updatePrescriptionItemSchema = z.object({
  medicationName: z.string().trim().min(1).max(255).optional(),
  form: z.string().trim().max(255).optional(),
  concentration: z.string().trim().max(255).optional(),
  dosage: z.string().trim().max(255).optional(),
  frequency: z.string().trim().max(255).optional(),
  duration: z.string().trim().max(255).optional(),
  route: z.string().trim().max(255).optional(),
  instructions: z.string().trim().max(1000).optional(),
  quantity: z.string().trim().max(255).optional(),
  orderIndex: z.number().int().min(0).optional(),
});