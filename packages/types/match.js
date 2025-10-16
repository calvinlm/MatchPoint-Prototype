import { z } from "zod";
import { MatchStatus } from "./enums.js";
import { queueItemSchema } from "./queue.js";

const matchStatusValues = Object.values(MatchStatus);

const isoDateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid datetime string.",
  });

const optionalDateInput = z
  .union([isoDateString, z.date()])
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (value instanceof Date) return value;
    return new Date(value);
  });

const optionalCourtIdSchema = z
  .union([z.coerce.number().int().positive(), z.string().trim().min(1)])
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined || value === null) return value;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  });

export const matchStatusSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.toUpperCase() : value),
  z.enum(matchStatusValues)
);

export const matchIdSchema = z.coerce.number().int().positive();

export const matchCreateInputSchema = z.object({
  bracketId: z.coerce.number().int().positive(),
  round: z.coerce.number().int().min(0),
  matchNumber: z.coerce.number().int().min(0),
  status: matchStatusSchema.optional(),
  scheduledAt: optionalDateInput,
  courtId: optionalCourtIdSchema,
});

export const matchScorePayloadSchema = z.object({
  score: z.unknown().optional().nullable(),
  status: matchStatusSchema.optional(),
});

export const matchCompletePayloadSchema = z.object({
  score: z.unknown().optional(),
});

const isoDateOutput = z.union([isoDateString, z.date(), z.null()]);

export const matchSchema = z.object({
  id: z.number().int().positive(),
  bracketId: z.number().int().positive(),
  round: z.number().int().nullable(),
  matchNumber: z.number().int().nullable(),
  status: z.enum(matchStatusValues),
  scheduledAt: isoDateOutput,
  courtId: z.number().int().positive().optional().nullable(),
  score: z.unknown().optional().nullable(),
  meta: z.unknown().optional().nullable(),
  updatedAt: isoDateOutput.optional(),
  tournamentId: z.number().int().positive().optional().nullable(),
  tournamentSlug: z.string().trim().min(1).optional().nullable(),
  divisionId: z.number().int().positive().optional().nullable(),
});

export const matchWithQueueSchema = z.object({
  match: matchSchema,
  queueItem: queueItemSchema,
});
