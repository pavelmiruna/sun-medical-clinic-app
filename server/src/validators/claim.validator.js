import { z } from "zod";

export const claimProfileSchema = z.object({
  claimCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}-\d{4}$/, "Invalid format (ABCD-1234)"),
});