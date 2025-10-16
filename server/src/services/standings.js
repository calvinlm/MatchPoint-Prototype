import { Prisma } from "@prisma/client";

function asObject(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeTeamId(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && Number.isInteger(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    const numeric = Number(raw);
    if (Number.isInteger(numeric)) {
      return numeric;
    }
  }
  return null;
}

function extractTeamIds(match) {
  const score = asObject(match.scoreJson);
  const meta = asObject(match.meta);

  if (Array.isArray(score.teams) && score.teams.length >= 2) {
    const teamA = score.teams[0];
    const teamB = score.teams[1];
    const teamAId =
      normalizeTeamId(teamA?.id) ??
      normalizeTeamId(teamA?.teamId) ??
      normalizeTeamId(teamA?.team?.id);
    const teamBId =
      normalizeTeamId(teamB?.id) ??
      normalizeTeamId(teamB?.teamId) ??
      normalizeTeamId(teamB?.team?.id);
    if (teamAId !== null && teamBId !== null) {
      return [teamAId, teamBId];
    }
  }

  const metaTeams = Array.isArray(meta.teams) ? meta.teams : [];
  if (metaTeams.length >= 2) {
    const metaTeamAId =
      normalizeTeamId(metaTeams[0]?.id) ??
      normalizeTeamId(metaTeams[0]?.teamId);
    const metaTeamBId =
      normalizeTeamId(metaTeams[1]?.id) ??
      normalizeTeamId(metaTeams[1]?.teamId);
    if (metaTeamAId !== null && metaTeamBId !== null) {
      return [metaTeamAId, metaTeamBId];
    }
  }

  const teamAId =
    normalizeTeamId(score.teamAId) ??
    normalizeTeamId(score.teamA?.id) ??
    normalizeTeamId(meta.teamAId);
  const teamBId =
    normalizeTeamId(score.teamBId) ??
    normalizeTeamId(score.teamB?.id) ??
    normalizeTeamId(meta.teamBId);

  if (teamAId !== null && teamBId !== null) {
    return [teamAId, teamBId];
  }

  return null;
}

function readGames(score) {
  if (Array.isArray(score.games)) {
    return score.games;
  }
  if (Array.isArray(score.sets)) {
    return score.sets;
  }
  if (Array.isArray(score.results)) {
    return score.results;
  }
  return [];
}

function numericScore(value) {
  if (value === null || value === undefined) return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function determineWinnerIndices(score, totals) {
  const normalized = asObject(score);

  const declaredWinner =
    normalizeTeamId(normalized.winnerTeamId) ??
    normalizeTeamId(normalized.winnerId) ??
    normalizeTeamId(normalized.winner?.id) ??
    normalizeTeamId(normalized.winner?.teamId);

  if (declaredWinner !== null && Array.isArray(normalized.teams)) {
    const winnerIndex = normalized.teams.findIndex((team) => {
      const teamId =
        normalizeTeamId(team?.id) ??
        normalizeTeamId(team?.teamId) ??
        normalizeTeamId(team?.team?.id);
      return teamId === declaredWinner;
    });
    if (winnerIndex === 0) return { winner: 0, loser: 1 };
    if (winnerIndex === 1) return { winner: 1, loser: 0 };
  }

  if (totals.gamesWon[0] > totals.gamesWon[1]) {
    return { winner: 0, loser: 1 };
  }
  if (totals.gamesWon[1] > totals.gamesWon[0]) {
    return { winner: 1, loser: 0 };
  }
  if (totals.points[0] > totals.points[1]) {
    return { winner: 0, loser: 1 };
  }
  if (totals.points[1] > totals.points[0]) {
    return { winner: 1, loser: 0 };
  }

  return { winner: null, loser: null };
}

function computeMatchTotals(score) {
  const games = readGames(score);
  if (!games.length) {
    return null;
  }

  const totals = {
    points: [0, 0],
    gamesWon: [0, 0],
  };

  for (const game of games) {
    const scoreA =
      numericScore(game?.scoreA ?? game?.score_a ?? game?.a ?? game?.home ?? game?.teamA);
    const scoreB =
      numericScore(game?.scoreB ?? game?.score_b ?? game?.b ?? game?.away ?? game?.teamB);

    totals.points[0] += scoreA;
    totals.points[1] += scoreB;

    if (scoreA > scoreB) {
      totals.gamesWon[0] += 1;
    } else if (scoreB > scoreA) {
      totals.gamesWon[1] += 1;
    }
  }

  return totals;
}

function roundQuotient(value) {
  const quotient = Number.isFinite(value) ? value : 0;
  const normalized = quotient >= 0 ? quotient : 0;
  const fixed = normalized.toFixed(4);
  return {
    number: Number.parseFloat(fixed),
    db: fixed,
  };
}

export async function recalculateStandingsForBracket(tx, { tournamentId, bracketId }) {
  if (!tournamentId || !bracketId) {
    throw new Error("tournamentId and bracketId are required for standings recalculation.");
  }

  const matches = await tx.match.findMany({
    where: {
      bracketId,
      status: "COMPLETED",
      scoreJson: { not: null },
    },
    select: {
      id: true,
      scoreJson: true,
      meta: true,
    },
  });

  const stats = new Map();

  for (const match of matches) {
    const score = asObject(match.scoreJson);
    const teamIds = extractTeamIds(match);
    if (!teamIds) continue;

    const totals = computeMatchTotals(score);
    if (!totals) continue;

    const { winner, loser } = determineWinnerIndices(score, totals);
    if (winner === null || loser === null) continue;

    const [teamAId, teamBId] = teamIds;
    const teamIdsByIndex = [teamAId, teamBId];

    const winnerTeamId = teamIdsByIndex[winner];
    const loserTeamId = teamIdsByIndex[loser];

    if (winnerTeamId == null || loserTeamId == null) continue;

    for (let index = 0; index < teamIdsByIndex.length; index += 1) {
      const teamId = teamIdsByIndex[index];
      const opponentIndex = index === 0 ? 1 : 0;
      const teamStats =
        stats.get(teamId) ??
        stats.set(teamId, {
          teamId,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        }).get(teamId);

      teamStats.pointsFor += totals.points[index];
      teamStats.pointsAgainst += totals.points[opponentIndex];

      if (teamId === winnerTeamId) {
        teamStats.wins += 1;
      } else if (teamId === loserTeamId) {
        teamStats.losses += 1;
      }
    }
  }

  const standings = [...stats.values()].map((entry) => {
    const quotient = roundQuotient(entry.pointsFor / Math.max(1, entry.pointsAgainst));
    return {
      teamId: entry.teamId,
      wins: entry.wins,
      losses: entry.losses,
      pointsFor: entry.pointsFor,
      pointsAgainst: entry.pointsAgainst,
      quotient,
    };
  });

  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.quotient.number !== a.quotient.number) {
      return b.quotient.number - a.quotient.number;
    }
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return a.teamId - b.teamId;
  });

  let rank = 1;
  const records = standings.map((entry) => {
    const record = {
      tournamentId,
      bracketId,
      teamId: entry.teamId,
      wins: entry.wins,
      losses: entry.losses,
      pointsFor: entry.pointsFor,
      pointsAgainst: entry.pointsAgainst,
      quotient: new Prisma.Decimal(entry.quotient.db),
      rank,
    };
    rank += 1;
    return record;
  });

  await tx.standing.deleteMany({ where: { bracketId } });

  if (records.length > 0) {
    await tx.standing.createMany({ data: records });
  }

  return standings.map((entry, index) => ({
    teamId: entry.teamId,
    wins: entry.wins,
    losses: entry.losses,
    pointsFor: entry.pointsFor,
    pointsAgainst: entry.pointsAgainst,
    quotient: entry.quotient.number,
    rank: index + 1,
  }));
}

export default {
  recalculateStandingsForBracket,
};
