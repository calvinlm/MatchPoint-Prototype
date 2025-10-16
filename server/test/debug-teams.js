import express from "express";
import request from "supertest";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { vi } = await import("vitest");

const teamFindMany = vi.fn().mockResolvedValue([]);
const teamCreate = vi.fn().mockResolvedValue({
  id: 201,
  code: "18MDInt_001",
  age: "A18",
  division: "MD",
  level: "INT",
  tournamentId: 77,
  createdAt: new Date("2025-03-01T10:00:00.000Z"),
  members: [
    { player: { name: "John Smith" } },
    { player: { name: "Jane Doe" } },
  ],
});
const playerFindMany = vi.fn().mockResolvedValue([
  { id: 1, gender: "MALE" },
  { id: 2, gender: "FEMALE" },
]);
const divisionFindFirst = vi.fn().mockResolvedValue(null);
const divisionCreate = vi.fn().mockResolvedValue({
  id: 55,
  tournamentId: 77,
  ageGroup: "A18",
  discipline: "MD",
  level: "INT",
  name: "Mens Doubles Intermediate",
});
const registrationCreate = vi.fn().mockResolvedValue({
  id: 999,
  tournamentId: 77,
  divisionId: 55,
  teamId: 201,
  entryCode: "18MDInt_001",
});
const prismaTransaction = vi.fn(async (callback) =>
  callback({
    team: {
      findMany: teamFindMany,
      create: teamCreate,
    },
    division: {
      findFirst: divisionFindFirst,
      create: divisionCreate,
    },
    registration: {
      create: registrationCreate,
    },
  }),
);

vi.mock("../prisma/client.js", () => ({
  default: {
    $transaction: prismaTransaction,
    team: {
      findFirst: vi.fn(),
      findMany: teamFindMany,
    },
    player: {
      findMany: playerFindMany,
    },
  },
}));

const emitPublicTournamentEvent = vi.fn();
vi.mock("../src/socket/context.js", () => ({
  emitPublicTournamentEvent,
}));

const teamsRouter = (await import("../src/routes/teams.js")).default;

const app = express().use(express.json()).use("/api/teams", teamsRouter);

const res = await request(app)
  .post("/api/teams")
  .send({
    ageGroup: "18+",
    category: "Mens Doubles",
    level: "Intermediate",
    playerIds: [1, 2],
    tournamentId: 77,
  });

console.log("status", res.status);
console.log("body", res.body);
