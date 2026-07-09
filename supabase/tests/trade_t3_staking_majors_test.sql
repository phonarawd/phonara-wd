-- T3 — majors staking rpc_stake · claim · unstake · Σ=0 (no early-unstake penalty leg)
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_phon_before NUMERIC;
  v_usdt_before NUMERIC;
  v_btc_usdt JSONB;
  v_eth_phon JSONB;
  v_phon_native JSONB;
  v_pos_id UUID;
  v_claim JSONB;
  v_unstake JSONB;
  v_locked_id UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 't3stake_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET usdt_available = '10000.000000', phon_available = '5000.000000' WHERE user_id = v_uid;

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

  -- BTC · USDT · flexible
  v_btc_usdt := rpc_stake('BTC', 'USDT', 'flexible', '500.000000', 't3-btc-usdt-' || v_uid::TEXT);
  v_pos_id := (v_btc_usdt->>'position_id')::UUID;
  ASSERT v_btc_usdt->>'reference_asset' = 'BTC', 'reference_asset must be BTC';
  ASSERT v_btc_usdt->>'stake_currency' = 'USDT', 'stake_currency must be USDT';

  UPDATE staking_positions SET staked_at = NOW() - INTERVAL '14 days' WHERE id = v_pos_id;
  v_claim := rpc_claim_staking_reward(v_pos_id);
  ASSERT (v_claim->>'claimed')::BOOLEAN = TRUE, 'BTC/USDT claim should succeed';
  ASSERT v_claim->>'reward_currency' = 'USDT', 'BTC/USDT reward currency must be USDT';

  v_unstake := rpc_unstake_phon(v_pos_id);
  ASSERT (v_unstake->>'unstaked')::BOOLEAN = TRUE, 'BTC/USDT unstake should succeed';

  -- ETH · PHON · days_30
  v_eth_phon := rpc_stake('ETH', 'PHON', 'days_30', '200.000000', 't3-eth-phon-' || v_uid::TEXT);
  v_pos_id := (v_eth_phon->>'position_id')::UUID;
  UPDATE staking_positions SET staked_at = NOW() - INTERVAL '45 days', unlock_at = NOW() - INTERVAL '1 day'
  WHERE id = v_pos_id;

  v_unstake := rpc_unstake_phon(v_pos_id);
  ASSERT (v_unstake->>'unstaked')::BOOLEAN = TRUE, 'ETH/PHON unstake after unlock should succeed';
  ASSERT v_unstake->>'stake_currency' = 'PHON', 'ETH/PHON principal currency must be PHON';

  -- PHON native via rpc_stake_phon wrapper
  v_phon_native := rpc_stake_phon('flexible', '100.000000', 't3-phon-native-' || v_uid::TEXT);
  v_pos_id := (v_phon_native->>'position_id')::UUID;
  v_unstake := rpc_unstake_phon(v_pos_id);
  ASSERT (v_unstake->>'unstaked')::BOOLEAN = TRUE, 'PHON native unstake should succeed';

  -- Locked position rejects early unstake (no penalty fee leg — still_locked only)
  v_locked_id := (rpc_stake('SOL', 'USDT', 'days_30', '50.000000', 't3-sol-lock-' || v_uid::TEXT)->>'position_id')::UUID;
  BEGIN
    PERFORM rpc_unstake_phon(v_locked_id);
    RAISE EXCEPTION 'expected still_locked for early unstake';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%still_locked%', 'early unstake must raise still_locked without fee leg';
  END;

  ASSERT (
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  ) = v_phon_before,
    'PHON Σ must be conserved across majors staking flows';

  ASSERT (
    (SELECT COALESCE(SUM(usdt_available::NUMERIC + usdt_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'USDT')
  ) = v_usdt_before,
    'USDT Σ must be conserved across majors staking flows';

  ASSERT (SELECT COUNT(*) FROM staking_pools WHERE is_active) >= 84,
    'active staking pool catalog must include majors matrix';

  RAISE NOTICE 'T3 STAKING MAJORS OK — rpc_stake · claim · unstake · Σ=0';
END;
$$;

ROLLBACK;
