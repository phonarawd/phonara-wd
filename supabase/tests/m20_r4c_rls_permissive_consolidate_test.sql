-- M-20 R4-c — multiple permissive SELECT policies consolidated

BEGIN;

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'co_mission_claims'
    AND p.polcmd = 'r';
  ASSERT v_count = 1, format('co_mission_claims SELECT policies expected 1 got %s', v_count);

  SELECT COUNT(*)::INT INTO v_count
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'sports_sport_catalog'
    AND p.polcmd = 'r'
    AND p.polname = 'sports_sport_catalog: public read';
  ASSERT v_count = 1, 'sports_sport_catalog public read policy must exist';
END;
$$;

ROLLBACK;
