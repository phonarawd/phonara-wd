-- ============================================================
-- Migration: pir_place_game_bet_rg_restore
-- PIR E5 rewrote rpc_place_game_bet and dropped RG hooks that
-- 20260611000073 injected via pg_get_functiondef rewrite.
-- Restore entry guard + post-settle month-loss refresh.
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION rpc_place_game_bet(
  p_round_id UUID,
  p_currency TEXT,
  p_stake TEXT,
  p_selection JSONB,
  p_client_seed TEXT,
  p_idempotency_key TEXT,
  p_expected_result JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_round game_rounds%ROWTYPE;
  v_ccy currency;
  v_stake NUMERIC;
  v_bet_id UUID := gen_random_uuid();
  v_existing game_bets%ROWTYPE;
  v_resolution JSONB;
  v_result JSONB;
  v_multiplier NUMERIC;
  v_raw_payout NUMERIC;
  v_payout NUMERIC;
  v_house NUMERIC;
  v_dust NUMERIC;
  v_status bet_status;
  v_lock_id UUID;
  v_debit_id UUID;
  v_credit_id UUID;
  v_transfer_id UUID := gen_random_uuid();
  v_house_account TEXT;
  v_dup JSONB;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;
  IF p_client_seed IS NULL OR length(btrim(p_client_seed)) = 0 THEN
    RAISE EXCEPTION 'invalid_client_seed';
  END IF;

  v_dup := _pir_game_bet_already_placed(v_user_id, p_idempotency_key);
  IF v_dup IS NOT NULL THEN
    RETURN v_dup;
  END IF;

  PERFORM _enforce_rate_limit(v_user_id, 'rpc_place_game_bet');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('game');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_stake);

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;
  IF v_ccy NOT IN ('PHON', 'USDT') THEN
    RAISE EXCEPTION 'invalid_currency';
  END IF;

  PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'game', v_ccy);

  SELECT * INTO v_round FROM game_rounds WHERE id = p_round_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF v_round.status <> 'open' THEN RAISE EXCEPTION 'round_not_open'; END IF;
  IF v_round.server_seed IS NULL THEN RAISE EXCEPTION 'server_seed_unavailable'; END IF;

  v_stake := p_stake::NUMERIC;
  IF v_stake <= 0 THEN RAISE EXCEPTION 'invalid_stake'; END IF;
  PERFORM _assert_game_feature_enabled(v_round.game);
  PERFORM _assert_game_stake_limits(v_round.game, v_ccy, v_stake);
  PERFORM _assert_game_exposure_cap(v_round.game, v_ccy, v_stake, p_selection);

  v_resolution := _game_result(v_round.game, v_round.server_seed, p_client_seed, 1, p_selection);
  v_result := v_resolution->'result';
  v_multiplier := (v_resolution->>'payout_multiplier')::NUMERIC;
  v_raw_payout := v_stake * v_multiplier;
  v_payout := trunc(v_raw_payout, 6);
  v_dust := trunc(v_raw_payout - v_payout, 6);
  v_house := v_stake - v_payout - v_dust;
  v_status := CASE WHEN v_payout > 0 THEN 'won'::bet_status ELSE 'lost'::bet_status END;
  v_house_account := CASE WHEN v_ccy = 'PHON' THEN 'game_house_phon' ELSE 'game_house_usdt' END;

  v_lock_id := _lock_wallet_internal(
    v_user_id,
    v_ccy,
    _fmt6(v_stake),
    'game_stake_lock',
    'gbet_lock:' || v_user_id::TEXT || ':' || p_idempotency_key
  );

  BEGIN
    INSERT INTO game_bets (
      id, round_id, user_id, game, currency, stake, selection,
      client_seed, nonce, result_payload, payout, status, idempotency_key, stake_lock_id
    ) VALUES (
      v_bet_id, p_round_id, v_user_id, v_round.game, v_ccy, _fmt6(v_stake), p_selection,
      p_client_seed, 1, v_result, _fmt6(v_payout), v_status, p_idempotency_key, v_lock_id
    );
  EXCEPTION WHEN unique_violation THEN
    v_dup := _pir_game_bet_already_placed(v_user_id, p_idempotency_key);
    IF v_dup IS NULL THEN
      RAISE;
    END IF;
    RETURN v_dup;
  END;

  IF p_expected_result IS NOT NULL AND p_expected_result <> v_result THEN
    UPDATE game_bets SET parity_hold = TRUE, status = 'pending' WHERE id = v_bet_id;
    UPDATE app_config SET value = 'false', updated_at = NOW()
      WHERE key = 'feature_game_' || v_round.game::TEXT || '_enabled';
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (v_user_id, 'parity_mismatch', 'game_bets', v_bet_id,
      jsonb_build_object('game', v_round.game, 'expected', p_expected_result, 'computed', v_result));
    RETURN jsonb_build_object('bet_id', v_bet_id, 'status', 'parity_hold', 'already_placed', FALSE);
  END IF;

  PERFORM _unlock_wallet_internal(v_user_id, v_ccy, _fmt6(v_stake), 'game_stake_unlock', 'gbet_unlock:' || v_bet_id::TEXT);
  v_debit_id := _debit_wallet_internal(v_user_id, v_ccy, _fmt6(v_stake), 'game_stake_settle', 'gbet_debit:' || v_bet_id::TEXT);
  IF v_payout > 0 THEN
    v_credit_id := _credit_wallet_internal(v_user_id, v_ccy, _fmt6(v_payout), 'game_payout', 'gbet_pay:' || v_bet_id::TEXT);
  END IF;

  IF v_house >= 0 THEN
    PERFORM _credit_system_account(v_house_account, _fmt6(v_house), 'game_house_settle', v_user_id, v_bet_id::TEXT, v_transfer_id);
  ELSE
    PERFORM _debit_system_account(v_house_account, _fmt6(abs(v_house)), 'game_house_settle', v_user_id, v_bet_id::TEXT, v_transfer_id);
  END IF;
  IF v_dust > 0 THEN
    PERFORM _credit_system_account(CASE WHEN v_ccy = 'PHON' THEN 'dust_phon' ELSE 'dust_usdt' END,
      _fmt6(v_dust), 'game_rounding_dust', v_user_id, v_bet_id::TEXT, v_transfer_id);
  END IF;

  UPDATE game_rounds SET
    status = 'settled',
    result_payload = v_result,
    settled_at = NOW()
  WHERE id = p_round_id;

  UPDATE game_bets SET
    payout_ledger_id = COALESCE(v_credit_id, v_debit_id),
    house_ledger_transfer_id = v_transfer_id,
    settled_at = NOW()
  WHERE id = v_bet_id;

  BEGIN
    PERFORM _grant_mission(v_user_id, 'first_game');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  PERFORM _rg_try_refresh_user_month_loss(v_user_id, 'game', v_ccy);

  RETURN jsonb_build_object(
    'bet_id', v_bet_id,
    'round_id', p_round_id,
    'game', v_round.game,
    'status', v_status,
    'server_seed_hash', v_round.server_seed_hash,
    'result', v_result,
    'payout', _fmt6(v_payout),
    'already_placed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) TO authenticated, service_role;
