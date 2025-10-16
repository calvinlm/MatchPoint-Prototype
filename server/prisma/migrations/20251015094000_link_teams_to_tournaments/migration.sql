-- Link teams to tournaments and update public teams view
ALTER TABLE "Team"
ADD COLUMN "tournamentId" INTEGER;

ALTER TABLE "Team"
ADD CONSTRAINT "Team_tournamentId_fkey"
FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE VIEW public_teams_v AS
SELECT
  tm.id AS team_id,
  tm.code AS team_code,
  tm."tournamentId" AS tournament_id,
  tr.slug AS tournament_slug,
  tm.age AS age_bracket,
  tm.division,
  tm.level,
  tm."createdAt" AS created_at,
  tm."updatedAt" AS updated_at,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'slot', mem.slot,
        'player_id', mem."playerId"
      )
      ORDER BY mem.slot
    ) FILTER (WHERE mem."playerId" IS NOT NULL),
    '[]'::jsonb
  ) AS roster
FROM "Team" AS tm
LEFT JOIN "Tournament" AS tr ON tr.id = tm."tournamentId"
LEFT JOIN "TeamMember" AS mem ON mem."teamId" = tm.id
GROUP BY tm.id, tr.slug;
