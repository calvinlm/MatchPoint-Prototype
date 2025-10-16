import { vi } from "vitest";

export const teamFindMany = vi.fn();
export const teamCreate = vi.fn();
export const playerFindMany = vi.fn();
export const divisionFindFirst = vi.fn();
export const divisionCreate = vi.fn();
export const registrationCreate = vi.fn();
export const prismaTransaction = vi.fn(async (callback) =>
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

export const prismaMock = {
  $transaction: prismaTransaction,
  team: {
    findFirst: vi.fn(),
    findMany: teamFindMany,
  },
  player: {
    findMany: playerFindMany,
  },
};

export default prismaMock;
