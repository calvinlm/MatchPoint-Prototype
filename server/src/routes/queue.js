import express from "express";
import prisma from "../../prisma/client.js";
import { emitPublicTournamentEvent } from "../socket/context.js";
import { sendError } from "../utils/http.js";
import { ZodError } from "zod";
import {
  queueActionPayloadSchema,
  queueItemIdSchema,
  queueReorderPayloadSchema,
  queueItemSchema,
} from "../../../packages/types/queue.js";
import { matchSchema } from "../../../packages/types/match.js";

const router = express.Router();

function toQueueItem(item) {
  return queueItemSchema.parse({
    id: item.id,
    tournamentId: item.tournamentId,
    matchId: item.matchId,
    courtId: item.courtId ?? null,
    position: item.position,
    version: item.version,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
  });
}

function toPublicMatch(match, bracket) {
  if (!match) return null;
  return matchSchema.parse({
    id: match.id,
    bracketId: match.bracketId,
    round: match.round ?? null,
    matchNumber: match.matchNumber ?? null,
    status: match.status,
    scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
    courtId: match.courtId ?? null,
    score: match.scoreJson ?? null,
    updatedAt: match.updatedAt ? match.updatedAt.toISOString() : null,
    tournamentId: bracket?.tournamentId ?? null,
    tournamentSlug: null,
    divisionId: bracket?.divisionId ?? null,
  });
}

router.get("/:tournamentId", async (req, res) => {
  try {
    const tournamentId = queueItemIdSchema.parse(req.params.tournamentId);

    const items = await prisma.queueItem.findMany({
      where: { tournamentId },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });

    return res.json({ data: items.map(toQueueItem) });
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(res, 400, "INVALID_TOURNAMENT_ID", "Invalid tournament id.", {
        issues: error.issues,
      });
    }
    console.error("[queue.list] error", error);
    return sendError(res, 500, "QUEUE_LIST_FAILED", "Unable to load queue.");
  }
});

router.post("/:id/action", async (req, res) => {
  let queueItemId;
  let payload;
  try {
    queueItemId = queueItemIdSchema.parse(req.params.id);
    payload = queueActionPayloadSchema.parse(req.body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "QUEUE_ACTION_VALIDATION_ERROR",
        "Invalid queue action payload.",
        { issues: error.issues },
      );
    }
    console.error("[queue.action] parse error", error);
    return sendError(res, 400, "QUEUE_ACTION_VALIDATION_ERROR", "Invalid queue action payload.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.queueItem.findUnique({
        where: { id: queueItemId },
        include: {
          match: {
            include: {
              bracket: {
                select: { tournamentId: true, divisionId: true },
              },
            },
          },
        },
      });

      if (!existing) {
        return { status: "NOT_FOUND" };
      }

      const queueUpdate = await tx.queueItem.updateMany({
        where: {
          id: queueItemId,
          version: payload.version,
        },
        data: {
          ...(payload.action === "SEND_TO_COURT" ? { courtId: payload.courtId } : {}),
          ...(payload.action === "PULL" ? { courtId: null } : {}),
          version: payload.version + 1,
          updatedAt: new Date(),
        },
      });

      if (queueUpdate.count === 0) {
        return { status: "VERSION_CONFLICT" };
      }

      let updatedMatch = null;
      if (existing.match) {
        if (payload.action === "MARK_READY") {
          updatedMatch = await tx.match.update({
            where: { id: existing.matchId },
            data: {
              status: "READY",
            },
            include: {
              bracket: { select: { tournamentId: true, divisionId: true } },
            },
          });
        } else if (payload.action === "SEND_TO_COURT") {
          updatedMatch = await tx.match.update({
            where: { id: existing.matchId },
            data: {
              status: "IN_PROGRESS",
              courtId: payload.courtId,
            },
            include: {
              bracket: { select: { tournamentId: true, divisionId: true } },
            },
          });
        } else if (payload.action === "PULL") {
          updatedMatch = await tx.match.update({
            where: { id: existing.matchId },
            data: {
              status: "READY",
              courtId: null,
            },
            include: {
              bracket: { select: { tournamentId: true, divisionId: true } },
            },
          });
        }
      }

      const refreshed = await tx.queueItem.findUnique({ where: { id: queueItemId } });
      return {
        status: "OK",
        queueItem: refreshed,
        tournamentId: existing.tournamentId,
        match: updatedMatch,
      };
    });

    if (result.status === "NOT_FOUND") {
      return sendError(res, 404, "QUEUE_ITEM_NOT_FOUND", "Queue item not found.");
    }
    if (result.status === "VERSION_CONFLICT") {
      return sendError(
        res,
        409,
        "QUEUE_VERSION_CONFLICT",
        "Queue action failed due to a version mismatch.",
        { queueItemId }
      );
    }

    const queuePayload = toQueueItem(result.queueItem);
    emitPublicTournamentEvent(result.tournamentId, "queue.updated", {
      action: "updated",
      item: queuePayload,
    });

    let matchPayload = null;
    if (result.match) {
      matchPayload = toPublicMatch(result.match, result.match?.bracket);
      if (matchPayload && result.tournamentId) {
        emitPublicTournamentEvent(result.tournamentId, "match.updated", {
          action: "updated",
          match: matchPayload,
        });
      }
    }

    return res.json({
      data: {
        queueItem: queuePayload,
        match: matchPayload,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "QUEUE_ACTION_VALIDATION_ERROR",
        "Invalid queue action payload.",
        { issues: error.issues },
      );
    }
    console.error("[queue.action] error", error);
    return sendError(res, 500, "QUEUE_ACTION_FAILED", "Unable to apply queue action.");
  }
});

router.post("/reorder", async (req, res) => {
  let payload;
  try {
    payload = queueReorderPayloadSchema.parse(req.body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "QUEUE_REORDER_VALIDATION_ERROR",
        "Invalid queue reorder payload.",
        { issues: error.issues },
      );
    }
    console.error("[queue.reorder] parse error", error);
    return sendError(res, 400, "QUEUE_REORDER_VALIDATION_ERROR", "Invalid queue reorder payload.");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      for (const item of payload.items) {
        const updated = await tx.queueItem.updateMany({
          where: {
            id: item.id,
            tournamentId: payload.tournamentId,
            version: item.version,
          },
          data: {
            position: item.position,
            version: item.version + 1,
            updatedAt: new Date(),
          },
        });

        if (updated.count === 0) {
          throw Object.assign(new Error("Version conflict"), {
            code: "VERSION_CONFLICT",
            queueItemId: item.id,
          });
        }
      }

      return tx.queueItem.findMany({
        where: { tournamentId: payload.tournamentId },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      });
    });

    const queueItems = result.map(toQueueItem);
    emitPublicTournamentEvent(payload.tournamentId, "queue.updated", {
      action: "reordered",
      items: queueItems,
    });

    return res.json({ data: queueItems });
  } catch (error) {
    if (error?.code === "VERSION_CONFLICT") {
      return sendError(
        res,
        409,
        "QUEUE_VERSION_CONFLICT",
        "Queue reorder failed due to a version mismatch.",
        { queueItemId: error.queueItemId }
      );
    }

    console.error("[queue.reorder] error", error);
    return sendError(res, 500, "QUEUE_REORDER_FAILED", "Unable to reorder queue.");
  }
});

export default router;
