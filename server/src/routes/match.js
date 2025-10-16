import express from "express";
import { ZodError } from "zod";
import prisma from "../../prisma/client.js";
import { emitPublicTournamentEvent } from "../socket/context.js";
import { sendError } from "../utils/http.js";
import {
  matchIdSchema,
  matchCreateInputSchema,
  matchScorePayloadSchema,
  matchCompletePayloadSchema,
  matchSchema,
  matchWithQueueSchema,
} from "../../../packages/types/match.js";
import { queueItemSchema } from "../../../packages/types/queue.js";

const router = express.Router();

function toPublicMatch(match, context = {}) {
  const payload = {
    id: match.id,
    bracketId: match.bracketId,
    round: match.round ?? null,
    matchNumber: match.matchNumber ?? null,
    status: match.status,
    scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
    courtId: match.courtId ?? null,
    score: match.scoreJson ?? null,
    meta: match.meta ?? null,
    updatedAt: match.updatedAt ? match.updatedAt.toISOString() : null,
    tournamentId:
      context.tournamentId ?? match.bracket?.tournamentId ?? null,
    tournamentSlug: context.tournamentSlug ?? null,
    divisionId: context.divisionId ?? match.bracket?.divisionId ?? null,
  };

  return matchSchema.parse(payload);
}

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

router.post("/", async (req, res) => {
  let input;
  try {
    input = matchCreateInputSchema.parse(req.body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "MATCH_CREATE_VALIDATION_ERROR",
        "Invalid match payload.",
        { issues: error.issues }
      );
    }
    console.error("[match.create] parse error", error);
    return sendError(res, 400, "MATCH_CREATE_VALIDATION_ERROR", "Invalid match payload.");
  }

  try {
    const bracket = await prisma.bracket.findUnique({
      where: { id: input.bracketId },
      select: { id: true, tournamentId: true, divisionId: true },
    });

    if (!bracket) {
      return sendError(res, 404, "BRACKET_NOT_FOUND", "Bracket not found.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const match = await tx.match.create({
        data: {
          bracketId: bracket.id,
          round: input.round,
          matchNumber: input.matchNumber,
          status: input.status ?? "PENDING",
          scheduledAt: input.scheduledAt ?? null,
          courtId: input.courtId ?? null,
        },
      });

      const aggregate = await tx.queueItem.aggregate({
        _max: { position: true },
        where: { tournamentId: bracket.tournamentId },
      });
      const nextPosition = (aggregate._max.position ?? 0) + 1;

      const queueItem = await tx.queueItem.create({
        data: {
          tournamentId: bracket.tournamentId,
          matchId: match.id,
          courtId: input.courtId ?? null,
          position: nextPosition,
        },
      });

      return { match, queueItem };
    });

    const matchPayload = toPublicMatch(result.match, {
      tournamentId: bracket.tournamentId,
      divisionId: bracket.divisionId ?? null,
    });
    const queuePayload = toQueueItem(result.queueItem);

    const responsePayload = matchWithQueueSchema.parse({
      match: matchPayload,
      queueItem: queuePayload,
    });

    emitPublicTournamentEvent(bracket.tournamentId, "match.updated", {
      action: "created",
      match: responsePayload.match,
    });
    emitPublicTournamentEvent(bracket.tournamentId, "queue.updated", {
      action: "enqueued",
      item: responsePayload.queueItem,
    });

    return res.status(201).json({ data: responsePayload });
  } catch (error) {
    console.error("[match.create] error", error);
    return sendError(res, 500, "MATCH_CREATE_FAILED", "Unable to create match.");
  }
});

router.post("/:id/score", async (req, res) => {
  let matchId;
  let payload;
  try {
    matchId = matchIdSchema.parse(req.params.id);
    payload = matchScorePayloadSchema.parse(req.body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "MATCH_SCORE_VALIDATION_ERROR",
        "Invalid match score payload.",
        { issues: error.issues }
      );
    }
    console.error("[match.score] parse error", error);
    return sendError(res, 400, "MATCH_SCORE_VALIDATION_ERROR", "Invalid match score payload.");
  }

  try {
    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreJson: payload.score ?? null,
        ...(payload.status ? { status: payload.status } : {}),
      },
      include: {
        bracket: { select: { tournamentId: true, divisionId: true } },
      },
    });

    const matchPayload = toPublicMatch(updated, {
      tournamentId: updated.bracket?.tournamentId ?? null,
      divisionId: updated.bracket?.divisionId ?? null,
    });

    const responsePayload = matchSchema.parse(matchPayload);
    const tournamentId = updated.bracket?.tournamentId;

    if (tournamentId) {
      emitPublicTournamentEvent(tournamentId, "score.updated", {
        matchId: updated.id,
        score: updated.scoreJson,
      });
      emitPublicTournamentEvent(tournamentId, "match.updated", {
        action: "updated",
        match: responsePayload,
      });
    }

    return res.json({ data: responsePayload });
  } catch (error) {
    if (error?.code === "P2025") {
      return sendError(res, 404, "MATCH_NOT_FOUND", "Match not found.");
    }
    console.error("[match.score] error", error);
    return sendError(res, 500, "MATCH_SCORE_FAILED", "Unable to update score.");
  }
});

router.post("/:id/complete", async (req, res) => {
  let matchId;
  let payload;
  try {
    matchId = matchIdSchema.parse(req.params.id);
    payload = matchCompletePayloadSchema.parse(req.body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "MATCH_COMPLETE_VALIDATION_ERROR",
        "Invalid match completion payload.",
        { issues: error.issues }
      );
    }
    console.error("[match.complete] parse error", error);
    return sendError(
      res,
      400,
      "MATCH_COMPLETE_VALIDATION_ERROR",
      "Invalid match completion payload."
    );
  }

  try {
    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        ...(payload.score !== undefined ? { scoreJson: payload.score } : {}),
      },
      include: {
        bracket: { select: { tournamentId: true, divisionId: true } },
      },
    });

    const matchPayload = toPublicMatch(updated, {
      tournamentId: updated.bracket?.tournamentId ?? null,
      divisionId: updated.bracket?.divisionId ?? null,
    });

    const responsePayload = matchSchema.parse(matchPayload);
    const tournamentId = updated.bracket?.tournamentId;

    if (tournamentId) {
      emitPublicTournamentEvent(tournamentId, "match.updated", {
        action: "completed",
        match: responsePayload,
      });
      emitPublicTournamentEvent(tournamentId, "score.updated", {
        matchId: updated.id,
        score: updated.scoreJson,
      });
    }

    return res.json({ data: responsePayload });
  } catch (error) {
    if (error?.code === "P2025") {
      return sendError(res, 404, "MATCH_NOT_FOUND", "Match not found.");
    }
    console.error("[match.complete] error", error);
    return sendError(res, 500, "MATCH_COMPLETE_FAILED", "Unable to complete match.");
  }
});

router.get("/:id", async (req, res) => {
  let matchId;
  try {
    matchId = matchIdSchema.parse(req.params.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(res, 400, "MATCH_INVALID_ID", "Invalid match id.", {
        issues: error.issues,
      });
    }
    console.error("[match.get] parse error", error);
    return sendError(res, 400, "MATCH_INVALID_ID", "Invalid match id.");
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { bracket: { select: { tournamentId: true, divisionId: true } } },
    });

    if (!match) {
      return sendError(res, 404, "MATCH_NOT_FOUND", "Match not found.");
    }

    const matchPayload = toPublicMatch(match, {
      tournamentId: match.bracket?.tournamentId ?? null,
      divisionId: match.bracket?.divisionId ?? null,
    });

    return res.json({ data: matchPayload });
  } catch (error) {
    console.error("[match.get] error", error);
    return sendError(res, 500, "MATCH_FETCH_FAILED", "Unable to fetch match.");
  }
});

export default router;
