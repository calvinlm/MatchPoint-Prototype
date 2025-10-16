import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const teamFindMany = vi.fn();
const teamCreate = vi.fn();
const playerFindMany = vi.fn();
const divisionFindFirst = vi.fn();
const divisionCreate = vi.fn();
const registrationCreate = vi.fn();
const prismaTransaction = vi.fn(async (callback) =>
  callback({
    team: {
      findMany: teamFindMany,
      create: teamCreate,
    },
    division: {
      findFirst: divisionFindFirst,
      create: divisionCreate,
    },
    registration: {
      create: registrationCreate,
    },
  }),
);

vi.mock("../prisma/client.js", () => ({
  default: {
    $transaction: prismaTransaction,
    team: {
      findFirst: vi.fn(),
      findMany: teamFindMany,
    },
    player: {
      findMany: playerFindMany,
    },
  },
}));

const emitPublicTournamentEvent = vi.fn();
vi.mock("../src/socket/context.js", () => ({
  emitPublicTournamentEvent,
}));

const teamsRouter = (await import("../src/routes/teams.js")).default;

const app = express().use(express.json()).use("/api/teams", teamsRouter);

async function withServer(run) {
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

describe("/api/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    teamFindMany.mockReset();
    teamCreate.mockReset();
    playerFindMany.mockReset();
    divisionFindFirst.mockReset();
    divisionCreate.mockReset();
    registrationCreate.mockReset();
    prismaTransaction.mockClear();
    emitPublicTournamentEvent.mockClear();
  });

  it("creates team, ensures division, and registers entry code", async () => {
    playerFindMany.mockResolvedValue([
      { id: 1, gender: "MALE" },
      { id: 2, gender: "FEMALE" },
    ]);

    teamFindMany.mockResolvedValue([]);

    const createdAt = new Date("2025-03-01T10:00:00.000Z");
    teamCreate.mockResolvedValue({
      id: 201,
      code: "18MDInt_001",
      age: "A18",
      division: "MD",
      level: "INT",
      tournamentId: 77,
      createdAt,
      members: [
        { player: { name: "John Smith" } },
        { player: { name: "Jane Doe" } },
      ],
    });

    divisionFindFirst.mockResolvedValue(null);
    divisionCreate.mockResolvedValue({
      id: 55,
      tournamentId: 77,
      ageGroup: "A18",
      discipline: "MD",
      level: "INT",
      name: "Mens Doubles Intermediate",
    });
    registrationCreate.mockResolvedValue({
      id: 999,
      tournamentId: 77,
      divisionId: 55,
      teamId: 201,
      entryCode: "18MDInt_001",
    });

    await withServer(async (agent) => {
      const response = await agent
        .post("/api/teams")
        .send({
          ageGroup: "18+",
          category: "Mens Doubles",
          level: "Intermediate",
          playerIds: [1, 2],
          tournamentId: 77,
        })
        .expect(201);

      expect(prismaTransaction).toHaveBeenCalledTimes(1);
      expect(teamFindMany).toHaveBeenCalledWith({
        where: { code: { startsWith: "18MDInt_" } },
        select: { code: true },
      });
      expect(divisionCreate).toHaveBeenCalledWith({
        data: {
          tournamentId: 77,
          name: "Mens Doubles Intermediate",
          ageGroup: "A18",
          discipline: "MD",
          level: "INT",
        },
      });
      expect(registrationCreate).toHaveBeenCalledWith({
        data: {
          tournamentId: 77,
          divisionId: 55,
          teamId: 201,
          entryCode: "18MDInt_001",
        },
      });

      expect(response.body).toEqual({
        id: "18MDInt_001",
        ageGroup: "18+",
        category: "Mens Doubles",
        level: "Intermediate",
        entryCode: "18MDInt_001",
        tournamentId: 77,
        registrations: [
          {
            divisionId: 55,
            entryCode: "18MDInt_001",
          },
        ],
        players: ["John Smith", "Jane Doe"],
        timestamp: createdAt.getTime(),
        _dbId: 201,
      });

      expect(emitPublicTournamentEvent).toHaveBeenCalledWith(77, "teams.updated", {
        action: "created",
        teamId: 201,
        code: "18MDInt_001",
      });
    });
  });
});
