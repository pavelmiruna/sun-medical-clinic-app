import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, registerPatient } from "../services/auth.service.js";

const emailValidator = z
  .string()
  .email({ message: "Adresa de email nu este validă (ex: nume@gmail.com)." })
  .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val), {
    message: "Adresa de email trebuie să conțină @ și o extensie validă (ex: .com, .ro).",
  });

const registerSchema = z
  .object({
    email: emailValidator,
    password: z.string().min(6),

    claimCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{4}-\d{4}$/, "Invalid claim code format")
      .optional(),

    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().min(6).optional(),
    dateOfBirth: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.claimCode) {
      if (!data.firstName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["firstName"],
          message: "First name is required when no claim code is provided",
        });
      }

      if (!data.lastName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lastName"],
          message: "Last name is required when no claim code is provided",
        });
      }
    }
  });

const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(6),
});

export const register = asyncHandler(async (req, res) => {
  const { email, password, claimCode, firstName, lastName,
          phone, dateOfBirth, sex, cnp, assignedDoctorId } = req.body;

  const emailCheck = emailValidator.safeParse(email);
  if (!emailCheck.success) {
    return res.status(400).json({ message: emailCheck.error.errors[0].message });
  }

  const result = await registerPatient({
    email, password, claimCode,
    firstName, lastName, phone,
    dateOfBirth, sex, cnp,
    assignedDoctorId: assignedDoctorId || null,
  });

  res.status(201).json(result);
});

export const signIn = asyncHandler(async (req, res) => {
  const dto = loginSchema.parse(req.body);
  const result = await login(dto);
  res.json(result);
});