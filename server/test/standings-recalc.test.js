import { describe, it, expect, vi, beforeEach } from "vitest";
import { recalculateStandingsForBracket } from "../src/services/standings.js";
import { Prisma } from "@prisma/client";

describe("recalculateStandingsForBracket", () => {
  let tx;
  let matchFindMany;
  let standingDeleteMany;
  let standingCreateMany;

  beforeEach(() => {
    matchFindMany = vi.fn();
    standingDeleteMany = vi.fn();
    standingCreateMany = vi.fn();

    tx = {
      match: {
        findMany: matchFindMany,
      },
      standing: {
        deleteMany: standingDeleteMany,
        createMany: standingCreateMany,
      },
    };
  });

  it("computes standings, persists rows, and returns normalized payload", async () => {
    matchFindMany.mockResolvedValue([
      {
        id: 1,
        scoreJson: {
          teams: [{ id: 101 }, { id: 102 }],
          games: [
            { seq: 1, scoreA: 11, scoreB: 7 },
            { seq: 2, scoreA: 11, scoreB: 6 },
          ],
        },
        meta: null,
      },
      {
        id: 2,
        scoreJson: {
          teams: [{ id: 102 }, { id: 103 }],
          games: [
            { seq: 1, scoreA: 10, scoreB: 12 },
            { seq: 2, scoreA: 9, scoreB: 11 },
          ],
        },
        meta: null,
      },
    ]);

    const result = await recalculateStandingsForBracket(tx, {
      tournamentId: 77,
      bracketId: 3,
    });

    expect(matchFindMany).toHaveBeenCalledWith({
      where: {
        bracketId: 3,
        status: "COMPLETED",
        scoreJson: { not: null },
      },
      select: {
        id: true,
        scoreJson: true,
        meta: true,
      },
    });

    expect(standingDeleteMany).toHaveBeenCalledWith({ where: { bracketId: 3 } });

    expect(standingCreateMany).toHaveBeenCalledTimes(1);
    const createPayload = standingCreateMany.mock.calls[0][0];
    expect(createPayload.data).toHaveLength(3);

    const [first, second, third] = createPayload.data;

    expect(first).toEqual(
      expect.objectContaining({
        tournamentId: 77,
        bracketId: 3,
        teamId: 101,
        wins: 1,
        losses: 0,
        pointsFor: 22,
        pointsAgainst: 13,
        rank: 1,
      })
    );
    expect(first.quotient).toBeInstanceOf(Prisma.Decimal);
    expect(first.quotient.toString()).toBe("1.6923");

    expect(second).toEqual(
      expect.objectContaining({
        teamId: 103,
        wins: 1,
        losses: 0,
        pointsFor: 23,
        pointsAgainst: 19,
        rank: 2,
      })
    );
    expect(second.quotient.toString()).toBe("1.2105");

    expect(third).toEqual(
      expect.objectContaining({
        teamId: 102,
        wins: 0,
        losses: 2,
        pointsFor: 32,
        pointsAgainst: 45,
        rank: 3,
      })
    );
    expect(third.quotient.toString()).toBe("0.7111");

    expect(result).toEqual([
      {
        teamId: 101,
        wins: 1,
        losses: 0,
        pointsFor: 22,
        pointsAgainst: 13,
        quotient: 1.6923,
        rank: 1,
      },
      {
        teamId: 103,
        wins: 1,
        losses: 0,
        pointsFor: 23,
        pointsAgainst: 19,
        quotient: 1.2105,
        rank: 2,
      },
      {
        teamId: 102,
        wins: 0,
        losses: 2,
        pointsFor: 32,
        pointsAgainst: 45,
        quotient: 0.7111,
        rank: 3,
      },
    ]);
  });

  it("clears standings when no completed matches with scores exist", async () => {
    matchFindMany.mockResolvedValue([]);

    const result = await recalculateStandingsForBracket(tx, {
      tournamentId: 88,
      bracketId: 9,
    });

    expect(matchFindMany).toHaveBeenCalledOnce();
    expect(standingDeleteMany).toHaveBeenCalledWith({ where: { bracketId: 9 } });
    expect(standingCreateMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
