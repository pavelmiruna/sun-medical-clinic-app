import { z } from "zod";

export const upsertMyProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(6).optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
});