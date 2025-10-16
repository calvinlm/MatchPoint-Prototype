import type { z } from "zod";

export declare const teamIdSchema: z.ZodUnion<[z.ZodEffects<z.ZodNumber, number, number | string>, z.ZodString]>;

export declare const teamCreateInputSchema: z.ZodObject<{
  ageGroup: z.ZodEnum<["Junior (17 below)", "18+", "35+", "50+"]>;
  category: z.ZodEnum<["Mens Singles", "Mens Doubles", "Womens Singles", "Womens Doubles", "Mixed Doubles"]>;
  level: z.ZodEnum<["Novice", "Intermediate", "Advanced", "Open"]>;
  playerIds: z.ZodArray<z.ZodEffects<z.ZodNumber, number, number | string>, "many">;
  tournamentId: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number | string>>;
}, "strip", z.ZodTypeAny, {
  ageGroup: "Junior (17 below)" | "18+" | "35+" | "50+";
  category: "Mens Singles" | "Mens Doubles" | "Womens Singles" | "Womens Doubles" | "Mixed Doubles";
  level: "Novice" | "Intermediate" | "Advanced" | "Open";
  playerIds: number[];
  tournamentId?: number | undefined;
}, {
  ageGroup: "Junior (17 below)" | "18+" | "35+" | "50+";
  category: "Mens Singles" | "Mens Doubles" | "Womens Singles" | "Womens Doubles" | "Mixed Doubles";
  level: "Novice" | "Intermediate" | "Advanced" | "Open";
  playerIds: (number | string)[];
  tournamentId?: number | string | undefined;
}>;

export declare const teamUpdateInputSchema: z.ZodEffects<z.ZodObject<{
  ageGroup: z.ZodOptional<z.ZodEnum<["Junior (17 below)", "18+", "35+", "50+"]>>;
  category: z.ZodOptional<z.ZodEnum<["Mens Singles", "Mens Doubles", "Womens Singles", "Womens Doubles", "Mixed Doubles"]>>;
  level: z.ZodOptional<z.ZodEnum<["Novice", "Intermediate", "Advanced", "Open"]>>;
  playerIds: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodNumber, number, number | string>, "many">>;
  tournamentId: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number | string>>;
}, "strip", z.ZodTypeAny, {
  ageGroup?: "Junior (17 below)" | "18+" | "35+" | "50+" | undefined;
  category?: "Mens Singles" | "Mens Doubles" | "Womens Singles" | "Womens Doubles" | "Mixed Doubles" | undefined;
  level?: "Novice" | "Intermediate" | "Advanced" | "Open" | undefined;
  playerIds?: number[] | undefined;
  tournamentId?: number | undefined;
}, {
  ageGroup?: "Junior (17 below)" | "18+" | "35+" | "50+" | undefined;
  category?: "Mens Singles" | "Mens Doubles" | "Womens Singles" | "Womens Doubles" | "Mixed Doubles" | undefined;
  level?: "Novice" | "Intermediate" | "Advanced" | "Open" | undefined;
  playerIds?: (number | string)[] | undefined;
  tournamentId?: number | string | undefined;
}>, {
  ageGroup?: "Junior (17 below)" | "18+" | "35+" | "50+" | undefined;
  category?: "Mens Singles" | "Mens Doubles" | "Womens Singles" | "Womens Doubles" | "Mixed Doubles" | undefined;
  level?: "Novice" | "Intermediate" | "Advanced" | "Open" | undefined;
  playerIds?: number[] | undefined;
  tournamentId?: number | undefined;
}, {
  ageGroup?: "Junior (17 below)" | "18+" | "35+" | "50+" | undefined;
  category?: "Mens Singles" | "Mens Doubles" | "Womens Singles" | "Womens Doubles" | "Mixed Doubles" | undefined;
  level?: "Novice" | "Intermediate" | "Advanced" | "Open" | undefined;
  playerIds?: (number | string)[] | undefined;
  tournamentId?: number | string | undefined;
}>;

export declare const teamResponseSchema: z.ZodObject<{
  id: z.ZodString;
  ageGroup: z.ZodString;
  category: z.ZodString;
  level: z.ZodString;
  entryCode: z.ZodOptional<z.ZodString>;
  tournamentId: z.ZodOptional<z.ZodNumber>;
  registrations: z.ZodOptional<z.ZodArray<z.ZodObject<{
    divisionId: z.ZodNullable<z.ZodNumber>;
    entryCode: z.ZodString;
  }, "strip", z.ZodTypeAny, {
    divisionId: number | null;
    entryCode: string;
  }, {
    divisionId: number | null;
    entryCode: string;
  }>, "many">);
  players: z.ZodArray<z.ZodString, "many">;
  timestamp: z.ZodNumber;
  _dbId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
  id: string;
  ageGroup: string;
  category: string;
  level: string;
  entryCode?: string | undefined;
  tournamentId?: number | undefined;
  registrations?: {
    divisionId: number | null;
    entryCode: string;
  }[] | undefined;
  players: string[];
  timestamp: number;
  _dbId?: number | undefined;
}, {
  id: string;
  ageGroup: string;
  category: string;
  level: string;
  entryCode?: string | undefined;
  tournamentId?: number | undefined;
  registrations?: {
    divisionId: number | null;
    entryCode: string;
  }[] | undefined;
  players: string[];
  timestamp: number;
  _dbId?: number | undefined;
}>;

export declare const teamListSchema: z.ZodArray<typeof teamResponseSchema>;

export declare const teamConstants: {
  readonly ageGroups: readonly ["Junior (17 below)", "18+", "35+", "50+"];
  readonly categories: readonly ["Mens Singles", "Mens Doubles", "Womens Singles", "Womens Doubles", "Mixed Doubles"];
  readonly levels: readonly ["Novice", "Intermediate", "Advanced", "Open"];
};

export type TeamResponse = z.infer<typeof teamResponseSchema>;
export type TeamCreateInput = z.infer<typeof teamCreateInputSchema>;
export type TeamUpdateInput = z.infer<typeof teamUpdateInputSchema>;
