// server/routes/teams.js
import { Router } from "express"
import { Prisma } from "@prisma/client"
import { ZodError } from "zod"
import { emitPublicTournamentEvent } from "../socket/context.js"
import { sendError } from "../utils/http.js"
import {
  teamCreateInputSchema,
  teamUpdateInputSchema,
  teamIdSchema,
} from "../../../packages/types/team.js"

import prisma from "../../prisma/client.js"
const r = Router()

/* ================= MAPPERS ================= */
function uiToAgeGroup(ageGroup) {
  if (ageGroup === "Junior (17 below)") return "JUNIOR"
  if (ageGroup === "18+") return "A18"
  if (ageGroup === "35+") return "A35"
  return "A50"
}
function uiToDivision(category) {
  if (category === "Mens Singles") return "MS"
  if (category === "Mens Doubles") return "MD"
  if (category === "Womens Singles") return "WS"
  if (category === "Womens Doubles") return "WD"
  return "XD" // Mixed Doubles
}
function uiToLevel(level) {
  if (level === "Novice") return "NOV"
  if (level === "Intermediate") return "INT"
  if (level === "Open") return "OPN"
  return "ADV"
}
function enumToAgeLabel(a) {
  switch (a) {
    case "JUNIOR":
      return "Junior (17 below)"
    case "A18":
      return "18+"
    case "A35":
      return "35+"
    case "A50":
      return "50+"
    default:
      return "18+"
  }
}
function enumToCategoryLabel(d) {
  return d === "MS"
    ? "Mens Singles"
    : d === "MD"
    ? "Mens Doubles"
    : d === "WS"
    ? "Womens Singles"
    : d === "WD"
    ? "Womens Doubles"
    : "Mixed Doubles"
}
function enumToLevelLabel(l) {
  return l === "NOV" ? "Novice" : l === "INT" ? "Intermediate" : l === "OPN" ? "Open" : "Advanced"
}

// e.g. 18MDInt_
function codePrefix(age, division, level) {
  const ageCode = age === "JUNIOR" ? "Jr" : age === "A18" ? "18" : age === "A35" ? "35" : "50"
  const divCode = { MS: "MS", MD: "MD", WS: "WS", WD: "WD", XD: "XD" }[division]
  const lvlCode = { NOV: "Nov", INT: "Int", ADV: "Adv", OPN: "Opn" }[level]
  return `${ageCode}${divCode}${lvlCode}_`
}

/* ================= HELPERS ================= */
const slotOrder = { slot: { sort: "asc", nulls: "first" } }

/** Resolve a team by numeric DB id or by code string. */
async function findTeamByAnyId(idOrCode) {
  const asNum = Number(idOrCode)
  const where =
    Number.isFinite(asNum) && String(asNum) === String(idOrCode)
      ? { id: asNum }
      : { code: String(idOrCode) }
  return prisma.team.findFirst({
    where,
    include: {
      members: true,
      registrations: true,
    },
  })
}

/** Validate Singles/Doubles/Mixed constraints + player existence. Throws Error with .status when invalid. */
async function validateDivisionAndPlayers(division, playerIds) {
  // dedupe
  const uniq = [...new Set(playerIds)]
  if (uniq.length !== playerIds.length) {
    const err = new Error("Duplicate playerIds are not allowed")
    err.status = 400
    throw err
  }

  // load players to ensure they exist (and for Mixed gender check)
  const players = await prisma.player.findMany({
    where: { id: { in: uniq } },
    select: { id: true, gender: true },
  })
  if (players.length !== uniq.length) {
    const err = new Error("One or more playerIds do not exist")
    err.status = 400
    throw err
  }

  // size rules
  if (division === "MS" || division === "WS") {
    if (uniq.length !== 1) {
      const label = division === "MS" ? "Men's Singles" : "Women's Singles"
      const err = new Error(`${label} requires exactly 1 player`)
      err.status = 400
      throw err
    }
    return
  }

  // doubles or mixed
  if (uniq.length !== 2) {
    const label =
      division === "MD" ? "Men's Doubles" : division === "WD" ? "Women's Doubles" : "Mixed Doubles"
    const err = new Error(`${label} requires exactly 2 players`)
    err.status = 400
    throw err
  }

  // mixed: require 1 male + 1 female
  if (division === "XD") {
    const genders = players.map((p) => String(p.gender || "")).sort().join("-")
    if (genders !== "FEMALE-MALE") {
      const err = new Error("Mixed Doubles requires one male and one female")
      err.status = 400
      throw err
    }
  }
}

/** Build the next sequenced team code under a prefix inside a transaction. */
async function ensureDivision(tx, { tournamentId, age, division, level }) {
  if (!tournamentId) return null

  let record = await tx.division.findFirst({
    where: {
      tournamentId,
      ageGroup: age,
      discipline: division,
      level,
    },
  })

  if (record) return record

  const name = `${enumToCategoryLabel(division)} ${enumToLevelLabel(level)}`
  return tx.division.create({
    data: {
      tournamentId,
      name,
      ageGroup: age,
      discipline: division,
      level,
    },
  })
}

async function createTeamWithMembers(tx, { prefix, age, division, lvl, playerIds, tournamentId }) {
  const existing = await tx.team.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  })
  const max = existing
    .map((t) => parseInt(t.code.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0)

  const next = String(max + 1).padStart(3, "0")
  const code = `${prefix}${next}`

  const team = await tx.team.create({
    data: {
      code,
      age,
      division,
      level: lvl,
      tournamentId: tournamentId ?? null,
      members: {
        create: playerIds.slice(0, 2).map((pid, idx) => ({
          slot: idx + 1,
          player: { connect: { id: pid } },
        })),
      },
    },
    include: { members: { include: { player: true }, orderBy: slotOrder } },
  })

  let registration = null
  let divisionRecord = null

  if (tournamentId) {
    divisionRecord = await ensureDivision(tx, {
      tournamentId,
      age,
      division,
      level: lvl,
    })

    if (divisionRecord) {
      registration = await tx.registration.create({
        data: {
          tournamentId,
          divisionId: divisionRecord.id,
          teamId: team.id,
          entryCode: code,
        },
      })
    }
  }

  return { team, registration, division: divisionRecord }
}

/* ================= ROUTES ================= */

// GET /api/teams
r.get("/", async (req, res) => {
  const { q, age, division, level } = req.query
  const where = {
    AND: [
      age ? { age: age } : {},
      division ? { division: division } : {},
      level ? { level: level } : {},
      q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { members: { some: { player: { name: { contains: q, mode: "insensitive" } } } } },
            ],
          }
        : {},
    ],
  }

  const teams = await prisma.team.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      members: { include: { player: true }, orderBy: slotOrder },
      registrations: true,
    },
  })

  const out = teams.map((t) => {
    const entryCode = t.registrations?.[0]?.entryCode ?? t.code
    return {
      id: t.code,
      ageGroup: enumToAgeLabel(t.age),
      category: enumToCategoryLabel(t.division),
      level: enumToLevelLabel(t.level),
      entryCode,
      tournamentId: t.tournamentId ?? undefined,
      registrations: (t.registrations ?? []).map((reg) => ({
        divisionId: reg.divisionId,
        entryCode: reg.entryCode,
      })),
      players: t.members.map((m) => m.player.name),
      timestamp: new Date(t.createdAt).getTime(),
      _dbId: t.id,
    }
  })
  res.json(out)
})

// POST /api/teams  { ageGroup, category, level, playerIds: number[] }
r.post("/", async (req, res) => {
  try {
    const { ageGroup, category, level, playerIds, tournamentId } = teamCreateInputSchema.parse(
      req.body ?? {},
    )
    const ids = playerIds

    const age = uiToAgeGroup(ageGroup)
    const division = uiToDivision(category)
    const lvl = uiToLevel(level)

    await validateDivisionAndPlayers(division, ids)

    const prefix = codePrefix(age, division, lvl)

    // Retry on rare code collision (P2002 unique on Team.code)
    const MAX_RETRIES = 3
    let attempt = 0
    let created = null
    let lastErr = null

    while (attempt < MAX_RETRIES) {
      try {
        created = await prisma.$transaction(
          async (tx) =>
            createTeamWithMembers(tx, {
              prefix,
              age,
              division,
              lvl,
              playerIds: ids,
              tournamentId: typeof tournamentId === "number" ? tournamentId : null,
            }),
          { isolationLevel: "Serializable" }
        )
        lastErr = null
        break
      } catch (e) {
        // Unique constraint on Team_code_key → try again
        if (e?.code === "P2002" && Array.isArray(e?.meta?.target) && e.meta.target.includes("code")) {
          attempt++
          lastErr = e
          continue
        }
        throw e
      }
    }

    if (!created || !created.team) {
      console.error("[teams.create] exhausted retries on code collision", lastErr)
      return sendError(res, 500, "TEAM_CREATE_CONFLICT", "Failed to create team (code conflict).")
    }

    const teamRecord = created.team
    const registrationRecord = created.registration ?? null

    const responseBody = {
      id: teamRecord.code,
      ageGroup,
      category,
      level,
      entryCode: teamRecord.code,
      tournamentId: teamRecord.tournamentId ?? undefined,
      registrations: registrationRecord
        ? [
            {
              divisionId: registrationRecord.divisionId,
              entryCode: registrationRecord.entryCode,
            },
          ]
        : [],
      players: teamRecord.members.map((m) => m.player.name),
      timestamp: new Date(teamRecord.createdAt).getTime(),
      _dbId: teamRecord.id,
    }

    if (teamRecord.tournamentId) {
      emitPublicTournamentEvent(teamRecord.tournamentId, "teams.updated", {
        action: "created",
        teamId: teamRecord.id,
        code: teamRecord.code,
      })
    }

    return res.status(201).json(responseBody)
  } catch (e) {
    if (e instanceof ZodError) {
      return sendError(res, 400, "TEAM_VALIDATION_ERROR", "Invalid team payload.", {
        issues: e.issues,
      })
    }
    // Friendly messages for common Prisma errors
    if (e?.code === "P2003") {
      // FK violation
      return sendError(res, 400, "TEAM_INVALID_PLAYERS", "Invalid playerIds (foreign key).")
    }
    if (e?.status) {
      return sendError(
        res,
        e.status,
        "TEAM_CREATE_VALIDATION_ERROR",
        e.message || "Team creation validation failed."
      )
    }
    console.error("[teams.create] error", { code: e?.code, meta: e?.meta, message: e?.message })
    return sendError(
      res,
      500,
      "TEAM_CREATE_FAILED",
      e?.message ? String(e.message) : "Failed to create team."
    )
  }
})

// PUT /api/teams/:id   (id = numeric DB id OR team code)
r.put("/:id", async (req, res) => {
  try {
    const idParam = teamIdSchema.parse(req.params.id)
    const input = teamUpdateInputSchema.parse(req.body ?? {})

    const team = await findTeamByAnyId(idParam)
    if (!team) {
      return sendError(res, 404, "TEAM_NOT_FOUND", "Team not found.")
    }

    const nextAge = input.ageGroup ? uiToAgeGroup(input.ageGroup) : team.age
    const nextDiv = input.category ? uiToDivision(input.category) : team.division
    const nextLvl = input.level ? uiToLevel(input.level) : team.level
    const nextTournamentId =
      typeof input.tournamentId === "number" ? input.tournamentId : team.tournamentId

    const ids = Array.isArray(input.playerIds) ? input.playerIds : []
    if (ids.length) await validateDivisionAndPlayers(nextDiv, ids)

    // recompute code if prefix changed
    let nextCode = team.code
    const oldPrefix = team.code.replace(/_\d+$/, "") + "_"
    const newPrefix = codePrefix(nextAge, nextDiv, nextLvl)
    if (newPrefix !== oldPrefix) {
      const existing = await prisma.team.findMany({
        where: { code: { startsWith: newPrefix } },
        select: { code: true },
      })
      const max = existing
        .map((t) => parseInt(t.code.slice(newPrefix.length), 10))
        .filter((n) => Number.isFinite(n))
        .reduce((a, b) => Math.max(a, b), 0)
      nextCode = `${newPrefix}${String(max + 1).padStart(3, "0")}`
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.team.update({
        where: { id: team.id },
        data: {
          code: nextCode,
          age: nextAge,
          division: nextDiv,
          level: nextLvl,
          tournamentId: nextTournamentId ?? null,
          members: ids.length
            ? {
                deleteMany: {},
                create: ids.slice(0, 2).map((pid, idx) => ({
                  slot: idx + 1,
                  player: { connect: { id: pid } },
                })),
              }
            : undefined,
        },
      })

      let registrationRecord = null

      if (nextTournamentId) {
        const divisionRecord = await ensureDivision(tx, {
          tournamentId: nextTournamentId,
          age: nextAge,
          division: nextDiv,
          level: nextLvl,
        })

        if (divisionRecord) {
          const existingRegistration = team.registrations?.[0] ?? null
          if (existingRegistration) {
            registrationRecord = await tx.registration.update({
              where: { id: existingRegistration.id },
              data: {
                tournamentId: nextTournamentId,
                divisionId: divisionRecord.id,
                entryCode: nextCode,
              },
            })
            if (team.registrations && team.registrations.length > 1) {
              await tx.registration.deleteMany({
                where: {
                  teamId: team.id,
                  id: { not: existingRegistration.id },
                },
              })
            }
          } else {
            registrationRecord = await tx.registration.create({
              data: {
                tournamentId: nextTournamentId,
                divisionId: divisionRecord.id,
                teamId: team.id,
                entryCode: nextCode,
              },
            })
          }
        }
      } else if (team.registrations && team.registrations.length > 0) {
        await tx.registration.deleteMany({ where: { teamId: team.id } })
      }

      const finalTeam = await tx.team.findUnique({
        where: { id: team.id },
        include: {
          members: { include: { player: true }, orderBy: slotOrder },
          registrations: true,
        },
      })

      return { team: finalTeam, registration: registrationRecord }
    })

    if (!result.team) {
      return sendError(res, 500, "TEAM_UPDATE_FAILED", "Failed to update team.")
    }

    const updated = result.team
    const registrations = updated.registrations ?? []

    const responseBody = {
      id: updated.code,
      ageGroup: input.ageGroup ?? enumToAgeLabel(updated.age),
      category: input.category ?? enumToCategoryLabel(updated.division),
      level: input.level ?? enumToLevelLabel(updated.level),
      entryCode: registrations[0]?.entryCode ?? updated.code,
      tournamentId: updated.tournamentId ?? undefined,
      registrations: registrations.map((reg) => ({
        divisionId: reg.divisionId,
        entryCode: reg.entryCode,
      })),
      players: updated.members.map((m) => m.player.name),
      timestamp: new Date(updated.createdAt).getTime(),
      _dbId: updated.id,
    }

    if (updated.tournamentId) {
      emitPublicTournamentEvent(updated.tournamentId, "teams.updated", {
        action: "updated",
        teamId: updated.id,
        code: updated.code,
      })
    }

    res.json(responseBody)
  } catch (e) {
    if (e instanceof ZodError) {
      return sendError(res, 400, "TEAM_VALIDATION_ERROR", "Invalid team payload.", {
        issues: e.issues,
      })
    }
    if (e?.code === "P2002") {
      return sendError(res, 409, "TEAM_CODE_CONFLICT", "Team code already exists.")
    }
    if (e?.code === "P2025") {
      return sendError(res, 404, "TEAM_NOT_FOUND", "Team not found.")
    }
    if (e?.status) {
      return sendError(
        res,
        e.status,
        "TEAM_UPDATE_VALIDATION_ERROR",
        e.message || "Team update validation failed."
      )
    }
    console.error("[teams.update] error", { code: e?.code, meta: e?.meta, message: e?.message })
    return sendError(
      res,
      500,
      "TEAM_UPDATE_FAILED",
      e?.message ? String(e.message) : "Failed to update team."
    )
  }
})

// DELETE /api/teams/:id  (numeric DB id or code)
r.delete("/:id", async (req, res) => {
  try {
    const idParam = teamIdSchema.parse(req.params.id)
    const team = await findTeamByAnyId(idParam)
    if (!team) {
      return sendError(res, 404, "TEAM_NOT_FOUND", "Team not found.")
    }
    await prisma.team.delete({ where: { id: team.id } })
    if (team.tournamentId) {
      emitPublicTournamentEvent(team.tournamentId, "teams.updated", {
        action: "deleted",
        teamId: team.id,
        code: team.code,
      })
    }
    res.sendStatus(204)
  } catch (e) {
    if (e instanceof ZodError) {
      return sendError(res, 400, "TEAM_INVALID_ID", "Invalid team identifier.", {
        issues: e.issues,
      })
    }
    if (e?.code === "P2025") {
      return sendError(res, 404, "TEAM_NOT_FOUND", "Team not found.")
    }
    console.error("[teams.delete] error", e)
    sendError(res, 500, "TEAM_DELETE_FAILED", "Failed to delete team.")
  }
})

/* ================= Diagnostics (temporary) ================= */
// These use Prisma’s static metadata (DMMF). Safe to keep off in prod if you prefer.
r.get("/__diag/prisma-models", (req, res) => {
  try {
    const models = Prisma?.dmmf?.datamodel?.models?.map((m) => m.name) || []
    res.json({ prismaVersion: Prisma.prismaVersion?.client, models })
  } catch (e) {
    sendError(res, 500, "TEAMS_DIAG_MODELS_FAILED", "Failed to load Prisma models.", {
      reason: e instanceof Error ? e.message : String(e),
    })
  }
})
r.get("/__diag/prisma-team", (req, res) => {
  try {
    const team = Prisma?.dmmf?.datamodel?.models?.find((m) => m.name === "Team") || null
    res.json({ prismaVersion: Prisma.prismaVersion?.client, teamModel: team })
  } catch (e) {
    sendError(res, 500, "TEAMS_DIAG_TEAM_MODEL_FAILED", "Failed to load team model metadata.", {
      reason: e instanceof Error ? e.message : String(e),
    })
  }
})

// --- Deep diagnostics: what DB am I connected to, and what tables exist? ---
r.get("/__diag/db-tables", async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    // mask DB URL but show host/db to confirm we're on the right database
    const mask = (u) => (u ? u.replace(/:\/\/.*@/, "://***:***@") : null)
    res.json({
      prismaVersion: Prisma.prismaVersion?.client,
      databaseUrl: mask(process.env.DATABASE_URL || null),
      tables: rows,
    })
  } catch (e) {
    sendError(res, 500, "TEAMS_DIAG_TABLES_FAILED", "Failed to fetch database tables.", {
      reason: e instanceof Error ? e.message : String(e),
    })
  }
})

r.get("/__diag/db-info", async (req, res) => {
  try {
    const [db] = await prisma.$queryRaw`SELECT current_database() AS db, current_user AS usr`
    const [ver] = await prisma.$queryRaw`SELECT version()`
    res.json({ dbInfo: db, version: ver?.version ?? null })
  } catch (e) {
    sendError(res, 500, "TEAMS_DIAG_INFO_FAILED", "Failed to fetch database info.", {
      reason: e instanceof Error ? e.message : String(e),
    })
  }
})

export default r
