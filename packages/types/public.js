import { z } from "zod";
import { matchSchema } from "./match.js";
import { queueItemSchema } from "./queue.js";

const isoDateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid datetime string.",
  });

const isoDateStringOrNull = z.union([isoDateString, z.null()]);

const optionalString = z.string().trim().min(1).optional().nullable();

export const publicTournamentSlugSchema = z.string().trim().min(1);

export const publicTournamentSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  startDate: isoDateStringOrNull,
  endDate: isoDateStringOrNull,
  venue: optionalString,
  createdAt: isoDateStringOrNull,
  updatedAt: isoDateStringOrNull,
  publicSettings: z.object({
    isPublic: z.boolean(),
    slug: z.string().trim().min(1),
    seoMeta: z.unknown().nullable(),
    updatedAt: isoDateStringOrNull,
  }),
});

export const publicMatchSchema = matchSchema;
export const publicMatchListSchema = z.array(publicMatchSchema);

const divisionSummarySchema = z.object({
  id: z.number().int().positive().nullable(),
  name: z.string().optional().nullable(),
  ageGroup: z.string().optional().nullable(),
  discipline: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
});

export const publicBracketSchema = z.object({
  id: z.number().int().positive(),
  tournamentId: z.number().int().positive(),
  tournamentSlug: z.string().trim().min(1),
  division: divisionSummarySchema,
  type: z.string().trim().min(1),
  config: z.unknown().optional().nullable(),
  locked: z.boolean().optional(),
  createdAt: isoDateStringOrNull,
  updatedAt: isoDateStringOrNull,
});

export const publicBracketListSchema = z.array(publicBracketSchema);

const matchSummarySchema = z.object({
  matchesTotal: z.number().int().min(0),
  matchesCompleted: z.number().int().min(0),
  matchesInProgress: z.number().int().min(0),
  matchesReady: z.number().int().min(0),
});

export const publicStandingSchema = z.object({
  tournamentId: z.number().int().positive(),
  tournamentSlug: z.string().trim().min(1),
  division: divisionSummarySchema.nullable(),
  bracket: z.object({
    id: z.number().int().positive(),
    type: z.string().trim().min(1),
  }),
  matchSummary: matchSummarySchema,
  quotient: z.number().optional().nullable(),
  lastActivityAt: isoDateStringOrNull,
});

export const publicStandingListSchema = z.array(publicStandingSchema);

const rosterEntrySchema = z.object({
  slot: z.number().int().nullable(),
  playerId: z.number().int().nullable(),
});

const registrationEntrySchema = z.object({
  divisionId: z.number().int().nullable(),
  entryCode: z.string().trim().min(1),
});

export const publicTeamSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().trim().min(1),
  tournamentId: z.number().int().positive().nullable(),
  tournamentSlug: z.string().trim().min(1).nullable(),
  entryCode: z.string().trim().min(1).optional().nullable(),
  ageGroup: z.string().optional().nullable(),
  discipline: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  createdAt: isoDateStringOrNull,
  updatedAt: isoDateStringOrNull,
  roster: z.array(rosterEntrySchema),
  registrations: z.array(registrationEntrySchema).default([]),
});

export const publicTeamListSchema = z.array(publicTeamSchema);

export const publicQueueItemSchema = queueItemSchema;
export const publicQueueItemListSchema = z.array(publicQueueItemSchema);
