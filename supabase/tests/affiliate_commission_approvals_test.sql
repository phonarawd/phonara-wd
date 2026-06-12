-- ============================================================
-- Affiliate commission approvals — SQL integration tests
-- ============================================================
-- High-value affiliate commission settlements must pause for admin approval.
-- Approval is admin-only, reasoned, audited, self-approval blocked, and payout
-- still uses the T4 settlement money path.
-- ============================================================

BEGIN;
DO $$
DECLARE
  v_day DATE := CURRENT_DATE;
  v_admin UUID := gen_random_uuid();
  v_affiliate UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_approval_id UUID;
  v_settlement affiliate_settlements%ROWTYPE;
  v_wallet_before NUMERIC;
  v_wallet_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'approval_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_affiliate, 'authenticated', 'authenticated', 'approval_aff_' || v_affiliate::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'approval_user_' || v_user::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  UPDATE app_config
     SET value = '100.000000'
   WHERE key = 'affiliate_commission_approval_threshold_usdt';

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_user, v_affiliate);

  UPDATE affiliate_tier_configs
     SET direct_commission_bps = 5000
   WHERE tier_code IN ('standard', 'elite');

  INSERT INTO affiliate_tier_snapshots (
    snapshot_date, affiliate_id, tier_code, computed_tier_code, rolling_30d_volume,
    active_direct_users, affiliate_age_days, is_age_eligible, is_active_eligible,
    elite_override_active, demotion_candidate_since
  ) VALUES (
    v_day, v_affiliate, 'elite', 'elite', '1000.000000',
    1, 30, TRUE, TRUE, TRUE, NULL
  );

  INSERT INTO affiliate_commission_daily_aggregates (
    aggregate_date, affiliate_id, referred_id, domain, currency, gross_revenue
  ) VALUES (
    v_day, v_affiliate, v_user, 'trading', 'USDT', '1000.000000'
  );

  SELECT usdt_available::NUMERIC INTO v_wallet_before
    FROM wallets
   WHERE user_id = v_affiliate;

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_run_affiliate_settlements(v_day);

  SELECT * INTO v_settlement
    FROM affiliate_settlements
   WHERE settlement_date = v_day
     AND affiliate_id = v_affiliate;

  ASSERT v_settlement.state = 'pending_approval',
    format('high-value elite settlement must wait for approval, got %s', v_settlement.state);
  ASSERT v_settlement.total_commission->>'USDT' = '500.000000',
    format('settlement total must be computed before approval, got %s', v_settlement.total_commission);

  SELECT usdt_available::NUMERIC INTO v_wallet_after
    FROM wallets
   WHERE user_id = v_affiliate;
  ASSERT v_wallet_after = v_wallet_before,
    format('pending approval must not credit wallet before approval, before=%s after=%s', v_wallet_before, v_wallet_after);

  SELECT id INTO v_approval_id
    FROM affiliate_commission_approvals
   WHERE settlement_id = v_settlement.id;
  ASSERT v_approval_id IS NOT NULL, 'high-value settlement must create an approval row';

  ASSERT EXISTS (
    SELECT 1
      FROM admin_review_queue
     WHERE entity_type = 'affiliate_commission_approval'
       AND entity_id = v_approval_id
       AND status = 'pending'
  ), 'high-value settlement must enter admin review queue';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);
  PERFORM rpc_approve_affiliate_commission(v_approval_id, 'reviewed high-value affiliate commission');

  SELECT * INTO v_settlement
    FROM affiliate_settlements
   WHERE id = v_settlement.id;
  ASSERT v_settlement.state = 'paid',
    format('approved affiliate settlement must be paid, got %s', v_settlement.state);

  SELECT usdt_available::NUMERIC INTO v_wallet_after
    FROM wallets
   WHERE user_id = v_affiliate;
  ASSERT v_wallet_after - v_wallet_before = 500,
    format('admin approval must credit exactly once by 500, before=%s after=%s', v_wallet_before, v_wallet_after);

  ASSERT EXISTS (
    SELECT 1
      FROM audit_logs
     WHERE action = 'affiliate_commission_approved'
       AND entity_id = v_approval_id
       AND actor_id = v_admin
  ), 'affiliate approval must write audit log';

  ASSERT EXISTS (
    SELECT 1
      FROM admin_review_queue
     WHERE entity_type = 'affiliate_commission_approval'
       AND entity_id = v_approval_id
       AND status = 'resolved'
       AND resolved_by = v_admin
  ), 'approval must resolve admin review queue';

  RAISE NOTICE 'AFFILIATE APPROVAL OK — high-value commission waits, admin approval pays and audits';
END;
$$;
ROLLBACK;

BEGIN;
DO $$
DECLARE
  v_day DATE := CURRENT_DATE;
  v_self_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_approval_id UUID;
  v_msg TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_self_admin, 'authenticated', 'authenticated', 'self_approval_admin_' || v_self_admin::TEXT || '@test.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'self_approval_user_' || v_user::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_self_admin;

  UPDATE app_config
     SET value = '100.000000'
   WHERE key = 'affiliate_commission_approval_threshold_usdt';

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_user, v_self_admin);

  UPDATE affiliate_tier_configs
     SET direct_commission_bps = 5000
   WHERE tier_code = 'standard';

  INSERT INTO affiliate_tier_snapshots (
    snapshot_date, affiliate_id, tier_code, computed_tier_code, rolling_30d_volume,
    active_direct_users, affiliate_age_days, is_age_eligible, is_active_eligible,
    elite_override_active, demotion_candidate_since
  ) VALUES (
    v_day, v_self_admin, 'standard', 'standard', '1000.000000',
    1, 30, TRUE, TRUE, FALSE, NULL
  );

  INSERT INTO affiliate_commission_daily_aggregates (
    aggregate_date, affiliate_id, referred_id, domain, currency, gross_revenue
  ) VALUES (
    v_day, v_self_admin, v_user, 'trading', 'USDT', '1000.000000'
  );

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM rpc_run_affiliate_settlements(v_day);

  SELECT a.id INTO v_approval_id
    FROM affiliate_commission_approvals a
    JOIN affiliate_settlements s ON s.id = a.settlement_id
   WHERE s.settlement_date = v_day
     AND s.affiliate_id = v_self_admin;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_self_admin::TEXT, 'aal', 'aal2')::TEXT, true);
  BEGIN
    PERFORM rpc_approve_affiliate_commission(v_approval_id, 'self approval attempt');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
  END;

  ASSERT v_msg = 'self_approval_forbidden',
    format('self approval must be rejected, got %s', COALESCE(v_msg, '<no error>'));
  ASSERT EXISTS (
    SELECT 1
      FROM affiliate_commission_approvals
     WHERE id = v_approval_id
       AND status = 'pending'
  ), 'self-approval failure must leave approval pending';

  RAISE NOTICE 'AFFILIATE SELF APPROVAL OK — affiliate admin cannot approve own commission';
END;
$$;
ROLLBACK;
