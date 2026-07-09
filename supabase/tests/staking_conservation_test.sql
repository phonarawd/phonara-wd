-- Launch RC — staking USDT stake → reward conservation (Σ=0)
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_phon_before NUMERIC;
  v_usdt_before NUMERIC;
  v_pos JSONB;
  v_pos_id UUID;
  v_claim JSONB;
  v_unstake JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid, 'authenticated', 'authenticated', 'stake_' || v_uid::TEXT || '@test.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'admin_' || v_admin::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '5000.000000', phon_available = '100.000000' WHERE user_id = v_uid;

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_staking_enabled';

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON'),
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  INTO v_phon_before, v_usdt_before;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  v_pos := rpc_stake('BTC', 'USDT', 'flexible', '1000.000000', 'stake-rc-' || v_uid::TEXT);
  v_pos_id := (v_pos->>'position_id')::UUID;
  ASSERT v_pos_id IS NOT NULL, 'stake must return position_id';

  UPDATE staking_positions SET staked_at = NOW() - INTERVAL '30 days' WHERE id = v_pos_id;

  v_claim := rpc_claim_staking_reward(v_pos_id);
  ASSERT (v_claim->>'claimed')::BOOLEAN = TRUE, 'claim should succeed';
  ASSERT v_claim->>'reward_currency' = 'USDT', 'reward must match stake_currency (USDT)';

  v_unstake := rpc_unstake_phon(v_pos_id);
  ASSERT (v_unstake->>'unstaked')::BOOLEAN = TRUE, 'unstake should succeed';
  ASSERT v_unstake->>'stake_currency' = 'USDT', 'principal unlock currency must be USDT';

  ASSERT (
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  ) = v_phon_before,
    'PHON grand total must be conserved after USDT stake reward';

  ASSERT (
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  ) = v_usdt_before,
    'USDT grand total must be conserved after USDT stake/unstake';

  RAISE NOTICE 'STAKING CONSERVATION OK — USDT stake, same-currency reward, Σ=0';
END;
$$;

ROLLBACK;
