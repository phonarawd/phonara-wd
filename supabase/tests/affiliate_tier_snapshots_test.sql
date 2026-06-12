-- ============================================================
-- Affiliate tier snapshots — SQL integration tests
-- ============================================================
-- Daily snapshots are derived from the affiliate commission graph, excluding RG
-- blocked activity before aggregation and applying age, activity, promotion,
-- demotion, and admin elite override rules.
-- ============================================================

-- ── 1. Rolling volume, active user, age, and RG boundary rules ───────────────
BEGIN;
DO $$
DECLARE
  v_day DATE := DATE '2026-06-12';
  v_exact UUID := gen_random_uuid();
  v_below UUID := gen_random_uuid();
  v_rg UUID := gen_random_uuid();
  v_young UUID := gen_random_uuid();
  v_exact_child UUID := gen_random_uuid();
  v_below_child UUID := gen_random_uuid();
  v_rg_child UUID := gen_random_uuid();
  v_young_child UUID := gen_random_uuid();
  v_result JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_exact, 'authenticated', 'authenticated', 'tier_exact_' || v_exact::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '20 days', NOW()),
    (v_below, 'authenticated', 'authenticated', 'tier_below_' || v_below::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '20 days', NOW()),
    (v_rg, 'authenticated', 'authenticated', 'tier_rg_' || v_rg::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '20 days', NOW()),
    (v_young, 'authenticated', 'authenticated', 'tier_young_' || v_young::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '10 days', NOW()),
    (v_exact_child, 'authenticated', 'authenticated', 'tier_exact_child_' || v_exact_child::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '20 days', NOW()),
    (v_below_child, 'authenticated', 'authenticated', 'tier_below_child_' || v_below_child::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '20 days', NOW()),
    (v_rg_child, 'authenticated', 'authenticated', 'tier_rg_child_' || v_rg_child::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '20 days', NOW()),
    (v_young_child, 'authenticated', 'authenticated', 'tier_young_child_' || v_young_child::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '20 days', NOW());

  UPDATE profiles
     SET created_at = v_day::TIMESTAMPTZ - INTERVAL '20 days'
   WHERE id IN (v_exact, v_below, v_rg, v_exact_child, v_below_child, v_rg_child, v_young_child);
  UPDATE profiles
     SET created_at = v_day::TIMESTAMPTZ - INTERVAL '10 days'
   WHERE id = v_young;

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES
    (v_exact_child, v_exact),
    (v_below_child, v_below),
    (v_rg_child, v_rg),
    (v_young_child, v_young);

  PERFORM _credit_system_account('house_fee_usdt', '100.000000', 'spot_buy_fee', v_exact_child, 'tier-exact', gen_random_uuid());
  PERFORM _credit_system_account('house_fee_usdt', '99.999999', 'spot_buy_fee', v_below_child, 'tier-below', gen_random_uuid());
  PERFORM _credit_system_account('house_fee_usdt', '100.000000', 'spot_buy_fee', v_rg_child, 'tier-rg', gen_random_uuid());
  PERFORM _credit_system_account('house_fee_usdt', '100.000000', 'spot_buy_fee', v_young_child, 'tier-young', gen_random_uuid());

  INSERT INTO rg_block_events (
    user_id, event_type, domain, currency, month_start,
    effective_start_at, effective_end_at, reason
  ) VALUES (
    v_rg_child, 'loss_limit_reached', 'trading', 'USDT', date_trunc('month', v_day)::DATE,
    v_day::TIMESTAMPTZ - INTERVAL '1 day', v_day::TIMESTAMPTZ + INTERVAL '1 day',
    'tier exclusion fixture'
  );

  v_result := rpc_refresh_affiliate_tier_snapshots(v_day);
  ASSERT (v_result->>'snapshot_date')::DATE = v_day, format('snapshot date mismatch: %s', v_result);

  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_exact) = 'silver',
    'exact 100.000000 RG-clean rolling volume with one active user must promote to silver';
  ASSERT (SELECT rolling_30d_volume FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_exact) = '100.000000',
    'exact threshold volume must be preserved at 6dp';
  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_below) = 'standard',
    'one unit below the silver threshold must remain standard';
  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_rg) = 'standard',
    'RG-blocked activity must be excluded before tier aggregation';
  ASSERT (SELECT rolling_30d_volume FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_rg) = '0.000000',
    'RG-blocked activity must not survive as rolling volume';
  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_young) = 'standard',
    'affiliate accounts younger than 14 days must not tier up';
  ASSERT (SELECT is_age_eligible FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_young) = FALSE,
    'young affiliate snapshot must record failed age eligibility';

  RAISE NOTICE 'AFFILIATE TIER BOUNDARY OK — exact threshold, one-below, age, and RG exclusion hold';
END;
$$;
ROLLBACK;

-- ── 2. Immediate promotion and 7-day demotion grace ──────────────────────────
BEGIN;
DO $$
DECLARE
  v_day DATE := DATE '2026-06-12';
  v_promote UUID := gen_random_uuid();
  v_promote_child UUID := gen_random_uuid();
  v_demote UUID := gen_random_uuid();
  v_demote_child UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_promote, 'authenticated', 'authenticated', 'tier_promote_' || v_promote::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '30 days', NOW()),
    (v_promote_child, 'authenticated', 'authenticated', 'tier_promote_child_' || v_promote_child::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '30 days', NOW()),
    (v_demote, 'authenticated', 'authenticated', 'tier_demote_' || v_demote::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '30 days', NOW()),
    (v_demote_child, 'authenticated', 'authenticated', 'tier_demote_child_' || v_demote_child::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '30 days', NOW());

  UPDATE profiles SET created_at = v_day::TIMESTAMPTZ - INTERVAL '30 days'
   WHERE id IN (v_promote, v_promote_child, v_demote, v_demote_child);

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_promote_child, v_promote), (v_demote_child, v_demote);

  INSERT INTO affiliate_tier_snapshots (
    snapshot_date, affiliate_id, tier_code, computed_tier_code, rolling_30d_volume,
    active_direct_users, affiliate_age_days, is_age_eligible, is_active_eligible,
    elite_override_active, demotion_candidate_since
  ) VALUES (
    v_day - 1, v_promote, 'standard', 'standard', '0.000000',
    0, 29, TRUE, FALSE, FALSE, NULL
  ), (
    v_day - 1, v_demote, 'gold', 'gold', '1000.000000',
    1, 29, TRUE, TRUE, FALSE, NULL
  );

  PERFORM _credit_system_account('house_fee_usdt', '1000.000000', 'spot_buy_fee', v_promote_child, 'tier-promote', gen_random_uuid());

  PERFORM rpc_refresh_affiliate_tier_snapshots(v_day);
  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_promote) = 'gold',
    'promotion to a newly earned higher tier must be immediate';
  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_demote) = 'gold',
    'first day below a prior tier must keep the prior tier during demotion grace';
  ASSERT (SELECT demotion_candidate_since FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_demote) = v_day,
    'first below-threshold snapshot must start the demotion candidate date';

  PERFORM rpc_refresh_affiliate_tier_snapshots(v_day + 6);
  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day + 6 AND affiliate_id = v_demote) = 'gold',
    'demotion grace must last through day six';

  PERFORM rpc_refresh_affiliate_tier_snapshots(v_day + 7);
  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day + 7 AND affiliate_id = v_demote) = 'standard',
    'demotion must apply on day seven below threshold';

  RAISE NOTICE 'AFFILIATE TIER MOVEMENT OK — immediate promotion and 7-day demotion grace hold';
END;
$$;
ROLLBACK;

-- ── 3. Elite override is admin-only and reflected in snapshots ───────────────
BEGIN;
DO $$
DECLARE
  v_day DATE := DATE '2026-06-12';
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_affiliate UUID := gen_random_uuid();
  v_child UUID := gen_random_uuid();
  v_msg TEXT;
  v_forbidden BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'tier_admin_' || v_admin::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '30 days', NOW()),
    (v_user, 'authenticated', 'authenticated', 'tier_user_' || v_user::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '30 days', NOW()),
    (v_affiliate, 'authenticated', 'authenticated', 'tier_elite_' || v_affiliate::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '30 days', NOW()),
    (v_child, 'authenticated', 'authenticated', 'tier_elite_child_' || v_child::TEXT || '@test.local', v_day::TIMESTAMPTZ - INTERVAL '30 days', NOW());

  UPDATE profiles SET role = 'admin', created_at = v_day::TIMESTAMPTZ - INTERVAL '30 days' WHERE id = v_admin;
  UPDATE profiles SET created_at = v_day::TIMESTAMPTZ - INTERVAL '30 days'
   WHERE id IN (v_user, v_affiliate, v_child);

  INSERT INTO affiliate_relationships (child_id, parent_id) VALUES (v_child, v_affiliate);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_set_affiliate_elite_override(v_affiliate, TRUE, 'operator approval');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'forbidden' THEN v_forbidden := TRUE; END IF;
  END;
  ASSERT v_forbidden, format('non-admin elite override must be forbidden, got %s', COALESCE(v_msg, '<none>'));

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT)::TEXT, true);
  PERFORM rpc_set_affiliate_elite_override(v_affiliate, TRUE, 'operator approval');
  PERFORM rpc_refresh_affiliate_tier_snapshots(v_day);

  ASSERT (SELECT tier_code FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_affiliate) = 'elite',
    'active elite override must force elite snapshot tier';
  ASSERT (SELECT elite_override_active FROM affiliate_tier_snapshots WHERE snapshot_date = v_day AND affiliate_id = v_affiliate) = TRUE,
    'snapshot must record active elite override';
  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
     WHERE actor_id = v_admin
       AND action = 'affiliate_elite_override_set'
       AND entity_type = 'affiliate_elite_overrides'
       AND entity_id = v_affiliate
  ), 'admin elite override must write an audit log';

  RAISE NOTICE 'AFFILIATE ELITE OVERRIDE OK — admin-only override is snapshotted and audited';
END;
$$;
ROLLBACK;
