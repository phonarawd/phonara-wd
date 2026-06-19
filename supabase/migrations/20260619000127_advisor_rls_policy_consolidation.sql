-- ============================================================
-- Migration: 20260619000127_advisor_rls_policy_consolidation
-- ============================================================
-- Performance-advisor cleanup (multiple_permissive_policies):
-- 1) ALL + SELECT overlap → one SELECT policy + admin INSERT/UPDATE/DELETE
-- 2) Multiple SELECT policies → single merged SELECT policy (OR)
-- Behaviour preserved; only policy count/plan shape changes.
-- ============================================================

SET search_path = public, pg_temp;

DO $$
DECLARE
  tbl RECORD;
  pol RECORD;
  v_select_quals TEXT[] := ARRAY[]::TEXT[];
  v_admin_qual TEXT;
  v_admin_check TEXT;
  v_merged_select TEXT;
  v_has_all BOOLEAN;
  v_select_count INT;
BEGIN
  FOR tbl IN
    SELECT c.oid AS relid, n.nspname AS schemaname, c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND EXISTS (
         SELECT 1
           FROM pg_policy p
          WHERE p.polrelid = c.oid
            AND p.polpermissive
       )
  LOOP
    v_select_quals := ARRAY[]::TEXT[];
    v_admin_qual := NULL;
    v_admin_check := NULL;
    v_has_all := FALSE;
    v_select_count := 0;

    FOR pol IN
      SELECT
        p.polname,
        p.polcmd,
        pg_get_expr(p.polqual, p.polrelid) AS qual_expr,
        pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
        FROM pg_policy p
       WHERE p.polrelid = tbl.relid
         AND p.polpermissive
    LOOP
      IF pol.polcmd = '*' THEN
        v_has_all := TRUE;
        v_admin_qual := pol.qual_expr;
        v_admin_check := pol.with_check_expr;
      ELSIF pol.polcmd = 'r' AND COALESCE(pol.qual_expr, '') <> '' THEN
        v_select_count := v_select_count + 1;
        v_select_quals := array_append(v_select_quals, '(' || pol.qual_expr || ')');
      END IF;
    END LOOP;

    IF v_has_all AND v_select_count > 0 THEN
      FOR pol IN
        SELECT p.polname
          FROM pg_policy p
         WHERE p.polrelid = tbl.relid
           AND p.polpermissive
           AND p.polcmd IN ('*', 'r')
      LOOP
        EXECUTE format(
          'DROP POLICY %I ON %I.%I',
          pol.polname,
          tbl.schemaname,
          tbl.relname
        );
      END LOOP;

      v_merged_select := array_to_string(v_select_quals, ' OR ');
      IF COALESCE(v_admin_qual, '') <> '' THEN
        IF v_merged_select = '' THEN
          v_merged_select := '(' || v_admin_qual || ')';
        ELSE
          v_merged_select := v_merged_select || ' OR (' || v_admin_qual || ')';
        END IF;
      END IF;

      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR SELECT USING (%s)',
        tbl.relname || ': consolidated select',
        tbl.schemaname,
        tbl.relname,
        v_merged_select
      );

      IF COALESCE(v_admin_qual, '') <> '' OR COALESCE(v_admin_check, '') <> '' THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR INSERT WITH CHECK (%s)',
          tbl.relname || ': admin insert',
          tbl.schemaname,
          tbl.relname,
          COALESCE(NULLIF(v_admin_check, ''), v_admin_qual, 'false')
        );
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR UPDATE USING (%s) WITH CHECK (%s)',
          tbl.relname || ': admin update',
          tbl.schemaname,
          tbl.relname,
          COALESCE(v_admin_qual, 'false'),
          COALESCE(NULLIF(v_admin_check, ''), v_admin_qual, 'false')
        );
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR DELETE USING (%s)',
          tbl.relname || ': admin delete',
          tbl.schemaname,
          tbl.relname,
          COALESCE(v_admin_qual, 'false')
        );
      END IF;

    ELSIF NOT v_has_all AND v_select_count > 1 THEN
      FOR pol IN
        SELECT p.polname
          FROM pg_policy p
         WHERE p.polrelid = tbl.relid
           AND p.polpermissive
           AND p.polcmd = 'r'
      LOOP
        EXECUTE format(
          'DROP POLICY %I ON %I.%I',
          pol.polname,
          tbl.schemaname,
          tbl.relname
        );
      END LOOP;

      v_merged_select := array_to_string(v_select_quals, ' OR ');
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I FOR SELECT USING (%s)',
        tbl.relname || ': consolidated select',
        tbl.schemaname,
        tbl.relname,
        v_merged_select
      );
    END IF;
  END LOOP;
END;
$$;
