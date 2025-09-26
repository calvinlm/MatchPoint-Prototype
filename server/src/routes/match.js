import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Create match
router.post("/", async (req, res) => {
  const { court, format, players } = req.body;
  const match = await prisma.match.create({
    data: {
      court,
      format,
      status: "scheduled",
      players: { create: players.map(p => ({ playerId: p })) }
    },
    include: { players: true }
  });
  res.json(match);
});

// Update score
router.post("/:id/score", async (req, res) => {
  const { playerId, score } = req.body;
  await prisma.matchPlayer.updateMany({
    where: { matchId: Number(req.params.id), playerId },
    data: { score }
  });
  res.json({ message: "Score updated" });
});

// Complete match
router.post("/:id/complete", async (req, res) => {
  const match = await prisma.match.update({
    where: { id: Number(req.params.id) },
    data: { status: "completed" }
  });
  res.json(match);
});

export default router;
