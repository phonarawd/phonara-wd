-- ============================================================
-- Migration: 20260619000123_advisor_rls_auth_initplan_wrap
-- ============================================================
-- Performance-advisor cleanup (auth_rls_initplan):
-- Wrap auth.*() and request.jwt current_setting calls in RLS policy
-- expressions with (select ...) so Postgres evaluates them once per query
-- (initplan) instead of per row.
--
-- Scope: public schema policies whose qual/with_check reference auth.uid(),
-- auth.jwt(), auth.role(), or current_setting('request.jwt.claims'...).
-- Idempotent: already-wrapped expressions are skipped.
-- ============================================================

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

  WHILE v_result LIKE '%auth.uid()%' AND v_result NOT LIKE '%(select auth.uid())%' LOOP
    v_result := replace(v_result, 'auth.uid()', '(select auth.uid())');
  END LOOP;

  WHILE v_result LIKE '%auth.jwt()%' AND v_result NOT LIKE '%(select auth.jwt())%' LOOP
    v_result := replace(v_result, 'auth.jwt()', '(select auth.jwt())');
  END LOOP;

  WHILE v_result LIKE '%auth.role()%' AND v_result NOT LIKE '%(select auth.role())%' LOOP
    v_result := replace(v_result, 'auth.role()', '(select auth.role())');
  END LOOP;

  WHILE v_result LIKE '%current_setting(''request.jwt.claims''%'
        AND v_result NOT LIKE '%(select current_setting(''request.jwt.claims''%' LOOP
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
  LOOP
    v_qual := pol.qual_expr;
    v_with_check := pol.with_check_expr;

    IF COALESCE(v_qual, '') = '' AND COALESCE(v_with_check, '') = '' THEN
      CONTINUE;
    END IF;

    IF COALESCE(v_qual, '') NOT ILIKE '%auth.%'
       AND COALESCE(v_qual, '') NOT ILIKE '%current_setting(''request.jwt.claims''%'
       AND COALESCE(v_with_check, '') NOT ILIKE '%auth.%'
       AND COALESCE(v_with_check, '') NOT ILIKE '%current_setting(''request.jwt.claims''%' THEN
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
      WHEN '*' THEN 'ALL'
      ELSE 'ALL'
    END;

    v_permissive := CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;

    SELECT string_agg(quote_ident(r.rolname), ', ' ORDER BY r.rolname)
      INTO v_roles
      FROM pg_roles r
     WHERE r.oid = ANY (pol.polroles);

    IF v_roles IS NULL OR v_roles = '' THEN
      v_roles := 'public';
    END IF;

    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
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
      v_sql := v_sql || format(' USING (%s)', v_new_qual);
    ELSIF v_cmd IN ('SELECT', 'UPDATE', 'DELETE', 'ALL') THEN
      v_sql := v_sql || ' USING (true)';
    END IF;

    IF v_new_with_check IS NOT NULL AND v_new_with_check <> '' THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_new_with_check);
    END IF;

    EXECUTE v_sql;
  END LOOP;
END;
$$;

DROP FUNCTION _advisor_wrap_rls_auth_expr(TEXT);
