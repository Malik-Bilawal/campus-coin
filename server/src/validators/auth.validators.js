import { z } from "zod";

export const requestOtpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  academicYear: z.string().max(40).optional().default(""),
  allowanceBaseline: z.coerce.number().min(0).optional().default(0),
  savingsGoal: z.coerce.number().min(0).optional().default(0),
  currency: z.string().max(3).optional().default("BDT"),
});

export const registerSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotSchema = z.object({
  email: z.string().email(),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6).max(72),
});
