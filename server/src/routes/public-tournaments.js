import { Router } from "express";
import prisma from "../../prisma/client.js";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { sendError } from "../utils/http.js";
import {
  publicTournamentSlugSchema,
  publicTournamentSchema,
  publicMatchListSchema,
  publicBracketListSchema,
  publicStandingListSchema,
  publicTeamListSchema,
} from "../../../packages/types/public.js";

const router = Router();

async function loadPublicTournament(slug) {
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { publicSettings: true },
  });

  if (!tournament) return null;

  const isPublic =
    tournament.publicSettings?.isPublic ?? tournament.isPublic ?? false;

  if (!isPublic) return null;

  const mapped = {
    id: tournament.id,
    slug: tournament.slug,
    name: tournament.name,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    venue: tournament.venue,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
    publicSettings: {
      isPublic: Boolean(tournament.publicSettings?.isPublic ?? tournament.isPublic),
      slug: tournament.publicSettings?.slug ?? tournament.slug,
      seoMeta: tournament.publicSettings?.seoMeta ?? null,
      updatedAt: tournament.publicSettings?.updatedAt ?? tournament.updatedAt,
    },
  };

  return publicTournamentSchema.parse({
    ...mapped,
    startDate: mapped.startDate ? mapped.startDate.toISOString() : null,
    endDate: mapped.endDate ? mapped.endDate.toISOString() : null,
    createdAt: mapped.createdAt ? mapped.createdAt.toISOString() : null,
    updatedAt: mapped.updatedAt ? mapped.updatedAt.toISOString() : null,
    publicSettings: {
      ...mapped.publicSettings,
      updatedAt: mapped.publicSettings.updatedAt
        ? mapped.publicSettings.updatedAt.toISOString()
        : null,
    },
  });
}

async function ensurePublicTournament(req, res, next) {
  try {
    const slug = publicTournamentSlugSchema.parse(req.params.slug);
    const tournament = await loadPublicTournament(slug);
    if (!tournament) {
      return sendError(
        res,
        404,
        "PUBLIC_TOURNAMENT_NOT_FOUND",
        "Tournament not found or not public."
      );
    }
    res.locals.tournament = tournament;
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(
        res,
        400,
        "INVALID_TOURNAMENT_SLUG",
        "Invalid tournament slug.",
        { issues: error.issues }
      );
    }
    console.error("Failed to load public tournament", error);
    return sendError(
      res,
      500,
      "PUBLIC_TOURNAMENT_LOAD_FAILED",
      "Unable to load tournament data."
    );
  }
}

function mapPublicMatch(row) {
  const rawCourt = row.court_id;
  const courtId =
    typeof rawCourt === "number" ? rawCourt : rawCourt != null ? Number(rawCourt) : null;

  return {
    id: row.match_id,
    tournamentId: row.tournament_id,
    tournamentSlug: row.tournament_slug,
    bracketId: row.bracket_id,
    divisionId: row.division_id ?? row.category_id,
    round: row.round,
    matchNumber: row.match_number,
    status: row.status,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null,
    courtId,
    score: row.score_json,
    meta: row.meta ?? null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

function mapPublicBracket(row) {
  return {
    id: row.bracket_id,
    tournamentId: row.tournament_id,
    tournamentSlug: row.tournament_slug,
    division: {
      id: row.division_id ?? row.category_id,
      name: row.division_name ?? row.category_name,
      ageGroup: row.division_age_group ?? row.category_age,
      discipline: row.division_discipline ?? row.category_division,
      level: row.division_level ?? row.category_level,
    },
    type: row.bracket_type ?? row.bracket_format,
    config: row.bracket_config ?? null,
    locked: row.locked ?? false,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

function mapMatchSummary(summary) {
  if (!summary || typeof summary !== "object") {
    return {
      matchesTotal: 0,
      matchesCompleted: 0,
      matchesInProgress: 0,
      matchesReady: 0,
    };
  }
  return {
    matchesTotal: Number(summary.matches_total ?? summary.matchesTotal ?? 0),
    matchesCompleted: Number(
      summary.matches_completed ?? summary.matchesCompleted ?? 0
    ),
    matchesInProgress: Number(
      summary.matches_in_progress ?? summary.matchesInProgress ?? 0
    ),
    matchesReady: Number(summary.matches_ready ?? summary.matchesReady ?? 0),
  };
}

function mapPublicStanding(row) {
  return {
    tournamentId: row.tournament_id,
    tournamentSlug: row.tournament_slug,
    division: row.division_id ?? row.category_id
      ? {
          id: row.division_id ?? row.category_id,
          name: row.division_name ?? row.category_name,
          ageGroup: row.division_age_group ?? row.category_age,
          discipline: row.division_discipline ?? row.category_division,
          level: row.division_level ?? row.category_level,
        }
      : null,
    bracket: {
      id: row.bracket_id,
      type: row.bracket_type ?? row.bracket_format,
    },
    matchSummary: mapMatchSummary(row.match_summary),
    quotient: row.quotient ? Number(row.quotient) : undefined,
    lastActivityAt: row.last_activity_at
      ? new Date(row.last_activity_at).toISOString()
      : null,
  };
}

function normalizeRoster(roster) {
  let source = roster;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }

  if (!Array.isArray(source)) return [];
  return source.map((slot) => ({
    slot: Number.isFinite(Number(slot?.slot)) ? Number(slot.slot) : null,
    playerId: Number.isFinite(Number(slot?.player_id)) ? Number(slot.player_id) : null,
  }));
}

function mapPublicTeam(row) {
  let registrationsRaw = row.registrations;
  if (typeof registrationsRaw === "string") {
    try {
      registrationsRaw = JSON.parse(registrationsRaw);
    } catch {
      registrationsRaw = [];
    }
  }

  const normalizedArray = Array.isArray(registrationsRaw) ? registrationsRaw : [];
  const registrations = normalizedArray
    .map((reg) => {
      const divisionId = Number.isFinite(Number(reg?.divisionId ?? reg?.division_id))
        ? Number(reg?.divisionId ?? reg?.division_id)
        : null;
      const entryCode =
        typeof reg?.entryCode === "string"
          ? reg.entryCode
          : typeof reg?.entry_code === "string"
            ? reg.entry_code
            : null;
      return entryCode ? { divisionId, entryCode } : null;
    })
    .filter(Boolean);

  const primaryEntry = registrations[0] ?? null;

  return {
    id: row.team_id,
    code: row.team_code,
    tournamentId: row.tournament_id,
    tournamentSlug: row.tournament_slug,
    entryCode: primaryEntry?.entryCode ?? null,
    ageGroup: row.age_group ?? row.age_bracket,
    discipline: row.discipline ?? row.division,
    level: row.level,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    roster: normalizeRoster(row.roster),
    registrations,
  };
}

router.get("/:slug", ensurePublicTournament, (req, res) => {
  const { tournament } = res.locals;
  res.json({ data: tournament });
});

router.get("/:slug/matches", ensurePublicTournament, async (req, res) => {
  const { slug } = req.params;
  try {
    const rows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT *
        FROM public_matches_v
        WHERE tournament_slug = ${slug}
        ORDER BY scheduled_at NULLS LAST, match_number ASC
      `
    );
    const data = publicMatchListSchema.parse(
      Array.isArray(rows) ? rows.map(mapPublicMatch) : []
    );
    res.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Public matches validation failed", error);
      return sendError(
        res,
        500,
        "PUBLIC_MATCHES_SHAPE_INVALID",
        "Public matches payload failed validation.",
        { issues: error.issues }
      );
    }
    console.error("Failed to load public matches", error);
    return sendError(
      res,
      500,
      "PUBLIC_MATCHES_LOAD_FAILED",
      "Unable to load matches."
    );
  }
});

router.get("/:slug/brackets", ensurePublicTournament, async (req, res) => {
  const { slug } = req.params;
  try {
    const rows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT *
        FROM public_brackets_v
        WHERE tournament_slug = ${slug}
        ORDER BY division_age_group, division_discipline, division_level, bracket_id
      `
    );
    const data = publicBracketListSchema.parse(
      Array.isArray(rows) ? rows.map(mapPublicBracket) : []
    );
    res.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Public brackets validation failed", error);
      return sendError(
        res,
        500,
        "PUBLIC_BRACKETS_SHAPE_INVALID",
        "Public brackets payload failed validation.",
        { issues: error.issues }
      );
    }
    console.error("Failed to load public brackets", error);
    return sendError(
      res,
      500,
      "PUBLIC_BRACKETS_LOAD_FAILED",
      "Unable to load brackets."
    );
  }
});

router.get("/:slug/standings", ensurePublicTournament, async (req, res) => {
  const { slug } = req.params;
  try {
    const rows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT *
        FROM public_standings_v
        WHERE tournament_slug = ${slug}
        ORDER BY division_age_group, division_discipline, division_level, bracket_id
      `
    );
    const data = publicStandingListSchema.parse(
      Array.isArray(rows) ? rows.map(mapPublicStanding) : []
    );
    res.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Public standings validation failed", error);
      return sendError(
        res,
        500,
        "PUBLIC_STANDINGS_SHAPE_INVALID",
        "Public standings payload failed validation.",
        { issues: error.issues }
      );
    }
    console.error("Failed to load public standings", error);
    return sendError(
      res,
      500,
      "PUBLIC_STANDINGS_LOAD_FAILED",
      "Unable to load standings."
    );
  }
});

router.get("/:slug/teams", ensurePublicTournament, async (req, res) => {
  const { slug } = req.params;
  try {
    const rows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT *
        FROM public_teams_v
        WHERE tournament_slug = ${slug}
        ORDER BY team_code
      `
    );
    const data = publicTeamListSchema.parse(
      Array.isArray(rows) ? rows.map(mapPublicTeam) : []
    );
    return res.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Public teams validation failed", error);
      return sendError(
        res,
        500,
        "PUBLIC_TEAMS_SHAPE_INVALID",
        "Public teams payload failed validation.",
        { issues: error.issues }
      );
    }
    console.error("Failed to load public teams", error);
    return sendError(
      res,
      500,
      "PUBLIC_TEAMS_LOAD_FAILED",
      "Unable to load teams."
    );
  }
});

export default router;
