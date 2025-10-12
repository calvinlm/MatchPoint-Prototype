-- Drop foreign key from Team to Category if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Team_categoryId_fkey'
  ) THEN
    ALTER TABLE "Team" DROP CONSTRAINT "Team_categoryId_fkey";
  END IF;
END $$;

-- Drop unique/indexes referencing old columns if present
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Category_ageBracket_division_level_key') THEN
    DROP INDEX "Category_ageBracket_division_level_key";
  END IF;
END $$;

-- Drop old columns on Team if they exist and add the new ones if missing
ALTER TABLE "Team"
  DROP COLUMN IF EXISTS "categoryId",
  DROP COLUMN IF EXISTS "ordinal",
  DROP COLUMN IF EXISTS "teamCode",
  ADD COLUMN IF NOT EXISTS "code" TEXT,
  ADD COLUMN IF NOT EXISTS "age" "AgeBracket",
  ADD COLUMN IF NOT EXISTS "division" "Division",
  ADD COLUMN IF NOT EXISTS "level" "Level",
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- Make code required & unique (only if table already has data; ensure values filled first)
UPDATE "Team" SET "code" = 'TEMP_' || id WHERE "code" IS NULL;
ALTER TABLE "Team" ALTER COLUMN "code" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Team_code_key') THEN
    CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");
  END IF;
END $$;

-- Drop Category table if it exists
DROP TABLE IF EXISTS "Category";
