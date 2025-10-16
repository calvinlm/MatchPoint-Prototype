import type { z } from "zod";
import type { matchSchema } from "./match.js";
import type { queueItemSchema } from "./queue.js";

export declare const publicTournamentSlugSchema: z.ZodString;

export type PublicTournament = {
  id: number;
  slug: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  venue?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publicSettings: {
    isPublic: boolean;
    slug: string;
    seoMeta: unknown | null;
    updatedAt: string | null;
  };
};

export declare const publicTournamentSchema: z.ZodType<PublicTournament>;

export type PublicMatch = z.infer<typeof matchSchema>;
export declare const publicMatchSchema: typeof matchSchema;
export declare const publicMatchListSchema: z.ZodArray<typeof publicMatchSchema>;

export type PublicDivisionSummary = {
  id: number | null;
  name?: string | null;
  ageGroup?: string | null;
  discipline?: string | null;
  level?: string | null;
};

export type PublicBracket = {
  id: number;
  tournamentId: number;
  tournamentSlug: string;
  division: PublicDivisionSummary;
  type: string;
  config?: unknown | null;
  locked?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export declare const publicBracketSchema: z.ZodType<PublicBracket>;
export declare const publicBracketListSchema: z.ZodArray<typeof publicBracketSchema>;

export type PublicStanding = {
  tournamentId: number;
  tournamentSlug: string;
  division: PublicDivisionSummary | null;
  bracket: {
    id: number;
    type: string;
  };
  matchSummary: {
    matchesTotal: number;
    matchesCompleted: number;
    matchesInProgress: number;
    matchesReady: number;
  };
  quotient?: number | null;
  lastActivityAt: string | null;
};

export declare const publicStandingSchema: z.ZodType<PublicStanding>;
export declare const publicStandingListSchema: z.ZodArray<typeof publicStandingSchema>;

export type PublicTeam = {
  id: number;
  code: string;
  tournamentId: number | null;
  tournamentSlug: string | null;
  entryCode?: string | null;
  ageGroup?: string | null;
  discipline?: string | null;
  level?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  roster: Array<{ slot: number | null; playerId: number | null }>;
  registrations: Array<{ divisionId: number | null; entryCode: string }>;
};

export declare const publicTeamSchema: z.ZodType<PublicTeam>;
export declare const publicTeamListSchema: z.ZodArray<typeof publicTeamSchema>;

export type PublicQueueItem = z.infer<typeof queueItemSchema>;
export declare const publicQueueItemSchema: typeof queueItemSchema;
export declare const publicQueueItemListSchema: z.ZodArray<typeof publicQueueItemSchema>;
