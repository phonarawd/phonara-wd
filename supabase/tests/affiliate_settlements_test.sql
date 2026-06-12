-- ============================================================
-- Affiliate settlements — SQL integration tests
-- ============================================================
-- Settlement payouts must be idempotent, two-level only, capped at 50% of the
-- child affiliate's RG-clean downline GGR, and conservation/hash-chain clean.
-- ============================================================

-- ── 1. Duplicate batch, cap reduction, paid-once, Σ=0, hash chains ───────────
BEGIN;
DO $$
DECLARE
  v_day DATE := CURRENT_DATE;
  v_parent UUID := gen_random_uuid();
  v_child_affiliate UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_before_usdt NUMERIC;
  v_after_usdt NUMERIC;
  v_child_before NUMERIC;
  v_parent_before NUMERIC;
  v_child_after NUMERIC;
  v_parent_after NUMERIC;
  v_res JSONB;
  v_res_again JSONB;
  v_child_settlement affiliate_settlements%ROWTYPE;
  v_parent_settlement affiliate_settlements%ROWTYPE;
  v_wallet_ledger_count INT;
  v_system_ledger_count INT;
  v_broken INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_parent, 'authenticated', 'authenticated', 'settle_parent_' || v_parent::TEXT || '@test.local', NOW(), NOW()),
    (v_child_affiliate, 'authenticated', 'authenticated', 'settle_child_aff_' || v_child_affiliate::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'settle_user_' || v_user::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_child_affiliate, v_parent), (v_user, v_child_affiliate);

  UPDATE affiliate_tier_configs
     SET direct_commission_bps = 4000,
         override_commission_bps = 2000
   WHERE tier_code = 'standard';

  INSERT INTO affiliate_tier_snapshots (
    snapshot_date, affiliate_id, tier_code, computed_tier_code, rolling_30d_volume,
    active_direct_users, affiliate_age_days, is_age_eligible, is_active_eligible,
    elite_override_active, demotion_candidate_since
  ) VALUES (
    v_day, v_parent, 'standard', 'standard', '0.000000',
    0, 30, TRUE, FALSE, FALSE, NULL
  ), (
    v_day, v_child_affiliate, 'standard', 'standard', '1000.000000',
    1, 30, TRUE, TRUE, FALSE, NULL
  );

  INSERT INTO affiliate_commission_daily_aggregates (
    aggregate_date, affiliate_id, referred_id, domain, currency, gross_revenue
  ) VALUES (
    v_day, v_child_affiliate, v_user, 'trading', 'USDT', '1000.000000'
  );

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_before_usdt;
  SELECT usdt_available::NUMERIC INTO v_child_before FROM wallets WHERE user_id = v_child_affiliate;
  SELECT usdt_available::NUMERIC INTO v_parent_before FROM wallets WHERE user_id = v_parent;

  v_res := rpc_run_affiliate_settlements(v_day);
  v_res_again := rpc_run_affiliate_settlements(v_day);

  ASSERT (v_res->>'paid')::INT = 2, format('first batch must pay child + parent, got %s', v_res);
  ASSERT (v_res_again->>'paid')::INT = 0, format('duplicate batch must not pay again, got %s', v_res_again);

  SELECT * INTO v_child_settlement
    FROM affiliate_settlements
   WHERE settlement_date = v_day AND affiliate_id = v_child_affiliate;
  SELECT * INTO v_parent_settlement
    FROM affiliate_settlements
   WHERE settlement_date = v_day AND affiliate_id = v_parent;

  ASSERT v_child_settlement.state = 'paid', 'child settlement must be paid';
  ASSERT v_parent_settlement.state = 'paid', 'parent settlement must be paid';
  ASSERT v_child_settlement.total_commission->>'USDT' = '400.000000',
    format('child own commission must remain 400, got %s', v_child_settlement.total_commission);
  ASSERT v_parent_settlement.override_commission_raw->>'USDT' = '200.000000',
    format('parent raw override must be 200, got %s', v_parent_settlement.override_commission_raw);
  ASSERT v_parent_settlement.override_commission->>'USDT' = '100.000000',
    format('parent override must be reduced to cap residual 100, got %s', v_parent_settlement.override_commission);
  ASSERT v_parent_settlement.cap_reduction->>'USDT' = '100.000000',
    format('cap reduction must record 100, got %s', v_parent_settlement.cap_reduction);

  SELECT usdt_available::NUMERIC INTO v_child_after FROM wallets WHERE user_id = v_child_affiliate;
  SELECT usdt_available::NUMERIC INTO v_parent_after FROM wallets WHERE user_id = v_parent;
  ASSERT v_child_after - v_child_before = 400,
    format('child wallet must be credited once by 400, before=%s after=%s', v_child_before, v_child_after);
  ASSERT v_parent_after - v_parent_before = 100,
    format('parent wallet must be credited once by 100, before=%s after=%s', v_parent_before, v_parent_after);

  SELECT COUNT(*) INTO v_wallet_ledger_count
    FROM wallet_ledger
   WHERE idempotency_key IN (
     'affiliate:settlement:' || v_day::TEXT || ':' || v_child_affiliate::TEXT || ':USDT',
     'affiliate:settlement:' || v_day::TEXT || ':' || v_parent::TEXT || ':USDT'
   );
  ASSERT v_wallet_ledger_count = 2,
    format('paid-once wallet ledger keys must create two rows total, got %s', v_wallet_ledger_count);

  SELECT COUNT(*) INTO v_system_ledger_count
    FROM system_account_ledger
   WHERE reason_code = 'affiliate_commission_payout'
     AND related_tx_id IN (v_child_settlement.id::TEXT, v_parent_settlement.id::TEXT);
  ASSERT v_system_ledger_count = 2,
    format('system counter-legs must be written once per paid settlement, got %s', v_system_ledger_count);

  SELECT
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_after_usdt;
  ASSERT v_after_usdt = v_before_usdt,
    format('USDT Σ=0 must hold across affiliate payouts: before=%s after=%s', v_before_usdt, v_after_usdt);

  SELECT COUNT(*) INTO v_broken FROM verify_ledger_hash_chain(v_child_affiliate);
  ASSERT v_broken = 0, format('child wallet hash chain broken rows=%s', v_broken);
  SELECT COUNT(*) INTO v_broken FROM verify_ledger_hash_chain(v_parent);
  ASSERT v_broken = 0, format('parent wallet hash chain broken rows=%s', v_broken);
  SELECT COUNT(*) INTO v_broken FROM verify_system_account_hash_chain('affiliate_commission_expense_usdt');
  ASSERT v_broken = 0, format('affiliate expense system hash chain broken rows=%s', v_broken);

  RAISE NOTICE 'AFFILIATE SETTLEMENT OK — duplicate batch, cap reduction, paid-once, Σ=0, hash chains';
END;
$$;
ROLLBACK;

-- ── 2. Override floor: child commission can consume the whole 50% cap ─────────
BEGIN;
DO $$
DECLARE
  v_day DATE := CURRENT_DATE;
  v_parent UUID := gen_random_uuid();
  v_child_affiliate UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_parent_settlement affiliate_settlements%ROWTYPE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_parent, 'authenticated', 'authenticated', 'floor_parent_' || v_parent::TEXT || '@test.local', NOW(), NOW()),
    (v_child_affiliate, 'authenticated', 'authenticated', 'floor_child_aff_' || v_child_affiliate::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'floor_user_' || v_user::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_child_affiliate, v_parent), (v_user, v_child_affiliate);

  UPDATE affiliate_tier_configs
     SET direct_commission_bps = 6000,
         override_commission_bps = 2000
   WHERE tier_code = 'standard';

  INSERT INTO affiliate_tier_snapshots (
    snapshot_date, affiliate_id, tier_code, computed_tier_code, rolling_30d_volume,
    active_direct_users, affiliate_age_days, is_age_eligible, is_active_eligible,
    elite_override_active, demotion_candidate_since
  ) VALUES (
    v_day, v_parent, 'standard', 'standard', '0.000000',
    0, 30, TRUE, FALSE, FALSE, NULL
  ), (
    v_day, v_child_affiliate, 'standard', 'standard', '1000.000000',
    1, 30, TRUE, TRUE, FALSE, NULL
  );

  INSERT INTO affiliate_commission_daily_aggregates (
    aggregate_date, affiliate_id, referred_id, domain, currency, gross_revenue
  ) VALUES (
    v_day, v_child_affiliate, v_user, 'trading', 'USDT', '1000.000000'
  );

  PERFORM rpc_run_affiliate_settlements(v_day);

  SELECT * INTO v_parent_settlement
    FROM affiliate_settlements
   WHERE settlement_date = v_day AND affiliate_id = v_parent;

  ASSERT v_parent_settlement.override_commission_raw->>'USDT' = '200.000000',
    format('parent raw override must still be 200, got %s', v_parent_settlement.override_commission_raw);
  ASSERT v_parent_settlement.override_commission->>'USDT' = '0.000000',
    format('parent override must floor at zero, got %s', v_parent_settlement.override_commission);
  ASSERT v_parent_settlement.total_commission->>'USDT' = '0.000000',
    format('zero override must not create parent payout, got %s', v_parent_settlement.total_commission);

  ASSERT NOT EXISTS (
    SELECT 1
      FROM wallet_ledger
     WHERE idempotency_key = 'affiliate:settlement:' || v_day::TEXT || ':' || v_parent::TEXT || ':USDT'
  ), 'zero parent override must not write a wallet ledger row';

  RAISE NOTICE 'AFFILIATE OVERRIDE FLOOR OK — parent override never becomes negative';
END;
$$;
ROLLBACK;
