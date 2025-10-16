import type { z } from "zod";

export declare const playerIdSchema: z.ZodNumber;

export declare const playerCreateInputSchema: z.ZodObject<{
  name: z.ZodString;
  age: z.ZodEffects<z.ZodNumber, number, number | string>;
  gender: z.ZodEnum<["MALE", "FEMALE"]>;
  address: z.ZodString;
  contactNumber: z.ZodString;
  checkedIn: z.ZodOptional<z.ZodEffects<z.ZodBoolean, boolean, boolean | string>>;
}, "strip", z.ZodTypeAny, {
  name: string;
  age: number;
  gender: "MALE" | "FEMALE";
  address: string;
  contactNumber: string;
  checkedIn?: boolean | undefined;
}, {
  name: string;
  age: number | string;
  gender: "MALE" | "FEMALE";
  address: string;
  contactNumber: string;
  checkedIn?: boolean | string | undefined;
}>;

export declare const playerUpdateInputSchema: z.ZodEffects<z.ZodObject<{
  name: z.ZodOptional<z.ZodString>;
  age: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number | string>>;
  gender: z.ZodOptional<z.ZodEnum<["MALE", "FEMALE"]>>;
  address: z.ZodOptional<z.ZodString>;
  contactNumber: z.ZodOptional<z.ZodString>;
  checkedIn: z.ZodOptional<z.ZodEffects<z.ZodBoolean, boolean, boolean | string>>;
}, "strip", z.ZodTypeAny, {
  name?: string | undefined;
  age?: number | undefined;
  gender?: "MALE" | "FEMALE" | undefined;
  address?: string | undefined;
  contactNumber?: string | undefined;
  checkedIn?: boolean | undefined;
}, {
  name?: string | undefined;
  age?: number | string | undefined;
  gender?: "MALE" | "FEMALE" | undefined;
  address?: string | undefined;
  contactNumber?: string | undefined;
  checkedIn?: boolean | string | undefined;
}>, {
  name?: string | undefined;
  age?: number | undefined;
  gender?: "MALE" | "FEMALE" | undefined;
  address?: string | undefined;
  contactNumber?: string | undefined;
  checkedIn?: boolean | undefined;
}, {
  name?: string | undefined;
  age?: number | string | undefined;
  gender?: "MALE" | "FEMALE" | undefined;
  address?: string | undefined;
  contactNumber?: string | undefined;
  checkedIn?: boolean | string | undefined;
}>;

export declare const playerSchema: z.ZodObject<{
  id: z.ZodNumber;
  name: z.ZodString;
  age: z.ZodNumber;
  gender: z.ZodEnum<["MALE", "FEMALE"]>;
  address: z.ZodString;
  contactNumber: z.ZodString;
  checkedIn: z.ZodOptional<z.ZodBoolean>;
  createdAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
  updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, "strip", z.ZodTypeAny, {
  id: number;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE";
  address: string;
  contactNumber: string;
  checkedIn?: boolean | undefined;
  createdAt?: string | Date | undefined;
  updatedAt?: string | Date | undefined;
}, {
  id: number;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE";
  address: string;
  contactNumber: string;
  checkedIn?: boolean | undefined;
  createdAt?: string | Date | undefined;
  updatedAt?: string | Date | undefined;
}>;

export declare const playerListSchema: z.ZodArray<typeof playerSchema>;

export type Player = z.infer<typeof playerSchema>;
export type PlayerCreateInput = z.infer<typeof playerCreateInputSchema>;
export type PlayerUpdateInput = z.infer<typeof playerUpdateInputSchema>;
