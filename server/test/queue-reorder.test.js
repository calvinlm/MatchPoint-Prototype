import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queueItemUpdateMany = vi.fn();
const queueItemFindMany = vi.fn();
const prismaTransaction = vi.fn(async (callback) =>
  callback({
    queueItem: {
      updateMany: queueItemUpdateMany,
      findMany: queueItemFindMany,
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

describe("POST /api/queue/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queueItemUpdateMany.mockReset();
    queueItemFindMany.mockReset();
    prismaTransaction.mockClear();
  });

  it("reorders queue items and emits socket event", async () => {
    queueItemUpdateMany.mockResolvedValue({ count: 1 });
    const updatedAt = new Date("2025-03-01T10:05:00.000Z");
    queueItemFindMany.mockResolvedValue([
      {
        id: 1,
        tournamentId: 77,
        matchId: 9,
        courtId: 4,
        position: 1,
        version: 3,
        updatedAt,
      },
      {
        id: 2,
        tournamentId: 77,
        matchId: 10,
        courtId: null,
        position: 2,
        version: 5,
        updatedAt,
      },
    ]);

    await withTestServer(async (agent) => {
      const response = await agent
        .post("/api/queue/reorder")
        .send({
          tournamentId: 77,
          items: [
            { id: 1, position: 1, version: 2 },
            { id: 2, position: 2, version: 4 },
          ],
        })
        .expect(200);

      expect(prismaTransaction).toHaveBeenCalledTimes(1);
      expect(queueItemUpdateMany).toHaveBeenCalledTimes(2);
      expect(queueItemUpdateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 1, tournamentId: 77, version: 2 },
        data: {
          position: 1,
          version: 3,
          updatedAt: expect.any(Date),
        },
      });
      expect(queueItemUpdateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 2, tournamentId: 77, version: 4 },
        data: {
          position: 2,
          version: 5,
          updatedAt: expect.any(Date),
        },
      });
      expect(queueItemFindMany).toHaveBeenCalledWith({
        where: { tournamentId: 77 },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      });

      const expectedItems = [
        {
          id: 1,
          tournamentId: 77,
          matchId: 9,
          courtId: 4,
          position: 1,
          version: 3,
          updatedAt: "2025-03-01T10:05:00.000Z",
        },
        {
          id: 2,
          tournamentId: 77,
          matchId: 10,
          courtId: null,
          position: 2,
          version: 5,
          updatedAt: "2025-03-01T10:05:00.000Z",
        },
      ];

      expect(response.body.data).toEqual(expectedItems);
      expect(emitPublicTournamentEvent).toHaveBeenCalledWith(77, "queue.updated", {
        action: "reordered",
        items: expectedItems,
      });
    });
  });

  it("returns 409 when a version conflict occurs", async () => {
    queueItemUpdateMany.mockResolvedValueOnce({ count: 0 });

    await withTestServer(async (agent) => {
      const response = await agent
        .post("/api/queue/reorder")
        .send({
          tournamentId: 77,
          items: [{ id: 1, position: 1, version: 2 }],
        })
        .expect(409);

      expect(response.body.error).toEqual({
        code: "QUEUE_VERSION_CONFLICT",
        message: "Queue reorder failed due to a version mismatch.",
        details: { queueItemId: 1 },
      });
      expect(queueItemFindMany).not.toHaveBeenCalled();
      expect(emitPublicTournamentEvent).not.toHaveBeenCalled();
    });
  });
});
