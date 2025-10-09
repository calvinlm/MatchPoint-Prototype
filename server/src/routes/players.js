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
