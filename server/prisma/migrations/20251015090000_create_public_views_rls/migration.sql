-- Create read-only public views for tournament data
CREATE OR REPLACE VIEW public_matches_v AS
SELECT
  m.id AS match_id,
  t.id AS tournament_id,
  t.slug AS tournament_slug,
  b.id AS bracket_id,
  b."categoryId" AS category_id,
  m.round,
  m."matchNumber" AS match_number,
  m.status,
  m."scheduledAt" AS scheduled_at,
  m."courtId" AS court_id,
  m."scoreJson" AS score_json,
  m."updatedAt" AS updated_at
FROM "Match" AS m
JOIN "Bracket" AS b ON b.id = m."bracketId"
JOIN "Tournament" AS t ON t.id = b."tournamentId";

CREATE OR REPLACE VIEW public_brackets_v AS
SELECT
  b.id AS bracket_id,
  t.id AS tournament_id,
  t.slug AS tournament_slug,
  b."categoryId" AS category_id,
  c.name AS category_name,
  c.age AS category_age,
  c.division AS category_division,
  c.level AS category_level,
  b."groupId" AS group_id,
  g.name AS group_name,
  b.format AS bracket_format,
  b.size AS bracket_size,
  b."createdAt" AS created_at,
  b."updatedAt" AS updated_at
FROM "Bracket" AS b
JOIN "Tournament" AS t ON t.id = b."tournamentId"
LEFT JOIN "Category" AS c ON c.id = b."categoryId"
LEFT JOIN "BracketGroup" AS g ON g.id = b."groupId";

CREATE OR REPLACE VIEW public_standings_v AS
SELECT
  t.id AS tournament_id,
  t.slug AS tournament_slug,
  c.id AS category_id,
  c.name AS category_name,
  c.age AS category_age,
  c.division AS category_division,
  c.level AS category_level,
  b.id AS bracket_id,
  b.format AS bracket_format,
  COALESCE(
    jsonb_build_object(
      'matches_total', COUNT(m.id),
      'matches_completed', COUNT(*) FILTER (WHERE m.status = 'COMPLETED'),
      'matches_in_progress', COUNT(*) FILTER (WHERE m.status = 'IN_PROGRESS'),
      'matches_ready', COUNT(*) FILTER (WHERE m.status = 'READY')
    ),
    jsonb_build_object(
      'matches_total', 0,
      'matches_completed', 0,
      'matches_in_progress', 0,
      'matches_ready', 0
    )
  ) AS match_summary,
  MAX(m."updatedAt") AS last_activity_at
FROM "Bracket" AS b
JOIN "Tournament" AS t ON t.id = b."tournamentId"
LEFT JOIN "Category" AS c ON c.id = b."categoryId"
LEFT JOIN "Match" AS m ON m."bracketId" = b.id
GROUP BY
  t.id,
  t.slug,
  c.id,
  c.name,
  c.age,
  c.division,
  c.level,
  b.id,
  b.format;

CREATE OR REPLACE VIEW public_teams_v AS
SELECT
  tm.id AS team_id,
  tm.code AS team_code,
  tm.age AS age_bracket,
  tm.division,
  tm.level,
  tm."createdAt" AS created_at,
  tm."updatedAt" AS updated_at,
  COALESCE(
    jsonb_agg(jsonb_build_object(
        'slot', mem.slot,
        'player_id', mem."playerId"
      ) ORDER BY mem.slot) FILTER (WHERE mem."playerId" IS NOT NULL),
    '[]'::jsonb
  ) AS roster
FROM "Team" AS tm
LEFT JOIN "TeamMember" AS mem ON mem."teamId" = tm.id
GROUP BY tm.id;

-- Harden base tables: strip default grants, enable RLS, and add public-select policies
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
      'Category',
      'BracketGroup',
      'Bracket',
      'Match',
      'QueueItem',
      'Notification',
      'PublicSettings'
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

-- Grant read access on the views to the public roles (if they exist)
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
