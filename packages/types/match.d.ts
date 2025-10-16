import type { z } from "zod";
import type { queueItemSchema } from "./queue.js";

export declare const matchStatusSchema: z.ZodEffects<z.ZodEnum<["PENDING", "READY", "IN_PROGRESS", "COMPLETED", "CANCELLED"]>, "PENDING" | "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED", unknown>;

export declare const matchIdSchema: z.ZodEffects<z.ZodNumber, number, number | string>;

export declare const matchCreateInputSchema: z.ZodObject<{
  bracketId: z.ZodEffects<z.ZodNumber, number, number | string>;
  round: z.ZodEffects<z.ZodNumber, number, number | string>;
  matchNumber: z.ZodEffects<z.ZodNumber, number, number | string>;
  status: z.ZodOptional<typeof matchStatusSchema>;
  scheduledAt: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date | null, string | Date | null>>>;
  courtId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
  bracketId: number;
  round: number;
  matchNumber: number;
  status?: "PENDING" | "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined;
  scheduledAt?: Date | null | undefined;
  courtId?: number | null | undefined;
}, {
  bracketId: number | string;
  round: number | string;
  matchNumber: number | string;
  status?: unknown;
  scheduledAt?: string | Date | null | undefined;
  courtId?: number | null | undefined;
}>;

export declare const matchScorePayloadSchema: z.ZodObject<{
  score: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
  status: z.ZodOptional<typeof matchStatusSchema>;
}, "strip", z.ZodTypeAny, {
  score?: unknown | null | undefined;
  status?: "PENDING" | "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined;
}, {
  score?: unknown | null | undefined;
  status?: unknown;
}>;

export declare const matchCompletePayloadSchema: z.ZodObject<{
  score: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
  score?: unknown;
}, {
  score?: unknown;
}>;

export declare const matchSchema: z.ZodObject<{
  id: z.ZodNumber;
  bracketId: z.ZodNumber;
  round: z.ZodNullable<z.ZodNumber>;
  matchNumber: z.ZodNullable<z.ZodNumber>;
  status: z.ZodEnum<["PENDING", "READY", "IN_PROGRESS", "COMPLETED", "CANCELLED"]>;
  scheduledAt: z.ZodUnion<[z.ZodString, z.ZodDate, z.ZodNull]>;
  courtId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
  score: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
  meta: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
  updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate, z.ZodNull]>>;
  tournamentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
  tournamentSlug: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  divisionId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
  id: number;
  bracketId: number;
  round: number | null;
  matchNumber: number | null;
  status: "PENDING" | "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt: string | Date | null;
  courtId?: number | null | undefined;
  score?: unknown | null | undefined;
  meta?: unknown | null | undefined;
  updatedAt?: string | Date | null | undefined;
  tournamentId?: number | null | undefined;
  tournamentSlug?: string | null | undefined;
  divisionId?: number | null | undefined;
}, {
  id: number;
  bracketId: number;
  round: number | null;
  matchNumber: number | null;
  status: "PENDING" | "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt: string | Date | null;
  courtId?: number | null | undefined;
  score?: unknown | null | undefined;
  meta?: unknown | null | undefined;
  updatedAt?: string | Date | null | undefined;
  tournamentId?: number | null | undefined;
  tournamentSlug?: string | null | undefined;
  divisionId?: number | null | undefined;
}>;

export declare const matchWithQueueSchema: z.ZodObject<{
  match: typeof matchSchema;
  queueItem: typeof queueItemSchema;
}, "strip", z.ZodTypeAny, {
  match: z.infer<typeof matchSchema>;
  queueItem: z.infer<typeof queueItemSchema>;
}, {
  match: z.infer<typeof matchSchema>;
  queueItem: z.infer<typeof queueItemSchema>;
}>;

export type MatchId = z.infer<typeof matchIdSchema>;
export type MatchCreateInput = z.infer<typeof matchCreateInputSchema>;
export type MatchScorePayload = z.infer<typeof matchScorePayloadSchema>;
export type MatchCompletePayload = z.infer<typeof matchCompletePayloadSchema>;
export type Match = z.infer<typeof matchSchema>;
export type MatchWithQueue = z.infer<typeof matchWithQueueSchema>;
