import express from "express";
import prisma from "../../prisma/client.js"; // adjust the path to your prisma client

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        category: true,
        members: { include: { player: true } },
      },
      orderBy: [{ categoryId: "asc" }, { ordinal: "asc" }],
    });
    res.json(teams);
  } catch (err) {
    console.error("GET /teams error:", err);
    res.status(500).json({ error: "Failed to fetch teams." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { categoryId } = req.body;
    if (!categoryId) return res.status(400).json({ error: "categoryId required" });

    const team = await prisma.team.create({
      data: { categoryId: Number(categoryId) },
      include: { category: true },
    });
    res.status(201).json(team);
  } catch (err) {
    console.error("POST /teams error:", err);
    res.status(500).json({ error: "Failed to create team." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { categoryId } = req.body;
    const updated = await prisma.team.update({
      where: { id },
      data: { categoryId: Number(categoryId) },
      include: { category: true },
    });
    res.json(updated);
  } catch (err) {
    console.error("PUT /teams error:", err);
    res.status(500).json({ error: "Failed to update team." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.team.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error("DELETE /teams error:", err);
    res.status(500).json({ error: "Failed to delete team." });
  }
});

export default router;
