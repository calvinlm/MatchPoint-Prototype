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
    const { name, gender, age, contactNumber, address, checkedIn } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" })
    }

    const data = {
      name: name.trim(),
      contactNumber: contactNumber || null,
      address: address || null,
      checkedIn: !!checkedIn,
    }

    if (Number.isFinite(Number(age))) data.age = Number(age)

    // If your Prisma enum is Gender { MALE, FEMALE }, keep uppercase
    if (typeof gender === "string") {
      const g = gender.trim().toUpperCase()
      if (g === "MALE" || g === "FEMALE") data.gender = g
    }

    const created = await prisma.player.create({ data })
    res.status(201).json(created)
  } catch (e) {
    console.error("POST /api/players error:", e)
    // Prisma validation errors will land here too
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
