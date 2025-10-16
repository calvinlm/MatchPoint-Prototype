import type { z } from "zod";

export declare const queueItemIdSchema: z.ZodEffects<z.ZodNumber, number, number | string>;

export declare const queueActionPayloadSchema: z.ZodObject<{
  action: z.ZodEnum<["MARK_READY", "PULL", "SEND_TO_COURT"]>;
  version: z.ZodEffects<z.ZodNumber, number, number | string>;
  courtId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
  action: "MARK_READY" | "PULL" | "SEND_TO_COURT";
  version: number;
  courtId?: number | undefined;
}, {
  action: "MARK_READY" | "PULL" | "SEND_TO_COURT";
  version: number | string;
  courtId?: number | undefined;
}>;

export declare const queueReorderItemSchema: z.ZodObject<{
  id: z.ZodEffects<z.ZodNumber, number, number | string>;
  position: z.ZodEffects<z.ZodNumber, number, number | string>;
  version: z.ZodEffects<z.ZodNumber, number, number | string>;
}, "strip", z.ZodTypeAny, {
  id: number;
  position: number;
  version: number;
}, {
  id: number | string;
  position: number | string;
  version: number | string;
}>;

export declare const queueReorderPayloadSchema: z.ZodObject<{
  tournamentId: z.ZodEffects<z.ZodNumber, number, number | string>;
  items: z.ZodArray<typeof queueReorderItemSchema, "many">;
}, "strip", z.ZodTypeAny, {
  tournamentId: number;
  items: {
    id: number;
    position: number;
    version: number;
  }[];
}, {
  tournamentId: number | string;
  items: {
    id: number | string;
    position: number | string;
    version: number | string;
  }[];
}>;

export declare const queueItemSchema: z.ZodObject<{
  id: z.ZodNumber;
  tournamentId: z.ZodNumber;
  matchId: z.ZodNumber;
  courtId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
  position: z.ZodNumber;
  version: z.ZodNumber;
  updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate, z.ZodNull]>>;
}, "strip", z.ZodTypeAny, {
  id: number;
  tournamentId: number;
  matchId: number;
  courtId?: number | null | undefined;
  position: number;
  version: number;
  updatedAt?: string | Date | null | undefined;
}, {
  id: number;
  tournamentId: number;
  matchId: number;
  courtId?: number | null | undefined;
  position: number;
  version: number;
  updatedAt?: string | Date | null | undefined;
}>;

export declare const queueActionEnum: readonly ["MARK_READY", "PULL", "SEND_TO_COURT"];

export type QueueActionPayload = z.infer<typeof queueActionPayloadSchema>;
export type QueueReorderPayload = z.infer<typeof queueReorderPayloadSchema>;
export type QueueItem = z.infer<typeof queueItemSchema>;
