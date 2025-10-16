import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queueItemFindUnique = vi.fn();
const queueItemUpdateMany = vi.fn();
const matchUpdate = vi.fn();
const prismaTransaction = vi.fn(async (callback) =>
  callback({
    queueItem: {
      findUnique: queueItemFindUnique,
      updateMany: queueItemUpdateMany,
    },
    match: {
      update: matchUpdate,
    },
  }),
);

vi.mock("../prisma/client.js", () => ({
  default: {
    $transaction: prismaTransaction,
  },
}));

vi.mock("../src/socket/context.js", () => ({
  emitPublicTournamentEvent: vi.fn(),
}));

const { default: prisma } = await import("../prisma/client.js");
const { emitPublicTournamentEvent } = await import("../src/socket/context.js");
const queueRouter = (await import("../src/routes/queue.js")).default;

const app = express().use(express.json()).use("/api/queue", queueRouter);

async function withTestServer(run) {
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    return await run(request(server));
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => {
        if (error && error.code !== "ERR_SERVER_NOT_RUNNING") {
          reject(error);
        } else {
          resolve();
        }
      }),
    );
  }
}

describe("POST /api/queue/:id/action", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    queueItemFindUnique.mockReset();
    queueItemUpdateMany.mockReset();
    matchUpdate.mockReset();
    prismaTransaction.mockClear();
  });

  it("sends a match to court and emits queue and match updates", async () => {
    const existingQueueItem = {
      id: 1,
      tournamentId: 77,
      matchId: 9,
      courtId: null,
      position: 1,
      version: 1,
      updatedAt: new Date("2025-03-01T10:00:00.000Z"),
      match: {
        id: 9,
        bracketId: 3,
        round: 1,
        matchNumber: 2,
        status: "READY",
        scheduledAt: null,
        courtId: null,
        scoreJson: null,
        updatedAt: new Date("2025-03-01T10:00:00.000Z"),
        bracket: { tournamentId: 77, divisionId: 11 },
      },
    };
    const refreshedQueueItem = {
      ...existingQueueItem,
      version: 2,
      courtId: 4,
      updatedAt: new Date("2025-03-01T10:05:00.000Z"),
    };
    const updatedMatch = {
      id: 9,
      bracketId: 3,
      round: 1,
      matchNumber: 2,
      status: "IN_PROGRESS",
      scheduledAt: null,
      courtId: 4,
      scoreJson: null,
      updatedAt: new Date("2025-03-01T10:05:00.000Z"),
      bracket: { tournamentId: 77, divisionId: 11 },
    };

    queueItemFindUnique
      .mockResolvedValueOnce(existingQueueItem)
      .mockResolvedValueOnce(refreshedQueueItem);
    queueItemUpdateMany.mockResolvedValue({ count: 1 });
    matchUpdate.mockResolvedValue(updatedMatch);

    await withTestServer(async (agent) => {
      const response = await agent
        .post("/api/queue/1/action")
        .send({ action: "SEND_TO_COURT", version: 1, courtId: 4 })
        .expect(200);

      expect(queueItemUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, version: 1 },
        data: expect.objectContaining({ courtId: 4, version: 2 }),
      });
      expect(matchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 9 },
          data: expect.objectContaining({ status: "IN_PROGRESS", courtId: 4 }),
        }),
      );

      expect(response.body.data.queueItem).toEqual({
        id: 1,
        tournamentId: 77,
        matchId: 9,
        courtId: 4,
        position: 1,
        version: 2,
        updatedAt: "2025-03-01T10:05:00.000Z",
      });
      expect(response.body.data.match).toEqual({
        id: 9,
        bracketId: 3,
        round: 1,
        matchNumber: 2,
        status: "IN_PROGRESS",
        scheduledAt: null,
        courtId: 4,
        score: null,
        meta: null,
        updatedAt: "2025-03-01T10:05:00.000Z",
        tournamentId: 77,
        tournamentSlug: null,
        divisionId: 11,
      });

      expect(emitPublicTournamentEvent).toHaveBeenCalledWith(77, "queue.updated", {
        action: "updated",
        item: expect.objectContaining({ id: 1, courtId: 4, version: 2 }),
      });
      expect(emitPublicTournamentEvent).toHaveBeenCalledWith(77, "match.updated", {
        action: "updated",
        match: expect.objectContaining({ id: 9, courtId: 4, status: "IN_PROGRESS" }),
      });
    });
  });

  it("returns 409 when the queue item version is stale", async () => {
    queueItemFindUnique.mockResolvedValue({
      id: 2,
      tournamentId: 77,
      matchId: 10,
      courtId: null,
      position: 2,
      version: 4,
      updatedAt: new Date("2025-03-01T10:00:00.000Z"),
      match: null,
    });
    queueItemUpdateMany.mockResolvedValue({ count: 0 });
    await withTestServer(async (agent) => {
      const response = await agent
        .post("/api/queue/2/action")
        .send({ action: "MARK_READY", version: 3 })
        .expect(409);

      expect(response.body.error.code).toBe("QUEUE_VERSION_CONFLICT");
      expect(matchUpdate).not.toHaveBeenCalled();
      expect(emitPublicTournamentEvent).not.toHaveBeenCalled();
    });
  });
});
