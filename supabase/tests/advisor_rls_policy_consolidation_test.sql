-- ============================================================
-- Advisor RLS policy consolidation — SQL integration test
-- ============================================================
-- Guards 20260619000127_advisor_rls_policy_consolidation.
-- Runs in one transaction and ROLLS BACK — no residue.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_all_select_overlap INT;
  v_multi_select INT;
BEGIN
  SELECT count(*) INTO v_all_select_overlap
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND EXISTS (
       SELECT 1 FROM pg_policy p
        WHERE p.polrelid = c.oid AND p.polpermissive AND p.polcmd = '*'
     )
     AND EXISTS (
       SELECT 1 FROM pg_policy p
        WHERE p.polrelid = c.oid AND p.polpermissive AND p.polcmd = 'r'
     );

  ASSERT v_all_select_overlap = 0,
    format('ALL+SELECT permissive overlap must be consolidated, found %s tables', v_all_select_overlap);

  SELECT count(*) INTO v_multi_select
    FROM (
      SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_policy p ON p.polrelid = c.oid
       WHERE n.nspname = 'public'
         AND c.relkind = 'r'
         AND p.polpermissive
         AND p.polcmd = 'r'
       GROUP BY c.relname
      HAVING count(*) > 1
    ) x;

  ASSERT v_multi_select = 0,
    format('multiple SELECT permissive policies must be merged, found %s tables', v_multi_select);

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'app_config'
       AND policyname = 'app_config: consolidated select'
  ), 'app_config consolidated select policy must exist';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'app_config'
       AND policyname = 'app_config: consolidated select'
       AND qual ILIKE '%_is_admin()%'
       AND qual ILIKE '%is_public%'
  ), 'app_config consolidated select must preserve public-flag and admin read paths';

  RAISE NOTICE 'ADVISOR RLS CONSOLIDATION OK — ALL/SELECT overlap removed; multi-SELECT merged';
END;
$$;

ROLLBACK;
