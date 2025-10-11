import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const router = Router()

// GET all players
router.get('/', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        teamMembers: {
          include: {
            team: true
          }
        }
      }
    })
    res.json(players)
  } catch (err) {
    console.error('Error fetching players:', err)
    res.status(500).json({ error: 'Failed to fetch players' })
  }
})

router.post("/", async (req, res) => {
  try {
    console.log("POST /api/players body:", req.body)

    const { name, gender, age, contactNumber, address, checkedIn } = req.body || {}

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Name is required" })
    }

    const data = {
      name: String(name).trim(),
      contactNumber: contactNumber ? String(contactNumber) : null,
      address: address ? String(address) : null,
      checkedIn: !!checkedIn,
    }

    // age optional -> integer if sent
    if (age !== undefined && age !== null && String(age).trim() !== "") {
      const n = Number(age)
      if (!Number.isFinite(n) || n < 0) return res.status(422).json({ error: "Invalid age" })
      data.age = Math.floor(n)
    }

    // Prisma enum Gender { MALE, FEMALE }  (adjust if your schema differs)
    if (gender !== undefined && gender !== null && String(gender).trim() !== "") {
      const g = String(gender).trim().toUpperCase()
      if (g !== "MALE" && g !== "FEMALE") {
        return res.status(422).json({ error: "Invalid gender (use MALE or FEMALE)" })
      }
      data.gender = g
    }

    const created = await prisma.player.create({ data })
    res.status(201).json(created)
  } catch (e) {
    // Prisma error decoding
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma KnownRequestError", e.code, e.meta)
      return res.status(500).json({ error: "Database error", code: e.code, meta: e.meta })
    }
    if (e instanceof Prisma.PrismaClientValidationError) {
      console.error("Prisma ValidationError", e.message)
      return res.status(400).json({ error: "Validation error", detail: e.message })
    }
    console.error("POST /api/players error:", e)
    res.status(500).json({ error: "Failed to create player" })
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
