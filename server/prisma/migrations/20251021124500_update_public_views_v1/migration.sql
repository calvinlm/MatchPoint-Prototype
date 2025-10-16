-- Refresh public read-only views to align with Division-based schema

-- Drop existing views to avoid dependency issues
DROP VIEW IF EXISTS public_matches_v;
DROP VIEW IF EXISTS public_brackets_v;
DROP VIEW IF EXISTS public_standings_v;
DROP VIEW IF EXISTS public_teams_v;

CREATE OR REPLACE VIEW public_matches_v AS
SELECT
  m.id                  AS match_id,
  t.id                  AS tournament_id,
  t.slug                AS tournament_slug,
  b.id                  AS bracket_id,
  b."divisionId"        AS division_id,
  d.name                AS division_name,
  d."ageGroup"          AS division_age_group,
  d.discipline          AS division_discipline,
  d.level               AS division_level,
  m.round,
  m."matchNumber"       AS match_number,
  m.status,
  m."scheduledAt"       AS scheduled_at,
  m."courtId"           AS court_id,
  m."scoreJson"         AS score_json,
  m.meta                AS meta,
  m."updatedAt"         AS updated_at
FROM "Match" AS m
JOIN "Bracket" AS b ON b.id = m."bracketId"
JOIN "Tournament" AS t ON t.id = b."tournamentId"
LEFT JOIN "Division" AS d ON d.id = b."divisionId";

CREATE OR REPLACE VIEW public_brackets_v AS
SELECT
  b.id            AS bracket_id,
  t.id            AS tournament_id,
  t.slug          AS tournament_slug,
  b."divisionId"  AS division_id,
  d.name          AS division_name,
  d."ageGroup"    AS division_age_group,
  d.discipline    AS division_discipline,
  d.level         AS division_level,
  b.type          AS bracket_type,
  b.config        AS bracket_config,
  b.locked        AS locked,
  b."createdAt"   AS created_at,
  b."updatedAt"   AS updated_at
FROM "Bracket" AS b
JOIN "Tournament" AS t ON t.id = b."tournamentId"
LEFT JOIN "Division" AS d ON d.id = b."divisionId";

CREATE OR REPLACE VIEW public_standings_v AS
SELECT
  t.id            AS tournament_id,
  t.slug          AS tournament_slug,
  d.id            AS division_id,
  d.name          AS division_name,
  d."ageGroup"    AS division_age_group,
  d.discipline    AS division_discipline,
  d.level         AS division_level,
  b.id            AS bracket_id,
  b.type          AS bracket_type,
  COALESCE(
    jsonb_build_object(
      'matchesTotal', COUNT(m.id),
      'matchesCompleted', COUNT(*) FILTER (WHERE m.status = 'COMPLETED'),
      'matchesInProgress', COUNT(*) FILTER (WHERE m.status = 'IN_PROGRESS'),
      'matchesReady', COUNT(*) FILTER (WHERE m.status = 'READY')
    ),
    jsonb_build_object(
      'matchesTotal', 0,
      'matchesCompleted', 0,
      'matchesInProgress', 0,
      'matchesReady', 0
    )
  )                AS match_summary,
  MAX(s.quotient)  AS quotient,
  MAX(m."updatedAt") AS last_activity_at
FROM "Bracket" AS b
JOIN "Tournament" AS t ON t.id = b."tournamentId"
LEFT JOIN "Division" AS d ON d.id = b."divisionId"
LEFT JOIN "Match" AS m ON m."bracketId" = b.id
LEFT JOIN "Standing" AS s ON s."bracketId" = b.id
GROUP BY
  t.id,
  t.slug,
  d.id,
  d.name,
  d."ageGroup",
  d.discipline,
  d.level,
  b.id,
  b.type;

CREATE OR REPLACE VIEW public_teams_v AS
WITH entry_codes AS (
  SELECT
    r."teamId" AS team_id,
    jsonb_agg(
      jsonb_build_object(
        'divisionId', r."divisionId",
        'entryCode', r."entryCode"
      )
      ORDER BY r."createdAt"
    ) AS registrations
  FROM "Registration" AS r
  GROUP BY r."teamId"
)
SELECT
  tm.id            AS team_id,
  tm.code          AS team_code,
  tm."tournamentId" AS tournament_id,
  t.slug           AS tournament_slug,
  tm.age           AS age_group,
  tm.division      AS discipline,
  tm.level         AS level,
  tm."createdAt"   AS created_at,
  tm."updatedAt"   AS updated_at,
  COALESCE(ec.registrations, '[]'::jsonb) AS registrations,
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
LEFT JOIN "TeamMember" AS mem ON mem."teamId" = tm.id
LEFT JOIN "Tournament" AS t ON t.id = tm."tournamentId"
LEFT JOIN entry_codes AS ec ON ec.team_id = tm.id
GROUP BY tm.id, t.slug, ec.registrations;

-- Refresh RLS grants for the updated table set
DO
$$
DECLARE
  tbl text;
  policy_name text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'Player',
      'Team',
      'TeamMember',
      'Tournament',
      'Division',
      'Registration',
      'Bracket',
      'Match',
      'QueueItem',
      'Standing',
      'Notification',
      'PublicSettings',
      'Court'
    ])
  LOOP
    policy_name := format('rls_public_select_%s', lower(tbl));

    EXECUTE format('REVOKE ALL ON TABLE "%s" FROM PUBLIC;', tbl);

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE "%s" FROM anon;', tbl);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE "%s" FROM authenticated;', tbl);
    END IF;

    EXECUTE format('ALTER TABLE "%s" ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE "%s" FORCE ROW LEVEL SECURITY;', tbl);

    EXECUTE format('DROP POLICY IF EXISTS %I ON "%s";', policy_name, tbl);
    EXECUTE format(
      'CREATE POLICY %I ON "%s" FOR SELECT USING (current_user IN (''anon'',''authenticated'',''service_role''));',
      policy_name,
      tbl
    );
  END LOOP;
END
$$;

-- Ensure anon/authenticated roles can read the refreshed views
DO
$$
DECLARE
  view_name text;
  role_name text;
BEGIN
  FOR view_name IN
    SELECT unnest(ARRAY[
      'public_matches_v',
      'public_brackets_v',
      'public_standings_v',
      'public_teams_v'
    ])
  LOOP
    FOR role_name IN SELECT unnest(ARRAY['anon', 'authenticated']) LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('GRANT SELECT ON %I.%I TO %I;', 'public', view_name, role_name);
      END IF;
    END LOOP;
  END LOOP;
END
$$;
