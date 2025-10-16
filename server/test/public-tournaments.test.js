import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tournamentFindUnique = vi.fn();
const queryRaw = vi.fn();

vi.mock("../prisma/client.js", () => ({
  default: {
    tournament: {
      findUnique: tournamentFindUnique,
    },
    $queryRaw: queryRaw,
  },
}));

const publicTournamentsRouter = (await import("../src/routes/public-tournaments.js")).default;

const app = express().use("/api/public/tournaments", publicTournamentsRouter);

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

const baseTournamentRecord = {
  id: 77,
  slug: "fall-open",
  name: "Fall Open 2025",
  startDate: new Date("2025-10-20T09:00:00.000Z"),
  endDate: new Date("2025-10-22T20:00:00.000Z"),
  venue: "Main Arena",
  isPublic: true,
  createdAt: new Date("2025-10-01T12:00:00.000Z"),
  updatedAt: new Date("2025-10-05T08:30:00.000Z"),
  publicSettings: {
    isPublic: true,
    slug: "fall-open",
    seoMeta: { title: "Fall Open 2025" },
    updatedAt: new Date("2025-10-05T08:35:00.000Z"),
  },
};

describe("Public tournaments routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tournamentFindUnique.mockReset();
    queryRaw.mockReset();
  });

  it("returns a sanitized tournament payload for GET /:slug", async () => {
    tournamentFindUnique.mockResolvedValue(baseTournamentRecord);

    await withTestServer(async (agent) => {
      const response = await agent
        .get("/api/public/tournaments/fall-open")
        .expect(200);

      expect(tournamentFindUnique).toHaveBeenCalledWith({
        where: { slug: "fall-open" },
        include: { publicSettings: true },
      });

      expect(response.body).toEqual({
        data: {
          id: 77,
          slug: "fall-open",
          name: "Fall Open 2025",
          startDate: "2025-10-20T09:00:00.000Z",
          endDate: "2025-10-22T20:00:00.000Z",
          venue: "Main Arena",
          createdAt: "2025-10-01T12:00:00.000Z",
          updatedAt: "2025-10-05T08:30:00.000Z",
          publicSettings: {
            isPublic: true,
            slug: "fall-open",
            seoMeta: { title: "Fall Open 2025" },
            updatedAt: "2025-10-05T08:35:00.000Z",
          },
        },
      });
    });
  });

  it("returns 404 when tournament is missing or not public", async () => {
    tournamentFindUnique.mockResolvedValue({
      ...baseTournamentRecord,
      publicSettings: { ...baseTournamentRecord.publicSettings, isPublic: false },
      isPublic: false,
    });

    await withTestServer(async (agent) => {
      const response = await agent
        .get("/api/public/tournaments/fall-open")
        .expect(404);

      expect(response.body.error).toEqual({
        code: "PUBLIC_TOURNAMENT_NOT_FOUND",
        message: "Tournament not found or not public.",
      });
    });
  });

  it("returns mapped matches for GET /:slug/matches", async () => {
    tournamentFindUnique.mockResolvedValue(baseTournamentRecord);
    queryRaw.mockResolvedValue([
      {
        match_id: 12,
        tournament_id: 77,
        tournament_slug: "fall-open",
        bracket_id: 3,
        division_id: 11,
        round: 1,
        match_number: 2,
        status: "READY",
        scheduled_at: "2025-10-20T10:15:00.000Z",
        court_id: 4,
        score_json: { home: 0, away: 0 },
        meta: { bestOf: 3 },
        updated_at: "2025-10-20T10:00:00.000Z",
      },
    ]);

    await withTestServer(async (agent) => {
      const response = await agent
        .get("/api/public/tournaments/fall-open/matches")
        .expect(200);

      expect(queryRaw).toHaveBeenCalledOnce();
      expect(response.body.data).toEqual([
        {
          id: 12,
          tournamentId: 77,
          tournamentSlug: "fall-open",
          bracketId: 3,
          divisionId: 11,
          round: 1,
          matchNumber: 2,
          status: "READY",
          scheduledAt: "2025-10-20T10:15:00.000Z",
          courtId: 4,
          score: { home: 0, away: 0 },
          meta: { bestOf: 3 },
          updatedAt: "2025-10-20T10:00:00.000Z",
        },
      ]);
    });
  });

  it("returns mapped brackets for GET /:slug/brackets", async () => {
    tournamentFindUnique.mockResolvedValue(baseTournamentRecord);
    queryRaw.mockResolvedValue([
      {
        bracket_id: 3,
        tournament_id: 77,
        tournament_slug: "fall-open",
        division_id: 11,
        division_name: "18U Doubles",
        division_age_group: "JUNIOR",
        division_discipline: "MD",
        division_level: "INT",
        bracket_type: "DOUBLE_ELIM",
        bracket_config: { bestOf: 3 },
        locked: true,
        created_at: "2025-10-01T12:00:00.000Z",
        updated_at: "2025-10-05T08:30:00.000Z",
      },
    ]);

    await withTestServer(async (agent) => {
      const response = await agent
        .get("/api/public/tournaments/fall-open/brackets")
        .expect(200);

      expect(response.body.data).toEqual([
        {
          id: 3,
          tournamentId: 77,
          tournamentSlug: "fall-open",
          division: {
            id: 11,
            name: "18U Doubles",
            ageGroup: "JUNIOR",
            discipline: "MD",
            level: "INT",
          },
          type: "DOUBLE_ELIM",
          config: { bestOf: 3 },
          locked: true,
          createdAt: "2025-10-01T12:00:00.000Z",
          updatedAt: "2025-10-05T08:30:00.000Z",
        },
      ]);
    });
  });

  it("returns mapped standings for GET /:slug/standings", async () => {
    tournamentFindUnique.mockResolvedValue(baseTournamentRecord);
    queryRaw.mockResolvedValue([
      {
        tournament_id: 77,
        tournament_slug: "fall-open",
        division_id: 11,
        division_name: "18U Doubles",
        division_age_group: "JUNIOR",
        division_discipline: "MD",
        division_level: "INT",
        bracket_id: 3,
        bracket_type: "DOUBLE_ELIM",
        match_summary: {
          matchesTotal: 12,
          matchesCompleted: 5,
          matchesInProgress: 2,
          matchesReady: 3,
        },
        quotient: 1.25,
        last_activity_at: "2025-10-20T10:00:00.000Z",
      },
    ]);

    await withTestServer(async (agent) => {
      const response = await agent
        .get("/api/public/tournaments/fall-open/standings")
        .expect(200);

      expect(response.body.data).toEqual([
        {
          tournamentId: 77,
          tournamentSlug: "fall-open",
          division: {
            id: 11,
            name: "18U Doubles",
            ageGroup: "JUNIOR",
            discipline: "MD",
            level: "INT",
          },
          bracket: {
            id: 3,
            type: "DOUBLE_ELIM",
          },
          matchSummary: {
            matchesTotal: 12,
            matchesCompleted: 5,
            matchesInProgress: 2,
            matchesReady: 3,
          },
          quotient: 1.25,
          lastActivityAt: "2025-10-20T10:00:00.000Z",
        },
      ]);
    });
  });

  it("returns mapped teams for GET /:slug/teams", async () => {
    tournamentFindUnique.mockResolvedValue(baseTournamentRecord);
    queryRaw.mockResolvedValue([
      {
        team_id: 201,
        team_code: "18MD_INT_001",
        tournament_id: 77,
        tournament_slug: "fall-open",
        age_group: "JUNIOR",
        discipline: "MD",
        level: "INT",
        created_at: "2025-10-01T12:00:00.000Z",
        updated_at: "2025-10-05T08:30:00.000Z",
        registrations: [
          { divisionId: 11, entryCode: "18MD_INT_001" },
        ],
        roster: [
          { slot: 1, player_id: 501 },
          { slot: 2, player_id: 502 },
        ],
      },
    ]);

    await withTestServer(async (agent) => {
      const response = await agent
        .get("/api/public/tournaments/fall-open/teams")
        .expect(200);

      expect(response.body.data).toEqual([
        {
          id: 201,
          code: "18MD_INT_001",
          tournamentId: 77,
          tournamentSlug: "fall-open",
          entryCode: "18MD_INT_001",
          ageGroup: "JUNIOR",
          discipline: "MD",
          level: "INT",
          createdAt: "2025-10-01T12:00:00.000Z",
          updatedAt: "2025-10-05T08:30:00.000Z",
          roster: [
            { slot: 1, playerId: 501 },
            { slot: 2, playerId: 502 },
          ],
          registrations: [
            { divisionId: 11, entryCode: "18MD_INT_001" },
          ],
        },
      ]);
    });
  });
});
