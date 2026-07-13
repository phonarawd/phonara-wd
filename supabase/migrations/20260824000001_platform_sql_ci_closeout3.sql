-- Platform SQL CI closeout 3 — two independent regression fixes surfaced by
-- futures_parity_test.sql and m20_r4b_rls_perf_initplan_test.sql after
-- platform_sql_ci_closeout(2).
--
-- Fix A — rpc_open_futures_position validation order (E21 regression):
-- the E21 hedge/one-way mode migration (20260808000001) injected
-- _assert_futures_open_allowed(...) immediately after `v_side :=
-- p_side::position_side;`, which runs BEFORE the leverage bound check
-- (`IF v_lev > v_mkt.max_leverage ... 'leverage_too_high'`). When a caller
-- probes a just-over-max leverage order on a side that already has an open
-- position (same side in hedge mode, opposite side in one-way mode), the
-- mode assert now fires first and masks 'leverage_too_high' with
-- 'position_mode_hedge_side_exists' / 'position_mode_one_way_opposite'.
-- Meaning-preserving reorder only: move the existing assert call to run
-- immediately after the leverage check (same technique as the E21 migration
-- itself — read current body, relocate one line via exact-text anchors).
--
-- Fix B — defensive re-assert of the M-20 R4-b auth.uid() wrap on the 8
-- hot/residual tables. platform_sql_ci_closeout(2) already re-wrap the
-- SELECT (+ giftcard UPDATE) policies; this pass additionally sweeps EVERY
-- policy (any command) on the same 8 tables through the proven
-- _advisor_wrap_rls_auth_expr() helper from 20260820000001, so any
-- INSERT/UPDATE/DELETE policy that still carries a bare auth.uid()/auth.jwt()/
-- auth.role() reference is wrapped too. Idempotent — a clean run updates 0
-- policies.

SET search_path = public, pg_temp;

-- ── A. rpc_open_futures_position — relocate hedge/one-way assert ────────────
DO $$
DECLARE
  v_def          TEXT;
  v_new          TEXT;
  v_inject       TEXT := E'\n  PERFORM _assert_futures_open_allowed(v_user_id, p_market, v_side, FALSE);';
  v_lev_anchor   TEXT := 'IF v_lev > v_mkt.max_leverage::NUMERIC THEN RAISE EXCEPTION ''leverage_too_high''; END IF;';
BEGIN
  v_def := pg_get_functiondef(
    'public.rpc_open_futures_position(text,text,text,text,text,text,text,text)'::regprocedure
  );

  -- Already fixed (idempotent re-run): assert already sits after the anchor.
  IF position(v_lev_anchor || v_inject IN v_def) > 0 THEN
    RAISE NOTICE 'platform_sql_ci_closeout3: rpc_open_futures_position already reordered, skipping';
  ELSE
    IF position(v_inject IN v_def) = 0 THEN
      RAISE EXCEPTION 'platform_sql_ci_closeout3: injected assert line not found — anchor drift';
    END IF;
    IF position(v_lev_anchor IN v_def) = 0 THEN
      RAISE EXCEPTION 'platform_sql_ci_closeout3: leverage_too_high anchor not found — anchor drift';
    END IF;

    -- Remove from the too-early position, then re-insert right after the leverage bound check.
    v_new := replace(v_def, v_inject, '');
    v_new := replace(v_new, v_lev_anchor, v_lev_anchor || v_inject);

    IF v_new = v_def THEN
      RAISE EXCEPTION 'platform_sql_ci_closeout3: no-op replace — anchors did not change body';
    END IF;

    EXECUTE v_new;
    RAISE NOTICE 'platform_sql_ci_closeout3: rpc_open_futures_position assert reordered after leverage check';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION rpc_open_futures_position(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_open_futures_position(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ── B. Defensive sweep — any remaining bare auth.*() on the 8 R4-b tables ───
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

  RAISE NOTICE 'platform_sql_ci_closeout3: r4b_defensive_sweep updated_policies=%', v_updated;
END;
$$;
