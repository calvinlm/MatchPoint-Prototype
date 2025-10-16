import { z } from "zod";

const ageGroupLabels = ["Junior (17 below)", "18+", "35+", "50+"];
const categoryLabels = [
  "Mens Singles",
  "Mens Doubles",
  "Womens Singles",
  "Womens Doubles",
  "Mixed Doubles",
];
const levelLabels = ["Novice", "Intermediate", "Advanced", "Open"];

export const teamIdSchema = z.union([z.coerce.number().int().positive(), z.string().trim().min(1)]);

export const teamCreateInputSchema = z.object({
  ageGroup: z.enum(ageGroupLabels),
  category: z.enum(categoryLabels),
  level: z.enum(levelLabels),
  playerIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "At least one player is required.")
    .max(2, "Teams may not exceed two players."),
  tournamentId: z.coerce.number().int().positive().optional(),
});

export const teamUpdateInputSchema = z
  .object({
    ageGroup: z.enum(ageGroupLabels).optional(),
    category: z.enum(categoryLabels).optional(),
    level: z.enum(levelLabels).optional(),
    playerIds: z
      .array(z.coerce.number().int().positive())
      .min(1)
      .max(2)
      .optional(),
    tournamentId: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    { message: "At least one field must be provided." },
  );

export const teamResponseSchema = z.object({
  id: z.string(),
  ageGroup: z.string(),
  category: z.string(),
  level: z.string(),
  entryCode: z.string().optional(),
  tournamentId: z.number().int().optional(),
  registrations: z
    .array(
      z.object({
        divisionId: z.number().int().nullable(),
        entryCode: z.string(),
      }),
    )
    .optional(),
  players: z.array(z.string()),
  timestamp: z.number().int(),
  _dbId: z.number().int().optional(),
});

export const teamListSchema = z.array(teamResponseSchema);

export const teamConstants = {
  ageGroups: ageGroupLabels,
  categories: categoryLabels,
  levels: levelLabels,
};
