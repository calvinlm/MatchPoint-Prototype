import type { z } from "zod";

export declare const authRegisterPayloadSchema: z.ZodObject<{
  email: z.ZodEffects<z.ZodString, string, string>;
  password: z.ZodString;
  role: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
  email: string;
  password: string;
  role?: string | undefined;
}, {
  email: string;
  password: string;
  role?: string | undefined;
}>;

export declare const authLoginPayloadSchema: z.ZodObject<{
  email: z.ZodEffects<z.ZodString, string, string>;
  password: z.ZodString;
}, "strip", z.ZodTypeAny, {
  email: string;
  password: string;
}, {
  email: string;
  password: string;
}>;

export declare const authTokenResponseSchema: z.ZodObject<{
  token: z.ZodString;
}, "strip", z.ZodTypeAny, {
  token: string;
}, {
  token: string;
}>;

export type AuthRegisterPayload = z.infer<typeof authRegisterPayloadSchema>;
export type AuthLoginPayload = z.infer<typeof authLoginPayloadSchema>;
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;
