-- Platform SQL CI closeout 4 — fix the auth.uid()-wrap "already wrapped"
-- detector so the M-20 R4-b defensive sweep (platform_sql_ci_closeout3 Fix B)
-- actually converges.
--
-- _advisor_wrap_rls_auth_expr() (20260820000001) and
-- m20_r4b_rls_perf_initplan_test.sql both anchor "already wrapped" on the
-- literal substring `(select ` / `(SELECT ` immediately before the auth.*()
-- call. RLS policy quals are stored as a parsed expression tree, not source
-- text — pg_get_expr() re-deparses the scalar subquery on every read, and
-- Postgres's own deparser does not reliably reproduce that exact `(select `
-- prefix (spacing/target alias around the SubLink can vary by version).
-- That made the wrap helper treat already-wrapped expressions as bare and
-- keep re-wrapping them without ever reporting "no bare policies remain" —
-- Fix B's own sweep (closeout3) still reported "got 8" after "updated
-- policies=13" because every policy it touched round-tripped back through
-- the same broken detector.
--
-- Loosen the anchor to "SELECT (any case) then whitespace then the auth.*()
-- call", with no requirement on what precedes SELECT. Still meaning-
-- preserving — the helper only decides whether to skip wrapping, it never
-- changes what text gets written — but robust to Postgres's own
-- reformatting. Re-running the R4-b sweep afterwards with the corrected
-- helper closes the remaining gap in one pass.

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _advisor_wrap_rls_auth_expr(p_expr TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result TEXT := COALESCE(p_expr, '');
BEGIN
  IF v_result = '' THEN
    RETURN v_result;
  END IF;

  WHILE v_result ~ 'auth\.uid\(\)'
        AND v_result !~ '[Ss][Ee][Ll][Ee][Cc][Tt][[:space:]]+auth\.uid\(\)' LOOP
    v_result := regexp_replace(v_result, 'auth\.uid\(\)', '(select auth.uid())', 'g');
  END LOOP;

  WHILE v_result ~ 'auth\.jwt\(\)'
        AND v_result !~ '[Ss][Ee][Ll][Ee][Cc][Tt][[:space:]]+auth\.jwt\(\)' LOOP
    v_result := regexp_replace(v_result, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
  END LOOP;

  WHILE v_result ~ 'auth\.role\(\)'
        AND v_result !~ '[Ss][Ee][Ll][Ee][Cc][Tt][[:space:]]+auth\.role\(\)' LOOP
    v_result := regexp_replace(v_result, 'auth\.role\(\)', '(select auth.role())', 'g');
  END LOOP;

  WHILE v_result LIKE '%current_setting(''request.jwt.claims''%'
        AND v_result !~ '[Ss][Ee][Ll][Ee][Cc][Tt][[:space:]]+current_setting\(''request\.jwt\.claims''' LOOP
    v_result := replace(
      v_result,
      'current_setting(''request.jwt.claims'', true)',
      '(select current_setting(''request.jwt.claims'', true))'
    );
    v_result := replace(
      v_result,
      'current_setting(''request.jwt.claims'', false)',
      '(select current_setting(''request.jwt.claims'', false))'
    );
  END LOOP;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION _advisor_wrap_rls_auth_expr(TEXT) FROM PUBLIC, anon, authenticated;

-- Re-run the R4-b defensive sweep (same 8 tables) with the corrected helper.
DO $$
DECLARE
  pol RECORD;
  v_qual TEXT;
  v_with_check TEXT;
  v_new_qual TEXT;
  v_new_with_check TEXT;
  v_cmd TEXT;
  v_permissive TEXT;
  v_roles TEXT;
  v_sql TEXT;
  v_updated INT := 0;
BEGIN
  FOR pol IN
    SELECT
      n.nspname AS schemaname,
      c.relname AS tablename,
      p.polname AS policyname,
      p.polpermissive,
      p.polcmd,
      p.polroles,
      pg_get_expr(p.polqual, p.polrelid) AS qual_expr,
      pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = ANY (ARRAY[
        'app_install_attributions',
        'co_bet_claims',
        'co_bet_sessions',
        'co_mission_claims',
        'co_mission_sessions',
        'crypto_deposit_addresses',
        'crypto_deposit_requests',
        'giftcard_redeem_requests'
      ])
  LOOP
    v_qual := pol.qual_expr;
    v_with_check := pol.with_check_expr;

    IF COALESCE(v_qual, '') = '' AND COALESCE(v_with_check, '') = '' THEN
      CONTINUE;
    END IF;

    v_new_qual := _advisor_wrap_rls_auth_expr(v_qual);
    v_new_with_check := _advisor_wrap_rls_auth_expr(v_with_check);

    IF v_new_qual IS NOT DISTINCT FROM v_qual
       AND v_new_with_check IS NOT DISTINCT FROM v_with_check THEN
      CONTINUE;
    END IF;

    v_cmd := CASE pol.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      ELSE 'ALL'
    END;
    v_permissive := CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;

    IF pol.polroles = '{0}'::oid[] OR pol.polroles IS NULL OR array_length(pol.polroles, 1) IS NULL THEN
      v_roles := 'PUBLIC';
    ELSE
      SELECT string_agg(quote_ident(r.rolname), ', ' ORDER BY r.rolname)
        INTO v_roles
      FROM pg_roles r
      WHERE r.oid = ANY (pol.polroles);
      IF v_roles IS NULL OR v_roles = '' THEN
        v_roles := 'PUBLIC';
      END IF;
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );

    v_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      pol.policyname,
      pol.schemaname,
      pol.tablename,
      v_permissive,
      v_cmd,
      v_roles
    );

    IF v_new_qual IS NOT NULL AND v_new_qual <> '' THEN
      v_sql := v_sql || ' USING (' || v_new_qual || ')';
    END IF;
    IF v_new_with_check IS NOT NULL AND v_new_with_check <> '' THEN
      v_sql := v_sql || ' WITH CHECK (' || v_new_with_check || ')';
    END IF;

    EXECUTE v_sql;
    v_updated := v_updated + 1;
  END LOOP;

  RAISE NOTICE 'platform_sql_ci_closeout4: r4b_defensive_sweep_v2 updated_policies=%', v_updated;
END;
$$;
