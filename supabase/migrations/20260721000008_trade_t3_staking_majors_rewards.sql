-- ============================================================
-- Migration: 20260721000008_trade_t3_staking_majors_rewards
-- Trade Wave T3: majors staking same-currency rewards · Σ=0 USDT leg
-- ============================================================
-- Reverts launch_rc H2 "rewards always PHON" for majors pools.
-- PHON rewards: reward_issuance_phon (existing _credit_wallet_internal path).
-- USDT rewards: house_liquidity_usdt counterparty debit per claim/unstake.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Pool catalog: reward_currency mirrors stake_currency ────────────────────

UPDATE staking_pools
SET reward_currency = stake_currency
WHERE reward_currency IS DISTINCT FROM stake_currency;

-- ─── rpc_claim_staking_reward — same-currency reward ─────────────────────────

CREATE OR REPLACE FUNCTION rpc_claim_staking_reward(p_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pos staking_positions%ROWTYPE;
  v_pool staking_pools%ROWTYPE;
  v_accrued NUMERIC;
  v_claimed NUMERIC;
  v_payable NUMERIC;
  v_elapsed_days NUMERIC;
  v_reward_id UUID := gen_random_uuid();
  v_ledger_id UUID;
  v_curr currency;
  v_tid UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_claim_staking_reward');
  PERFORM _assert_feature_enabled('staking');

  SELECT * INTO v_pos FROM staking_positions WHERE id = p_position_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_pos.status <> 'active' THEN RAISE EXCEPTION 'not_active'; END IF;

  SELECT * INTO v_pool FROM staking_pools WHERE id = v_pos.pool_id;
  v_curr := COALESCE(v_pos.stake_currency, v_pool.reward_currency, 'PHON'::currency);

  v_elapsed_days := EXTRACT(EPOCH FROM (NOW() - v_pos.staked_at)) / 86400.0;
  v_accrued := v_pos.principal::NUMERIC * v_pos.apr_snapshot::NUMERIC * (v_elapsed_days / 365.0);
  v_claimed := v_pos.reward_claimed::NUMERIC;
  v_payable := v_accrued - v_claimed;

  IF trunc(v_payable, 6) <= 0 THEN
    RETURN jsonb_build_object('claimed', FALSE, 'reason', 'nothing_to_claim', 'reward', '0.000000');
  END IF;

  v_ledger_id := _credit_wallet_internal(v_user_id, v_curr, _fmt6(v_payable),
    'staking_reward', 'stake_reward:' || v_reward_id::TEXT);

  IF v_curr = 'USDT' THEN
    v_tid := gen_random_uuid();
    PERFORM _debit_system_account('house_liquidity_usdt', _fmt6(v_payable),
      'staking_reward', v_user_id, v_reward_id::TEXT, v_tid);
  END IF;

  INSERT INTO staking_rewards (id, staking_position_id, user_id, reward_amount, ledger_entry_id)
  VALUES (v_reward_id, p_position_id, v_user_id, _fmt6(v_payable), v_ledger_id);

  UPDATE staking_positions SET reward_claimed = _fmt6(v_claimed + v_payable) WHERE id = p_position_id;

  RETURN jsonb_build_object('claimed', TRUE, 'reward', _fmt6(v_payable),
    'reward_currency', v_curr::TEXT, 'total_claimed', _fmt6(v_claimed + v_payable));
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_staking_reward(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_staking_reward(UUID) TO authenticated, service_role;

-- ─── rpc_unstake_phon — auto-claim in stake_currency ─────────────────────────

CREATE OR REPLACE FUNCTION rpc_unstake_phon(p_position_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pos staking_positions%ROWTYPE;
  v_pool staking_pools%ROWTYPE;
  v_accrued NUMERIC;
  v_claimed NUMERIC;
  v_payable NUMERIC;
  v_elapsed_days NUMERIC;
  v_reward_id UUID := gen_random_uuid();
  v_ledger_id UUID;
  v_curr currency;
  v_tid UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_unstake_phon');
  PERFORM _assert_feature_enabled('staking');

  SELECT * INTO v_pos FROM staking_positions WHERE id = p_position_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'position_not_found'; END IF;
  IF v_pos.user_id <> v_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_pos.status <> 'active' THEN RAISE EXCEPTION 'not_active'; END IF;

  IF v_pos.lock_days > 0 AND v_pos.unlock_at IS NOT NULL AND NOW() < v_pos.unlock_at THEN
    RAISE EXCEPTION 'still_locked';
  END IF;

  SELECT * INTO v_pool FROM staking_pools WHERE id = v_pos.pool_id;
  v_curr := COALESCE(v_pos.stake_currency, v_pool.stake_currency, 'PHON'::currency);

  v_elapsed_days := EXTRACT(EPOCH FROM (NOW() - v_pos.staked_at)) / 86400.0;
  v_accrued := v_pos.principal::NUMERIC * v_pos.apr_snapshot::NUMERIC * (v_elapsed_days / 365.0);
  v_claimed := v_pos.reward_claimed::NUMERIC;
  v_payable := v_accrued - v_claimed;

  IF trunc(v_payable, 6) > 0 THEN
    v_ledger_id := _credit_wallet_internal(v_user_id, v_curr, _fmt6(v_payable),
      'staking_reward', 'stake_reward:' || v_reward_id::TEXT);
    IF v_curr = 'USDT' THEN
      v_tid := gen_random_uuid();
      PERFORM _debit_system_account('house_liquidity_usdt', _fmt6(v_payable),
        'staking_reward', v_user_id, v_reward_id::TEXT, v_tid);
    END IF;
    INSERT INTO staking_rewards (id, staking_position_id, user_id, reward_amount, ledger_entry_id)
    VALUES (v_reward_id, p_position_id, v_user_id, _fmt6(v_payable), v_ledger_id);
  ELSE
    v_payable := 0;
  END IF;

  PERFORM _unlock_wallet_internal(v_user_id, v_curr, v_pos.principal,
    'staking_unlock', 'stake_unlock:' || p_position_id::TEXT);

  UPDATE staking_positions SET
    status = 'unstaked',
    reward_claimed = _fmt6(v_claimed + v_payable),
    unstaked_at = NOW()
  WHERE id = p_position_id;

  RETURN jsonb_build_object('unstaked', TRUE, 'principal_returned', v_pos.principal,
    'stake_currency', v_curr::TEXT, 'final_reward', _fmt6(v_payable),
    'reward_currency', v_curr::TEXT);
END;
$$;

REVOKE ALL ON FUNCTION rpc_unstake_phon(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_unstake_phon(UUID) TO authenticated, service_role;
