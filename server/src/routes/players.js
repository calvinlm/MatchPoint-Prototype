import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const router = Router()
// sanity pings
router.get("/_ping", (_req, res) => res.json({ ok: true }))

// GET /api/players
router.get("/", async (_req, res) => {
  try {
    const players = await prisma.player.findMany({ orderBy: { name: "asc" } })
    res.json(players)
  } catch (e) {
    console.error("GET /api/players", e)
    res.status(500).json({ error: "Failed to load players" })
  }
})

// POST /api/players
router.post("/", async (req, res) => {
  try {
    const { name, age, gender, address, contactNumber, checkedIn } = req.body || {}
    if (!name || !age || !gender || !address || !contactNumber) {
      return res.status(400).json({ error: "Missing required fields" })
    }
    const created = await prisma.player.create({
      data: {
        name: String(name).trim(),
        age: Number(age),
        gender: String(gender).toUpperCase(),  // MALE | FEMALE
        address: String(address).trim(),
        contactNumber: String(contactNumber).trim(),
        checkedIn: !!checkedIn,
      },
    })
    res.status(201).json(created)
  } catch (e) {
    console.error("POST /api/players", e)
    res.status(500).json({ error: "Failed to create player" })
  }
})

// PUT /api/players/:id
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid player ID" })

    const { name, age, gender, address, contactNumber, checkedIn } = req.body || {}
    const data = {}
    if (name != null) data.name = String(name).trim()
    if (age != null && Number.isFinite(Number(age))) data.age = Number(age)
    if (gender != null) data.gender = String(gender).toUpperCase()
    if (address != null) data.address = String(address).trim()
    if (contactNumber != null) data.contactNumber = String(contactNumber).trim()
    if (typeof checkedIn === "boolean") data.checkedIn = checkedIn

    const updated = await prisma.player.update({ where: { id }, data })
    res.json(updated)
  } catch (e) {
    console.error("PUT /api/players/:id", e)
    res.status(500).json({ error: "Failed to update player" })
  }
})

// DELETE /api/players/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid player ID" })
    await prisma.player.delete({ where: { id } })
    res.status(204).send()
  } catch (e) {
    console.error("DELETE /api/players/:id", e)
    res.status(500).json({ error: "Failed to delete player" })
  }
})

// (optional) GET all teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: { player: true }
        },
        category: true
      }
    })
    res.json(teams)
  } catch (err) {
    console.error('Error fetching teams:', err)
    res.status(500).json({ error: 'Failed to fetch teams' })
  }
})

export default router
