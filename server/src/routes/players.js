import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { ZodError } from 'zod'
import { sendError } from '../utils/http.js'
import {
  playerCreateInputSchema,
  playerUpdateInputSchema,
  playerIdSchema,
  playerListSchema,
} from '../../../packages/types/player.js'
const prisma = new PrismaClient()
const router = Router()
// sanity pings
router.get("/_ping", (_req, res) => res.json({ ok: true }))

// GET /api/players
router.get("/", async (_req, res) => {
  try {
    const players = await prisma.player.findMany({ orderBy: { name: "asc" } })
    const payload = playerListSchema.parse(players)
    res.json(payload)
  } catch (e) {
    if (e instanceof ZodError) {
      return sendError(res, 500, "PLAYERS_LIST_SHAPE_INVALID", "Player data failed validation.", {
        issues: e.issues,
      })
    }
    console.error("GET /api/players", e)
    sendError(res, 500, "PLAYERS_LIST_FAILED", "Failed to load players.")
  }
})

// POST /api/players
router.post("/", async (req, res) => {
  try {
    const { name, age, gender, address, contactNumber, checkedIn } = playerCreateInputSchema.parse(
      req.body ?? {},
    )
    const created = await prisma.player.create({
      data: {
        name,
        age,
        gender,
        address,
        contactNumber,
        checkedIn: checkedIn ?? false,
      },
    })
    res.status(201).json(created)
  } catch (e) {
    if (e instanceof ZodError) {
      return sendError(res, 400, "PLAYER_VALIDATION_ERROR", "Invalid player payload.", {
        issues: e.issues,
      })
    }
    console.error("POST /api/players", e)
    sendError(res, 500, "PLAYER_CREATE_FAILED", "Failed to create player.")
  }
})

// PUT /api/players/:id
router.put("/:id", async (req, res) => {
  try {
    const id = playerIdSchema.parse(req.params.id)
    const parsed = playerUpdateInputSchema.parse(req.body ?? {})
    const data = {}

    if (parsed.name !== undefined) data.name = parsed.name
    if (parsed.age !== undefined) data.age = parsed.age
    if (parsed.gender !== undefined) data.gender = parsed.gender
    if (parsed.address !== undefined) data.address = parsed.address
    if (parsed.contactNumber !== undefined) data.contactNumber = parsed.contactNumber
    if (parsed.checkedIn !== undefined) data.checkedIn = parsed.checkedIn

    const updated = await prisma.player.update({ where: { id }, data })
    res.json(updated)
  } catch (e) {
    if (e instanceof ZodError) {
      return sendError(res, 400, "PLAYER_VALIDATION_ERROR", "Invalid player payload.", {
        issues: e.issues,
      })
    }
    if (e?.code === "P2025") {
      return sendError(res, 404, "PLAYER_NOT_FOUND", "Player not found.")
    }
    console.error("PUT /api/players/:id", e)
    sendError(res, 500, "PLAYER_UPDATE_FAILED", "Failed to update player.")
  }
})

// DELETE /api/players/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = playerIdSchema.parse(req.params.id)
    await prisma.player.delete({ where: { id } })
    res.status(204).send()
  } catch (e) {
    if (e instanceof ZodError) {
      return sendError(res, 400, "PLAYER_INVALID_ID", "Invalid player ID.", {
        issues: e.issues,
      })
    }
    if (e?.code === "P2025") {
      return sendError(res, 404, "PLAYER_NOT_FOUND", "Player not found.")
    }
    console.error("DELETE /api/players/:id", e)
    sendError(res, 500, "PLAYER_DELETE_FAILED", "Failed to delete player.")
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
    sendError(res, 500, "PLAYERS_TEAMS_FETCH_FAILED", "Failed to fetch teams for players.")
  }
})

export default router
