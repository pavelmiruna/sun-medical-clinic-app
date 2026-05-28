import { z } from "zod";

export const updateMedicalDocumentDraftSchema = z.object({
  overrides: z.record(z.string(), z.any()),
});