import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createDoctorScheduleSchema = z
  .object({
    weekday: z
      .number()
      .int()
      .min(0, "weekday trebuie să fie între 0 și 6")
      .max(6, "weekday trebuie să fie între 0 și 6"),

    startTime: z
      .string()
      .regex(timeRegex, "startTime trebuie să fie în format HH:MM"),

    endTime: z
      .string()
      .regex(timeRegex, "endTime trebuie să fie în format HH:MM"),

    slotMinutes: z
      .number()
      .int()
      .positive("slotMinutes trebuie să fie pozitiv")
      .refine((v) => [15, 20, 30, 60].includes(v), {
        message: "slotMinutes trebuie să fie unul dintre: 15, 20, 30, 60",
      }),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "startTime trebuie să fie mai mic decât endTime",
    path: ["endTime"],
  });

export const updateDoctorScheduleSchema = z
  .object({
    weekday: z
      .number()
      .int()
      .min(0, "weekday trebuie să fie între 0 și 6")
      .max(6, "weekday trebuie să fie între 0 și 6")
      .optional(),

    startTime: z
      .string()
      .regex(timeRegex, "startTime trebuie să fie în format HH:MM")
      .optional(),

    endTime: z
      .string()
      .regex(timeRegex, "endTime trebuie să fie în format HH:MM")
      .optional(),

    slotMinutes: z
      .number()
      .int()
      .positive("slotMinutes trebuie să fie pozitiv")
      .refine((v) => [15, 20, 30, 60].includes(v), {
        message: "slotMinutes trebuie să fie unul dintre: 15, 20, 30, 60",
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: "startTime trebuie să fie mai mic decât endTime",
      path: ["endTime"],
    }
  );

export const availableSlotsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date trebuie să fie în format YYYY-MM-DD"),
});