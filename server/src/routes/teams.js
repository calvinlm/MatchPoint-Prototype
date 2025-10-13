// server/routes/teams.js
import { Router } from "express"
import { Prisma, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const r = Router()

/* ================= MAPPERS ================= */
function uiToAgeBracket(ageGroup) {
  if (ageGroup === "Junior (17 below)") return "JUNIOR"
  if (ageGroup === "18+") return "A18"
  if (ageGroup === "35+") return "A35"
  return "A55"
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
  return a === "JUNIOR" ? "Junior (17 below)" : a === "A18" ? "18+" : a === "A35" ? "35+" : "55+"
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
  const ageCode = age === "JUNIOR" ? "Jr" : age === "A18" ? "18" : age === "A35" ? "35" : "55"
  const divCode = { MS: "MS", MD: "MD", WS: "WS", WD: "WD", XD: "XD" }[division]
  const lvlCode = { NOV: "Nov", INT: "Int", ADV: "Adv", OPN: "Opn" }[level]
  return `${ageCode}${divCode}${lvlCode}_`
}

/* ================= HELPERS ================= */
const slotOrder = { slot: { sort: "asc", nulls: "first" } }

function parsePlayerIds(playerIds) {
  return (Array.isArray(playerIds) ? playerIds : [])
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
}

/** Resolve a team by numeric DB id or by code string. */
async function findTeamByAnyId(idOrCode) {
  const asNum = Number(idOrCode)
  const where =
    Number.isFinite(asNum) && String(asNum) === String(idOrCode)
      ? { id: asNum }
      : { code: String(idOrCode) }
  return prisma.team.findFirst({ where, include: { members: true } })
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
async function createTeamWithMembers(tx, { prefix, age, division, lvl, playerIds }) {
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

  return tx.team.create({
    data: {
      code,
      age,
      division,
      level: lvl,
      members: {
        create: playerIds.slice(0, 2).map((pid, idx) => ({
          slot: idx + 1,
          player: { connect: { id: pid } },
        })),
      },
    },
    include: { members: { include: { player: true }, orderBy: slotOrder } },
  })
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
    include: { members: { include: { player: true }, orderBy: slotOrder } },
  })

  const out = teams.map((t) => ({
    id: t.code,
    ageGroup: enumToAgeLabel(t.age),
    category: enumToCategoryLabel(t.division),
    level: enumToLevelLabel(t.level),
    players: t.members.map((m) => m.player.name),
    timestamp: new Date(t.createdAt).getTime(),
    _dbId: t.id,
  }))
  res.json(out)
})

// POST /api/teams  { ageGroup, category, level, playerIds: number[] }
r.post("/", async (req, res) => {
  const { ageGroup, category, level, playerIds } = req.body || {}
  const ids = parsePlayerIds(playerIds)
  if (ids.length === 0) return res.status(400).send("playerIds required")

  const age = uiToAgeBracket(ageGroup)
  const division = uiToDivision(category)
  const lvl = uiToLevel(level)

  try {
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
          (tx) => createTeamWithMembers(tx, { prefix, age, division, lvl, playerIds: ids }),
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

    if (!created) {
      console.error("[teams.create] exhausted retries on code collision", lastErr)
      return res.status(500).send("Failed to create team (code conflict)")
    }

    return res.status(201).json({
      id: created.code,
      ageGroup,
      category,
      level,
      players: created.members.map((m) => m.player.name),
      timestamp: new Date(created.createdAt).getTime(),
      _dbId: created.id,
    })
  } catch (e) {
    // Friendly messages for common Prisma errors
    if (e?.code === "P2003") {
      // FK violation
      return res.status(400).send("Invalid playerIds (foreign key)")
    }
    if (e?.status) {
      return res.status(e.status).send(e.message)
    }
    console.error("[teams.create] error", { code: e?.code, meta: e?.meta, message: e?.message })
    return res.status(500).send(e?.message || "Failed to create team")
  }
})

// PUT /api/teams/:id   (id = numeric DB id OR team code)
r.put("/:id", async (req, res) => {
  try {
    const idParam = String(req.params.id)
    const { ageGroup, category, level, playerIds } = req.body || {}

    const team = await findTeamByAnyId(idParam)
    if (!team) return res.status(404).send("Team not found")

    const nextAge = ageGroup ? uiToAgeBracket(ageGroup) : team.age
    const nextDiv = category ? uiToDivision(category) : team.division
    const nextLvl = level ? uiToLevel(level) : team.level

    const ids = parsePlayerIds(playerIds)
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

    const updated = await prisma.team.update({
      where: { id: team.id },
      data: {
        code: nextCode,
        age: nextAge,
        division: nextDiv,
        level: nextLvl,
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
      include: { members: { include: { player: true }, orderBy: slotOrder } },
    })

    res.json({
      id: updated.code,
      ageGroup: ageGroup ?? enumToAgeLabel(team.age),
      category: category ?? enumToCategoryLabel(team.division),
      level: level ?? enumToLevelLabel(team.level),
      players: updated.members.map((m) => m.player.name),
      timestamp: new Date(updated.createdAt).getTime(),
      _dbId: updated.id,
    })
  } catch (e) {
    if (e?.code === "P2002") {
      return res.status(409).send("Team code already exists")
    }
    if (e?.status) {
      return res.status(e.status).send(e.message)
    }
    console.error("[teams.update] error", { code: e?.code, meta: e?.meta, message: e?.message })
    res.status(500).send(e?.message || "Failed to update team")
  }
})

// DELETE /api/teams/:id  (numeric DB id or code)
r.delete("/:id", async (req, res) => {
  try {
    const idParam = String(req.params.id)
    const team = await findTeamByAnyId(idParam)
    if (!team) return res.status(404).send("Team not found")
    await prisma.team.delete({ where: { id: team.id } })
    res.sendStatus(204)
  } catch (e) {
    console.error("[teams.delete] error", e)
    res.status(500).send("Failed to delete team")
  }
})

/* ================= Diagnostics (temporary) ================= */
// These use Prisma’s static metadata (DMMF). Safe to keep off in prod if you prefer.
r.get("/__diag/prisma-models", (req, res) => {
  try {
    const models = Prisma?.dmmf?.datamodel?.models?.map((m) => m.name) || []
    res.json({ prismaVersion: Prisma.prismaVersion?.client, models })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
r.get("/__diag/prisma-team", (req, res) => {
  try {
    const team = Prisma?.dmmf?.datamodel?.models?.find((m) => m.name === "Team") || null
    res.json({ prismaVersion: Prisma.prismaVersion?.client, teamModel: team })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

export default r
