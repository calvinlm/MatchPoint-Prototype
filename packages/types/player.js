import { z } from "zod";
import { Gender } from "./enums.js";

const genderValues = Object.values(Gender);

const trimmedString = () => z.string().trim().min(1);

export const playerIdSchema = z.coerce.number().int().positive();

export const playerCreateInputSchema = z.object({
  name: trimmedString(),
  age: z.coerce.number().int().min(0),
  gender: z.enum(genderValues),
  address: trimmedString(),
  contactNumber: trimmedString(),
  checkedIn: z.coerce.boolean().optional(),
});

export const playerUpdateInputSchema = z
  .object({
    name: trimmedString().optional(),
    age: z.coerce.number().int().min(0).optional(),
    gender: z.enum(genderValues).optional(),
    address: trimmedString().optional(),
    contactNumber: trimmedString().optional(),
    checkedIn: z.coerce.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    { message: "At least one field must be provided." },
  );

export const playerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  age: z.number().int(),
  gender: z.enum(genderValues),
  address: z.string(),
  contactNumber: z.string(),
  checkedIn: z.boolean().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export const playerListSchema = z.array(playerSchema);
