import { z } from "zod";

const audienceEnum = z.enum(["ALL", "DOCTORS", "ASSISTANTS", "PATIENTS", "STAFF", "MY_PATIENTS", "MY_ASSISTANTS"]);

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  audience: audienceEnum.optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  audience: audienceEnum.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});