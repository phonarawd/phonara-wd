-- ============================================================
-- SECURITY DEFINER inventory — Phase 2 drift detection
-- ============================================================
-- Pins:
--   • header-level search_path on all public SECURITY DEFINER functions
--   • anon executable SECURITY DEFINER allowlist + classification
--   • public_read_invoker RPCs must not remain SECURITY DEFINER
--   • internal `_` helpers (except _is_admin) blocked from anon/authenticated EXECUTE
--   • P0 service-only RPCs remain service_role-only
--
-- Allowlist is the Phase 2 expected set (not a migration table yet).
-- Runs in one transaction and ROLLS BACK — no residue.
-- ============================================================

BEGIN;

DO $$
DECLARE
  r RECORD;
  v_bad_search_path TEXT := '';
  v_anon_definer TEXT := '';
  v_anon_definer_count INT;
  v_internal_leak TEXT := '';
  v_invoker_still_definer TEXT := '';
  v_sig TEXT;
  v_expected_anon_definer TEXT[] := ARRAY[
    '_is_admin()',
    'rpc_get_fixture_markets(uuid)',
    'rpc_get_golden_earth_status()',
    'rpc_get_public_platform_status()',
    'rpc_get_synthetic_book(text,integer)',
    'rpc_list_sports_catalog()',
    'rpc_list_sports_fixtures(date,text,text)',
    'rpc_live_crash_get_current()'
  ];
  v_expected_invoker TEXT[] := ARRAY[
    'rpc_get_live_fixture_state(uuid)',
    'rpc_list_cms_content(text,text,text)',
    'rpc_list_sports_market_types()'
  ];
  v_classification RECORD;
BEGIN
  -- ── 1. SECURITY DEFINER must declare search_path in header ────────────────
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%')
      )
  LOOP
    v_bad_search_path := v_bad_search_path || ' ' || r.sig::TEXT;
  END LOOP;

  ASSERT v_bad_search_path = '',
    format('SECURITY DEFINER without search_path must be 0, found:%s', v_bad_search_path);

  -- ── 2. public_read_invoker RPCs must not stay SECURITY DEFINER ───────────
  FOREACH v_sig IN ARRAY v_expected_invoker LOOP
    IF EXISTS (
      SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.oid = ('public.' || v_sig)::regprocedure
         AND p.prosecdef
    ) THEN
      v_invoker_still_definer := v_invoker_still_definer || ' ' || v_sig;
    END IF;
  END LOOP;

  ASSERT v_invoker_still_definer = '',
    format('public_read_invoker RPCs must be SECURITY INVOKER, still definer:%s', v_invoker_still_definer);

  -- ── 3. anon executable SECURITY DEFINER exact allowlist ───────────────────
  SELECT COUNT(*)::INT INTO v_anon_definer_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.prosecdef
     AND has_function_privilege('anon', p.oid, 'EXECUTE');

  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
    ORDER BY p.proname, p.oid
  LOOP
    v_anon_definer := v_anon_definer || ' ' || r.sig::TEXT;
  END LOOP;

  ASSERT v_anon_definer_count = array_length(v_expected_anon_definer, 1),
    format(
      'anon executable SECURITY DEFINER count must equal allowlist (expected %s, got %s). actual:%s',
      array_length(v_expected_anon_definer, 1), v_anon_definer_count, v_anon_definer
    );

  FOREACH v_sig IN ARRAY v_expected_anon_definer LOOP
    ASSERT has_function_privilege('anon', ('public.' || v_sig)::regprocedure, 'EXECUTE'),
      format('anon must EXECUTE allowlisted definer %s', v_sig);
  END LOOP;

  -- ── 4. Allowlist classification metadata (reason must be non-empty) ───────
  CREATE TEMP TABLE _anon_definer_allowlist (
    sig TEXT PRIMARY KEY,
    classification TEXT NOT NULL,
    reason TEXT NOT NULL,
    expected_roles TEXT[] NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO _anon_definer_allowlist (sig, classification, reason, expected_roles) VALUES
    (
      '_is_admin()',
      'rls_eval_helper',
      'RLS policy evaluation for anon reads; definer returns false for anon',
      ARRAY['anon', 'authenticated', 'service_role']
    ),
    (
      'rpc_get_fixture_markets(uuid)',
      'public_read_definer_allowlisted',
      'Joins sports_outcomes via _sports_latest_odds; anon has no direct SELECT on sports_outcomes',
      ARRAY['anon', 'authenticated', 'service_role']
    ),
    (
      'rpc_get_golden_earth_status()',
      'public_read_definer_allowlisted',
      'Authenticated path uses definer helpers for daily regen; anon branch reads global stats only',
      ARRAY['anon', 'authenticated']
    ),
    (
      'rpc_get_synthetic_book(text,integer)',
      'public_read_definer_allowlisted',
      'Display-only reference order book for guest trade desk; no wallet mutation',
      ARRAY['anon', 'authenticated', 'service_role']
    ),
    (
      'rpc_list_sports_fixtures(date,text,text)',
      'public_read_definer_allowlisted',
      'Aggregates match_1x2 odds via _sports_latest_odds over sports_outcomes',
      ARRAY['anon', 'authenticated', 'service_role']
    ),
    (
      'rpc_get_public_platform_status()',
      'public_read_definer_allowlisted',
      'Sanitized public platform health lane; no secrets or operator metrics',
      ARRAY['anon', 'authenticated', 'service_role']
    ),
    (
      'rpc_list_sports_catalog()',
      'public_read_definer_allowlisted',
      'Public sports catalog read via definer; table SELECT blocked for anon',
      ARRAY['anon', 'authenticated', 'service_role']
    ),
    (
      'rpc_live_crash_get_current()',
      'public_read_definer_allowlisted',
      'Live crash public round state; server_seed withheld until reveal',
      ARRAY['anon', 'authenticated', 'service_role']
    );

  FOR v_classification IN SELECT * FROM _anon_definer_allowlist LOOP
    ASSERT v_classification.reason <> '',
      format('allowlist reason must be non-empty for %s', v_classification.sig);
    ASSERT v_classification.classification IN (
      'rls_eval_helper', 'public_read_definer_allowlisted'
    ),
      format('unexpected classification %s for %s', v_classification.classification, v_classification.sig);

    FOREACH v_sig IN ARRAY v_classification.expected_roles LOOP
      IF v_sig = 'anon' THEN
        ASSERT has_function_privilege('anon', ('public.' || v_classification.sig)::regprocedure, 'EXECUTE'),
          format('%s must retain anon EXECUTE', v_classification.sig);
      ELSIF v_sig = 'authenticated' THEN
        ASSERT has_function_privilege('authenticated', ('public.' || v_classification.sig)::regprocedure, 'EXECUTE'),
          format('%s must retain authenticated EXECUTE', v_classification.sig);
      ELSIF v_sig = 'service_role' THEN
        ASSERT has_function_privilege('service_role', ('public.' || v_classification.sig)::regprocedure, 'EXECUTE'),
          format('%s must retain service_role EXECUTE', v_classification.sig);
      END IF;
    END LOOP;
  END LOOP;

  -- ── 5. _is_admin() policy pins ────────────────────────────────────────────
  ASSERT EXISTS (
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = '_is_admin'
       AND p.prosecdef
       AND p.proconfig IS NOT NULL
       AND EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%')
  ), '_is_admin must be SECURITY DEFINER with header search_path';

  ASSERT NOT has_table_privilege('anon', 'public.profiles', 'SELECT'),
    'anon must not SELECT profiles directly (_is_admin definer performs admin check)';

  -- ── 6. Internal helpers: anon EXECUTE blocked; authenticated allowlist only ─
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE '\_%' ESCAPE '\'
      AND p.proname <> '_is_admin'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    v_internal_leak := v_internal_leak || ' ' || r.sig::TEXT;
  END LOOP;

  ASSERT v_internal_leak = '',
    format('internal `_` helpers must not be executable by anon:%s', v_internal_leak);

  v_internal_leak := '';
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE '\_%' ESCAPE '\'
      AND p.proname NOT IN (
        '_is_admin',
        '_game_bets_client_rows',
        '_game_bets_client_result_payload'
      )
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  LOOP
    v_internal_leak := v_internal_leak || ' ' || r.sig::TEXT;
  END LOOP;

  ASSERT v_internal_leak = '',
    format(
      'internal `_` helpers must not be executable by authenticated except view wrappers:%s',
      v_internal_leak
    );

  -- ── 7. P0 service-only RPCs (notification / webhook / withdrawal claim) ───
  ASSERT NOT has_function_privilege('anon', 'public.rpc_service_register_pg_webhook_replay(text, bigint, text, text, text, text)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_service_register_pg_webhook_replay';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_register_pg_webhook_replay(text, bigint, text, text, text, text)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_register_pg_webhook_replay';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_register_pg_webhook_replay(text, bigint, text, text, text, text)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_register_pg_webhook_replay';

  ASSERT NOT has_function_privilege('anon', 'public.rpc_service_claim_notification_dispatch_batch(text, integer, integer)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_service_claim_notification_dispatch_batch';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_claim_notification_dispatch_batch(text, integer, integer)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_claim_notification_dispatch_batch';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_claim_notification_dispatch_batch(text, integer, integer)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_claim_notification_dispatch_batch';

  ASSERT NOT has_function_privilege('anon', 'public.rpc_service_complete_notification_dispatch(uuid, text, text, text, boolean)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_service_complete_notification_dispatch';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_complete_notification_dispatch(uuid, text, text, text, boolean)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_complete_notification_dispatch';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_complete_notification_dispatch(uuid, text, text, text, boolean)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_complete_notification_dispatch';

  ASSERT NOT has_function_privilege('anon', 'public.rpc_service_claim_ops_notify_batch(text, integer, integer)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_service_claim_ops_notify_batch';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_complete_ops_notify(uuid, text, text, text, boolean)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_complete_ops_notify';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_claim_ops_notify_batch(text, integer, integer)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_claim_ops_notify_batch';

  RAISE NOTICE 'SECURITY DEFINER INVENTORY OK — anon definer allowlist=% invoker RPCs=% search_path pinned',
    array_length(v_expected_anon_definer, 1), array_length(v_expected_invoker, 1);
END;
$$;

-- ── Scope: anon public read via invoker RPCs ────────────────────────────────
DO $$
DECLARE
  v_rows INT;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);
  SET ROLE anon;

  SELECT COUNT(*) INTO v_rows FROM rpc_list_sports_market_types();
  ASSERT v_rows >= 1, 'anon must read enabled sports market types via invoker RPC';

  SELECT COUNT(*) INTO v_rows FROM rpc_list_cms_content(NULL, NULL, 'ko');
  -- CMS may be empty in test DB; call must not raise permission error (count >= 0).

  RESET ROLE;
  RAISE NOTICE 'SECURITY DEFINER INVENTORY OK — anon invoker public read scope smoke passed';
END;
$$;

ROLLBACK;
