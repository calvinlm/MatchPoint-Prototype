CREATE OR REPLACE FUNCTION set_team_ordinal_and_code() RETURNS trigger AS $$
DECLARE
  next_ord INT;
  ab TEXT;
  div TEXT;
  lvl TEXT;
  age_code TEXT;
  div_code TEXT;
  lvl_code TEXT;
BEGIN
  -- Lock category row to prevent race conditions
  PERFORM 1 FROM "Category" WHERE id = NEW."categoryId" FOR UPDATE;

  -- Get next ordinal number for this category
  SELECT COALESCE(MAX("ordinal"), 0) + 1 INTO next_ord
  FROM "Team"
  WHERE "categoryId" = NEW."categoryId";

  NEW."ordinal" := next_ord;

  -- Retrieve category fields
  SELECT "ageBracket"::text, "division"::text, "level"::text
  INTO ab, div, lvl
  FROM "Category"
  WHERE id = NEW."categoryId";

  -- Map to short codes
  age_code := CASE ab
    WHEN 'A18' THEN '18'
    WHEN 'A35' THEN '35'
    WHEN 'A55' THEN '55'
    WHEN 'JUNIOR' THEN 'JUN'
    ELSE 'UNK'
  END;

  div_code := div; -- e.g., MD, XD, WD
  lvl_code := lvl; -- e.g., NOV, INT, ADV, OPN

  -- Build code
  NEW."teamCode" := age_code || div_code || '_' || lvl_code || '_' || LPAD(next_ord::text, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_set_code ON "Team";
CREATE TRIGGER trg_team_set_code
BEFORE INSERT ON "Team"
FOR EACH ROW
EXECUTE FUNCTION set_team_ordinal_and_code();
