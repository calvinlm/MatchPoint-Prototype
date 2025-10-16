import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Email must be valid.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password must be 128 characters or fewer.");

const roleSchema = z.string().trim().min(1).optional();

export const authRegisterPayloadSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
});

export const authLoginPayloadSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const authTokenResponseSchema = z.object({
  token: z.string().trim().min(1),
});
