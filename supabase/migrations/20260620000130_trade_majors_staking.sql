-- ============================================================
-- Trade majors: staking pools reference_asset + rpc_stake
-- ============================================================

SET search_path = public, pg_temp;

ALTER TABLE staking_pools
  ADD COLUMN IF NOT EXISTS reference_asset TEXT,
  ADD COLUMN IF NOT EXISTS stake_currency currency,
  ADD COLUMN IF NOT EXISTS reward_currency currency,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

UPDATE staking_pools
   SET reference_asset = COALESCE(reference_asset, 'PHON'),
       stake_currency = COALESCE(stake_currency, 'PHON'::currency),
       reward_currency = COALESCE(reward_currency, 'PHON'::currency),
       display_name = COALESCE(display_name, 'PHON Staking')
 WHERE reference_asset IS NULL OR stake_currency IS NULL;

ALTER TABLE staking_pools
  ALTER COLUMN reference_asset SET NOT NULL,
  ALTER COLUMN stake_currency SET NOT NULL,
  ALTER COLUMN reward_currency SET NOT NULL;

ALTER TABLE staking_pools DROP CONSTRAINT IF EXISTS staking_pools_term_key;
CREATE UNIQUE INDEX IF NOT EXISTS staking_pools_ref_curr_term_uidx
  ON staking_pools (reference_asset, stake_currency, term);

ALTER TABLE staking_positions
  ADD COLUMN IF NOT EXISTS stake_currency currency,
  ADD COLUMN IF NOT EXISTS reference_asset TEXT;

UPDATE staking_positions sp
   SET stake_currency = COALESCE(sp.stake_currency, p.stake_currency),
       reference_asset = COALESCE(sp.reference_asset, p.reference_asset)
  FROM staking_pools p
 WHERE sp.pool_id = p.id
   AND (sp.stake_currency IS NULL OR sp.reference_asset IS NULL);

-- Tier-1 launch subset: flexible + days_30 × USDT/PHON per reference asset
DO $$
DECLARE
  v_base TEXT;
  v_apr_flex TEXT;
  v_apr_30 TEXT;
  v_sort INT := 200;
  v_bases TEXT[] := ARRAY[
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT',
    'MATIC', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'SUI'
  ];
  v_aprs JSONB := '{
    "BTC": {"flex": "0.031", "30": "0.045"},
    "ETH": {"flex": "0.035", "30": "0.050"},
    "SOL": {"flex": "0.055", "30": "0.075"},
    "DEFAULT": {"flex": "0.040", "30": "0.060"}
  }'::JSONB;
  v_apr_obj JSONB;
  v_curr currency;
BEGIN
  FOREACH v_base IN ARRAY v_bases LOOP
    v_apr_obj := COALESCE(v_aprs -> v_base, v_aprs -> 'DEFAULT');
    v_apr_flex := v_apr_obj ->> 'flex';
    v_apr_30 := v_apr_obj ->> '30';
    v_sort := v_sort + 10;

    FOREACH v_curr IN ARRAY ARRAY['USDT'::currency, 'PHON'::currency] LOOP
      INSERT INTO staking_pools (
        term, lock_days, estimated_apr, is_active,
        reference_asset, stake_currency, reward_currency, display_name, sort_order
      )
      VALUES (
        'flexible', 0, v_apr_flex, TRUE,
        v_base, v_curr, v_curr, v_base || ' · ' || v_curr::TEXT || ' Flexible', v_sort
      )
      ON CONFLICT (reference_asset, stake_currency, term) DO UPDATE SET
        estimated_apr = EXCLUDED.estimated_apr,
        display_name = EXCLUDED.display_name,
        is_active = TRUE;

      INSERT INTO staking_pools (
        term, lock_days, estimated_apr, is_active,
        reference_asset, stake_currency, reward_currency, display_name, sort_order
      )
      VALUES (
        'days_30', 30, v_apr_30, TRUE,
        v_base, v_curr, v_curr, v_base || ' · ' || v_curr::TEXT || ' 30D', v_sort + 1
      )
      ON CONFLICT (reference_asset, stake_currency, term) DO UPDATE SET
        estimated_apr = EXCLUDED.estimated_apr,
        display_name = EXCLUDED.display_name,
        is_active = TRUE;
    END LOOP;
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION rpc_stake(
  p_reference_asset   TEXT,
  p_stake_currency    TEXT,
  p_term              TEXT,
  p_amount            TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pool staking_pools%ROWTYPE;
  v_amount NUMERIC;
  v_pos_id UUID;
  v_unlock TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_stake');
  PERFORM _assert_feature_enabled('staking');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_amount);

  IF p_stake_currency NOT IN ('USDT', 'PHON') THEN
    RAISE EXCEPTION 'invalid_stake_currency';
  END IF;

  IF p_client_request_id IS NOT NULL THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_stake')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN RAISE EXCEPTION 'duplicate_request'; END IF;
    v_pos_id := _uuid_from_md5('stake:' || v_user_id::TEXT || ':' || p_client_request_id);
  ELSE
    v_pos_id := gen_random_uuid();
  END IF;

  v_amount := p_amount::NUMERIC;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT * INTO v_pool
    FROM staking_pools
   WHERE reference_asset = p_reference_asset
     AND stake_currency = p_stake_currency::currency
     AND term = p_term::staking_term
     AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'pool_not_found'; END IF;

  PERFORM _lock_wallet_internal(v_user_id, p_stake_currency::currency, _fmt6(v_amount),
    'staking_lock', 'stake_lock:' || v_pos_id::TEXT);

  IF v_pool.lock_days > 0 THEN
    v_unlock := NOW() + (v_pool.lock_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO staking_positions (
    id, user_id, pool_id, term, principal, apr_snapshot, lock_days, unlock_at,
    stake_currency, reference_asset
  )
  VALUES (
    v_pos_id, v_user_id, v_pool.id, v_pool.term, _fmt6(v_amount), v_pool.estimated_apr,
    v_pool.lock_days, v_unlock, p_stake_currency::currency, p_reference_asset
  );

  RETURN jsonb_build_object(
    'position_id', v_pos_id,
    'reference_asset', p_reference_asset,
    'stake_currency', p_stake_currency,
    'term', p_term,
    'principal', _fmt6(v_amount),
    'apr', v_pool.estimated_apr,
    'unlock_at', v_unlock
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_stake_phon(
  p_term TEXT,
  p_amount TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN rpc_stake('PHON', 'PHON', p_term, p_amount, p_client_request_id);
END;
$$;

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
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
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

  INSERT INTO staking_rewards (id, staking_position_id, user_id, reward_amount, ledger_entry_id)
  VALUES (v_reward_id, p_position_id, v_user_id, _fmt6(v_payable), v_ledger_id);

  UPDATE staking_positions SET reward_claimed = _fmt6(v_claimed + v_payable) WHERE id = p_position_id;

  RETURN jsonb_build_object('claimed', TRUE, 'reward', _fmt6(v_payable),
    'reward_currency', v_curr::TEXT, 'total_claimed', _fmt6(v_claimed + v_payable));
END;
$$;

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
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
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
    'stake_currency', v_curr::TEXT, 'final_reward', _fmt6(v_payable));
END;
$$;

REVOKE ALL ON FUNCTION rpc_stake(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_stake(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_stake_phon(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_stake_phon(TEXT, TEXT, TEXT) TO authenticated, service_role;
