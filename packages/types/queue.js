import { z } from "zod";

const queueActions = ["MARK_READY", "PULL", "SEND_TO_COURT"];

const isoDateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid datetime string.",
  });

export const queueItemIdSchema = z.coerce.number().int().positive();

export const queueActionPayloadSchema = z
  .object({
    action: z
      .string()
      .transform((value) => value.toUpperCase())
      .pipe(z.enum(queueActions)),
    version: z.coerce.number().int().min(0),
    courtId: z
      .union([z.coerce.number().int().positive(), z.string().trim().min(1)])
      .optional()
      .transform((value) => {
        if (value === undefined) return value;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
      }),
  })
  .superRefine((value, ctx) => {
    if (value.action === "SEND_TO_COURT" && !value.courtId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["courtId"],
        message: "courtId is required when action is SEND_TO_COURT.",
      });
    }
  });

export const queueReorderItemSchema = z.object({
  id: queueItemIdSchema,
  position: z.coerce.number().int(),
  version: z.coerce.number().int().min(0),
});

export const queueReorderPayloadSchema = z.object({
  tournamentId: queueItemIdSchema,
  items: z.array(queueReorderItemSchema).min(1, "items array is required."),
});

export const queueItemSchema = z.object({
  id: z.number().int().positive(),
  tournamentId: z.number().int().positive(),
  matchId: z.number().int().positive(),
  courtId: z.number().int().positive().optional().nullable(),
  position: z.number().int(),
  version: z.number().int().min(0),
  updatedAt: z.union([isoDateString, z.date(), z.null()]).optional(),
});

export const queueActionEnum = queueActions;
