-- ============================================================
-- M-05 / R3-c — search_path pin on 8 earn/tier IMMUTABLE helpers
-- Platform audit: audit-r3c-search-path-sweep
-- ============================================================
-- RED-first owner: without migration, proconfig search_path is NULL on these
-- 8 functions (advisor function_search_path_mutable). After apply, all 8 must
-- pin search_path=public, pg_temp · client EXECUTE stays revoked · sample
-- outputs unchanged (body not rewritten).
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_bad_path TEXT := '';
  v_client_leak TEXT := '';
  v_targets TEXT[] := ARRAY[
    '_earn_tier_index(earn_vip_tier)',
    '_earn_limit_roulette(earn_vip_tier)',
    '_earn_limit_referral_payout(earn_vip_tier)',
    '_earn_limit_viral_share(earn_vip_tier)',
    '_earn_limit_daily_quiz(earn_vip_tier)',
    '_earn_referral_multiplier(earn_vip_tier)',
    '_tier_decay_previous(earn_vip_tier)',
    '_tier_decay_xp_cap(earn_vip_tier)'
  ];
  v_sig TEXT;
  v_cfg TEXT[];
  v_reg REGPROCEDURE;
BEGIN
  -- ── 1. Exactly 8 targets exist and pin search_path ─────────────────────────
  ASSERT (
    SELECT COUNT(*)::INT
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        '_earn_tier_index',
        '_earn_limit_roulette',
        '_earn_limit_referral_payout',
        '_earn_limit_viral_share',
        '_earn_limit_daily_quiz',
        '_earn_referral_multiplier',
        '_tier_decay_previous',
        '_tier_decay_xp_cap'
      )
  ) = 8,
    'M-05 R3-c: expected exactly 8 earn/tier helper overloads';

  FOREACH v_sig IN ARRAY v_targets LOOP
    v_reg := ('public.' || v_sig)::regprocedure;
    SELECT p.proconfig INTO v_cfg
      FROM pg_proc p
     WHERE p.oid = v_reg;

    IF v_cfg IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM unnest(v_cfg) c WHERE c LIKE 'search_path=%'
       ) THEN
      v_bad_path := v_bad_path || ' ' || v_sig;
    END IF;

    IF has_function_privilege('anon', v_reg, 'EXECUTE')
       OR has_function_privilege('authenticated', v_reg, 'EXECUTE') THEN
      v_client_leak := v_client_leak || ' ' || v_sig;
    END IF;
  END LOOP;

  ASSERT v_bad_path = '',
    format('M-05 R3-c helpers missing pinned search_path:%s', v_bad_path);
  ASSERT v_client_leak = '',
    format('M-05 R3-c helpers must not be client-callable:%s', v_client_leak);

  -- ── 2. Behaviour smoke (values unchanged by ALTER SET) ─────────────────────
  ASSERT _earn_tier_index('bronze'::earn_vip_tier) = 0;
  ASSERT _earn_tier_index('prime_elite'::earn_vip_tier) = 5;
  ASSERT _earn_limit_roulette('gold'::earn_vip_tier) = 2;
  ASSERT _earn_limit_referral_payout('diamond'::earn_vip_tier) = 20;
  ASSERT _earn_limit_viral_share('silver'::earn_vip_tier) = 4;
  ASSERT _earn_limit_daily_quiz('platinum'::earn_vip_tier) = 2;
  ASSERT _earn_referral_multiplier('gold'::earn_vip_tier) = 1.25;
  ASSERT _tier_decay_previous('gold'::earn_vip_tier) = 'silver'::earn_vip_tier;
  ASSERT _tier_decay_previous('bronze'::earn_vip_tier) IS NULL;
  ASSERT _tier_decay_xp_cap('silver'::earn_vip_tier) = 24999;

  RAISE NOTICE 'M-05 R3-c SEARCH_PATH SWEEP OK — 8 helpers pinned · client EXECUTE 0 · smoke values OK';
END;
$$;

ROLLBACK;
