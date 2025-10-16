-- Schema realignment per TD v1 data model

-- 1) New enums
CREATE TYPE "AgeGroup" AS ENUM ('JUNIOR', 'A18', 'A35', 'A50');
CREATE TYPE "DivisionType" AS ENUM ('MS', 'MD', 'WS', 'WD', 'XD');

-- 2) Update Team enum columns
ALTER TABLE "Team"
  ALTER COLUMN "age" TYPE "AgeGroup"
  USING (
    CASE
      WHEN "age"::text = 'A55' THEN 'A50'::"AgeGroup"
      ELSE "age"::text::"AgeGroup"
    END
  );

ALTER TABLE "Team"
  ALTER COLUMN "division" TYPE "DivisionType"
  USING "division"::text::"DivisionType";

-- 3) Tournament additions
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "plannedCourtCount" INTEGER;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "kioskToken" TEXT;
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_kioskToken_key" UNIQUE ("kioskToken");

-- 4) New Division table
CREATE TABLE "Division" (
  "id" SERIAL PRIMARY KEY,
  "tournamentId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "ageGroup" "AgeGroup" NOT NULL,
  "discipline" "DivisionType" NOT NULL,
  "level" "Level" NOT NULL,
  "format" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Division_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Division_tournamentId_ageGroup_discipline_level_idx"
  ON "Division"("tournamentId", "ageGroup", "discipline", "level");

-- 5) New Court table
CREATE TABLE "Court" (
  "id" SERIAL PRIMARY KEY,
  "tournamentId" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Court_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Court_tournamentId_label_key"
  ON "Court"("tournamentId", "label");

-- 6) Registration table (team entries per division)
CREATE TABLE "Registration" (
  "id" SERIAL PRIMARY KEY,
  "tournamentId" INTEGER NOT NULL,
  "divisionId" INTEGER NOT NULL,
  "teamId" INTEGER NOT NULL,
  "entryCode" TEXT NOT NULL,
  "seedNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Registration_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Registration_divisionId_fkey"
    FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Registration_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Registration_divisionId_teamId_key"
  ON "Registration"("divisionId", "teamId");

CREATE UNIQUE INDEX "Registration_divisionId_entryCode_key"
  ON "Registration"("divisionId", "entryCode");

CREATE INDEX "Registration_tournamentId_entryCode_idx"
  ON "Registration"("tournamentId", "entryCode");

-- 7) Remove legacy Category/BracketGroup references before altering tables
ALTER TABLE "QueueItem" DROP CONSTRAINT IF EXISTS "QueueItem_groupId_fkey";
DROP INDEX IF EXISTS "QueueItem_groupId_position_idx";

ALTER TABLE "Bracket" DROP CONSTRAINT IF EXISTS "Bracket_categoryId_fkey";
ALTER TABLE "Bracket" DROP CONSTRAINT IF EXISTS "Bracket_groupId_fkey";
DROP INDEX IF EXISTS "Bracket_tournamentId_categoryId_idx";

-- 8) Bracket realignment
ALTER TABLE "Bracket" DROP COLUMN IF EXISTS "groupId";
ALTER TABLE "Bracket" DROP COLUMN IF EXISTS "categoryId";
ALTER TABLE "Bracket" DROP COLUMN IF EXISTS "size";
ALTER TABLE "Bracket" RENAME COLUMN "format" TO "type";

ALTER TABLE "Bracket"
  ADD COLUMN IF NOT EXISTS "divisionId" INTEGER,
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "config" JSONB,
  ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Bracket"
  ADD CONSTRAINT "Bracket_divisionId_fkey"
    FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Bracket_tournamentId_divisionId_idx"
  ON "Bracket"("tournamentId", "divisionId");

-- 9) Queue updates (remove group, type-safe court reference)
ALTER TABLE "QueueItem" DROP COLUMN IF EXISTS "groupId";

ALTER TABLE "QueueItem"
  ALTER COLUMN "courtId" TYPE INTEGER
  USING (
    CASE
      WHEN "courtId" IS NULL THEN NULL
      WHEN trim("courtId") ~ '^[0-9]+$' THEN trim("courtId")::INTEGER
      ELSE NULL
    END
  );

ALTER TABLE "QueueItem"
  ADD CONSTRAINT "QueueItem_courtId_fkey"
    FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "QueueItem_tournamentId_position_idx"
  ON "QueueItem"("tournamentId", "position");

-- 10) Match updates (court relation + metadata)
ALTER TABLE "Match"
  ALTER COLUMN "courtId" TYPE INTEGER
  USING (
    CASE
      WHEN "courtId" IS NULL THEN NULL
      WHEN trim("courtId") ~ '^[0-9]+$' THEN trim("courtId")::INTEGER
      ELSE NULL
    END
  );

ALTER TABLE "Match"
  ADD COLUMN IF NOT EXISTS "meta" JSONB;

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_courtId_fkey"
    FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 11) Standing table (quotient-aware rankings)
CREATE TABLE "Standing" (
  "id" SERIAL PRIMARY KEY,
  "tournamentId" INTEGER NOT NULL,
  "bracketId" INTEGER NOT NULL,
  "teamId" INTEGER NOT NULL,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "pointsFor" INTEGER NOT NULL DEFAULT 0,
  "pointsAgainst" INTEGER NOT NULL DEFAULT 0,
  "quotient" DECIMAL(10,4) NOT NULL DEFAULT 0,
  "rank" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Standing_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Standing_bracketId_fkey"
    FOREIGN KEY ("bracketId") REFERENCES "Bracket"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Standing_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Standing_bracketId_teamId_key"
  ON "Standing"("bracketId", "teamId");

CREATE INDEX "Standing_teamId_idx"
  ON "Standing"("teamId");

-- 12) Drop obsolete tables and enums
DROP TABLE IF EXISTS "BracketGroup";
DROP TABLE IF EXISTS "Category";

DROP TYPE IF EXISTS "AgeBracket";
DROP TYPE IF EXISTS "Division";
