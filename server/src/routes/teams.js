// server/routes/teams.js
import { Router } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const r = Router()

/* ===== Mappers ===== */
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
function codePrefix(age, division, level) {
  const ageCode = age === "JUNIOR" ? "Jr" : age === "A18" ? "18" : age === "A35" ? "35" : "55"
  const divCode = { MS: "MS", MD: "MD", WS: "WS", WD: "WD", XD: "XD" }[division]
  const lvlCode = { NOV: "Nov", INT: "Int", ADV: "Adv", OPN: "Opn" }[level]
  return `${ageCode}${divCode}${lvlCode}_` // e.g., 18MDInt_
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

/* ===== Helpers ===== */
const slotOrder = { slot: { sort: "asc", nulls: "first" } }

function parsePlayerIds(playerIds) {
  return (Array.isArray(playerIds) ? playerIds : [])
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
}

/** Resolve a team by numeric DB id or by code string. Returns null if not found. */
async function findTeamByAnyId(idOrCode) {
  const asNum = Number(idOrCode)
  const where =
    Number.isFinite(asNum) && String(asNum) === String(idOrCode)
      ? { id: asNum }
      : { code: String(idOrCode) }
  return prisma.team.findFirst({ where, include: { members: true } })
}

/** Validate Singles/Doubles/Mixed constraints based on division. Throws 400 on violation. */
async function validateDivisionAndPlayers(division, playerIds) {
  if (division === "MS" || division === "WS") {
    if (playerIds.length !== 1) {
      const label = division === "MS" ? "Men's Singles" : "Women's Singles"
      const msg = `${label} requires exactly 1 player`
      const err = new Error(msg)
      err.status = 400
      throw err
    }
    return
  }

  // Doubles or Mixed
  if (playerIds.length !== 2) {
    const label =
      division === "MD" ? "Men's Doubles" : division === "WD" ? "Women's Doubles" : "Mixed Doubles"
    const err = new Error(`${label} requires exactly 2 players`)
    err.status = 400
    throw err
  }

  if (division === "XD") {
    // Mixed: one male + one female
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, gender: true },
    })
    if (players.length !== 2) {
      const err = new Error("Invalid players")
      err.status = 400
      throw err
    }
    const genders = players.map((p) => String(p.gender || "")).sort().join("-")
    if (genders !== "FEMALE-MALE") {
      const err = new Error("Mixed Doubles requires one male and one female")
      err.status = 400
      throw err
    }
  }
}

/* ===== Routes ===== */

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
    },
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
  try {
    const { ageGroup, category, level, playerIds } = req.body || {}
    const ids = parsePlayerIds(playerIds)
    if (ids.length === 0) return res.status(400).send("playerIds required")

    const age = uiToAgeBracket(ageGroup)
    const division = uiToDivision(category)
    const lvl = uiToLevel(level)

    await validateDivisionAndPlayers(division, ids)

    const prefix = codePrefix(age, division, lvl)

    const result = await prisma.$transaction(
      async (tx) => {
        // largest sequence for this prefix
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

        const created = await tx.team.create({
          data: {
            code,
            age,
            division,
            level: lvl,
            members: {
              create: ids.slice(0, 2).map((pid, idx) => ({
                slot: idx + 1,
                player: { connect: { id: pid } },
              })),
            },
          },
          include: { members: { include: { player: true }, orderBy: slotOrder } },
        })

        return created
      },
      { isolationLevel: "Serializable" }
    )

    res.status(201).json({
      id: result.code,
      ageGroup,
      category,
      level,
      players: result.members.map((m) => m.player.name),
      timestamp: new Date(result.createdAt).getTime(),
      _dbId: result.id,
    })
  } catch (e) {
    console.error(e)
    res.status(e.status || 500).send(e.message || "Failed to create team")
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
    if (ids.length) {
      await validateDivisionAndPlayers(nextDiv, ids)
    }

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
    console.error(e)
    res.status(e.status || 500).send(e.message || "Failed to update team")
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
    console.error(e)
    res.status(500).send("Failed to delete team")
  }
})

export default r
