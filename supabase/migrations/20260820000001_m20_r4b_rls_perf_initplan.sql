-- M-20 / Platform audit R4-b (audit-r4-market-ops)
-- Re-wrap remaining RLS policies that still call auth.*() per-row (auth_rls_initplan).
-- Meaning-preserving only — no GRANT widening · no policy drop that expands access.

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

  -- Only wrap bare auth.uid() that is not already inside a (select ...) initplan form.
  WHILE v_result ~ 'auth\.uid\(\)'
        AND v_result !~ '\(select[[:space:]]+auth\.uid\(\)'
        AND v_result !~ '\(SELECT[[:space:]]+auth\.uid\(\)' LOOP
    v_result := regexp_replace(v_result, 'auth\.uid\(\)', '(select auth.uid())', 'g');
  END LOOP;

  WHILE v_result ~ 'auth\.jwt\(\)'
        AND v_result !~ '\(select[[:space:]]+auth\.jwt\(\)'
        AND v_result !~ '\(SELECT[[:space:]]+auth\.jwt\(\)' LOOP
    v_result := regexp_replace(v_result, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
  END LOOP;

  WHILE v_result ~ 'auth\.role\(\)'
        AND v_result !~ '\(select[[:space:]]+auth\.role\(\)'
        AND v_result !~ '\(SELECT[[:space:]]+auth\.role\(\)' LOOP
    v_result := regexp_replace(v_result, 'auth\.role\(\)', '(select auth.role())', 'g');
  END LOOP;

  WHILE v_result LIKE '%current_setting(''request.jwt.claims''%'
        AND v_result NOT LIKE '%(select current_setting(''request.jwt.claims''%'
        AND v_result NOT LIKE '%(SELECT current_setting(''request.jwt.claims''%' LOOP
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
        'giftcard_redeem_requests',
        'p2p_transfers',
        'sports_fixtures',
        'sports_markets',
        'sports_odds_snapshots',
        'sports_sport_catalog',
        'spot_open_orders',
        'spot_order_fills',
        'support_tickets',
        'tier_decay_events',
        'trading_api_keys',
        'user_wallet_identities',
        'whale_mission_claims'
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

  RAISE NOTICE 'm20_r4b_rls_perf_initplan updated_policies=%', v_updated;
END;
$$;
