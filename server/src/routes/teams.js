// server/routes/teams.js
import { Router } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const r = Router()

// UI → enum mappers
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
  return "ADV"
}
// For building the code prefix
function codeMaps(age, division, level) {
  const ageCode = age === "JUNIOR" ? "Jr" : age === "A18" ? "18" : age === "A35" ? "35" : "55"
  const divCode = { MS: "MS", MD: "MD", WS: "WS", WD: "WD", XD: "XD" }[division]
  const lvlCode = { NOV: "Nov", INT: "Int", ADV: "Adv" }[level]
  return `${ageCode}${divCode}${lvlCode}_`
}

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
      members: {
        include: { player: true },
        // If some old rows have slot = null, sort them first:
        orderBy: { slot: { sort: "asc", nulls: "first" } }
      }
    },
  })

  const toClient = teams.map((t) => ({
    id: t.code,
    ageGroup: t.age === "JUNIOR" ? "Junior (17 below)" : t.age === "A18" ? "18+" : t.age === "A35" ? "35+" : "55+",
    category:
      t.division === "MS"
        ? "Mens Singles"
        : t.division === "MD"
          ? "Mens Doubles"
          : t.division === "WS"
            ? "Womens Singles"
            : t.division === "WD"
              ? "Womens Doubles"
              : "Mixed Doubles",
    level: t.level === "NOV" ? "Novice" : t.level === "INT" ? "Intermediate" : "Advanced",
    players: t.members.map((m) => m.player.name),
    timestamp: new Date(t.createdAt).getTime(),
    _dbId: t.id, // internal
  }))

  res.json(toClient)
})

// POST /api/teams
// body: { ageGroup, category, level, playerIds: number[] }
r.post("/", async (req, res) => {
  const { ageGroup, category, level, playerIds } = req.body || {}
  if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
    return res.status(400).send("playerIds required")
  }

  const age = uiToAgeBracket(ageGroup)
  const division = uiToDivision(category)
  const lvl = uiToLevel(level)
  const prefix = codeMaps(age, division, lvl) // e.g., 18MDInt_

  try {
    const result = await prisma.$transaction(async (tx) => {
      // find existing with same prefix and compute max
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
            create: playerIds.slice(0, 2).map((pid, idx) => ({
              slot: idx + 1,
              player: { connect: { id: Number(pid) } },
            })),
          },
        },
        include: { members: { include: { player: true }, orderBy: { slot: { sort: "asc", nulls: "first" } } } },
      })

      return created
    }, { isolationLevel: "Serializable" })

    const out = {
      id: result.code,
      ageGroup,
      category,
      level,
      players: result.members.map((m) => m.player.name),
      timestamp: new Date(result.createdAt).getTime(),
      _dbId: result.id,
    }
    res.status(201).json(out)
  } catch (e) {
    console.error(e)
    res.status(500).send("Failed to create team")
  }
})

// PUT /api/teams/:id   (id = team.cuid db id OR code; support both)
r.put("/:id", async (req, res) => {
  const id = String(req.params.id)
  const { ageGroup, category, level, playerIds } = req.body || {}

  // resolve team by cuid or by code
  const team = await prisma.team.findFirst({
    where: { OR: [{ id }, { code: id }] },
    include: { members: true },
  })
  if (!team) return res.status(404).send("Team not found")

  const nextAge = ageGroup ? uiToAgeBracket(ageGroup) : team.age
  const nextDiv = category ? uiToDivision(category) : team.division
  const nextLvl = level ? uiToLevel(level) : team.level

  let nextCode = team.code
  const oldPrefix = team.code.replace(/_\d+$/, "") + "_"
  const newPrefix = codeMaps(nextAge, nextDiv, nextLvl)

  // If prefix changed (category/age/level changed), allocate fresh sequence
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
      members: playerIds
        ? {
            deleteMany: {},
            create: playerIds.slice(0, 2).map((pid, idx) => ({
              slot: idx + 1,
              player: { connect: { id: Number(pid) } },
            })),
          }
        : undefined,
    },
    include: { members: { include: { player: true }, orderBy: { slot: { sort: "asc", nulls: "first" } } } },
  })

  res.json({
    id: updated.code,
    ageGroup: ageGroup ?? (team.age === "JUNIOR" ? "Junior (17 below)" : team.age === "A18" ? "18+" : team.age === "A35" ? "35+" : "55+"),
    category:
      category ??
      (team.division === "MS"
        ? "Mens Singles"
        : team.division === "MD"
          ? "Mens Doubles"
          : team.division === "WS"
            ? "Womens Singles"
            : team.division === "WD"
              ? "Womens Doubles"
              : "Mixed Doubles"),
    level: level ?? (team.level === "NOV" ? "Novice" : team.level === "INT" ? "Intermediate" : "Advanced"),
    players: updated.members.map((m) => m.player.name),
    timestamp: new Date(updated.createdAt).getTime(),
    _dbId: updated.id,
  })
})

// DELETE /api/teams/:id (cuid or code)
r.delete("/:id", async (req, res) => {
  const id = String(req.params.id)
  const team = await prisma.team.findFirst({ where: { OR: [{ id }, { code: id }] } })
  if (!team) return res.status(404).send("Team not found")
  await prisma.team.delete({ where: { id: team.id } })
  res.sendStatus(204)
})

export default r
