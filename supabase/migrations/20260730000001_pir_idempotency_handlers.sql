-- PIR E5 (M-1): place/claim unique_violation → existing result.
-- 1) Wallet helpers: re-check ledger after FOR UPDATE + nested unique_violation
--    handler (UPDATE+INSERT rolled back to savepoint; return existing id).
-- 2) rpc_place_game_bet / rpc_place_sports_bet: INSERT unique_violation → already_placed.
-- Claim paths inherit wallet-helper hardening via _credit_wallet_internal.
-- Plan: platform_integrity_remediation_v1 · pir-e5-idempotency-handlers

SET search_path = public, pg_temp;

-- ─── Already-placed payloads (shared by early return + unique_violation) ────

CREATE OR REPLACE FUNCTION _pir_game_bet_already_placed(
  p_user_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing game_bets%ROWTYPE;
BEGIN
  SELECT * INTO v_existing
  FROM game_bets
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object(
    'bet_id', v_existing.id,
    'round_id', v_existing.round_id,
    'status', v_existing.status,
    'already_placed', TRUE,
    'payout', v_existing.payout,
    'result', v_existing.result_payload
  );
END;
$$;

REVOKE ALL ON FUNCTION _pir_game_bet_already_placed(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _pir_sports_bet_already_placed(
  p_user_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing sports_bets%ROWTYPE;
BEGIN
  SELECT * INTO v_existing
  FROM sports_bets
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object(
    'bet_id', v_existing.id,
    'status', v_existing.status,
    'combined_odds', v_existing.combined_odds,
    'potential_payout', v_existing.potential_payout,
    'bet_kind', v_existing.bet_kind,
    'already_placed', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION _pir_sports_bet_already_placed(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── Wallet helpers (claim + place lock/settle paths) ───────────────────────

CREATE OR REPLACE FUNCTION _credit_wallet_internal(
  p_user_id UUID, p_currency currency, p_amount TEXT,
  p_reason_code TEXT, p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_to_bonus BOOLEAN := FALSE;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  IF auth.uid() = p_user_id THEN
    PERFORM _assert_account_activity_live(p_user_id);
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  -- PIR E5: re-check after row lock (closes TOCTOU before mutate)
  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;


  BEGIN
    IF p_currency = 'PHON' AND _is_reward_issuance_reason(p_reason_code) THEN
      v_to_bonus := TRUE;
    END IF;

    CASE p_currency
      WHEN 'PHON' THEN
        v_avail_before := v_wallet.phon_available;
        v_locked_before := v_wallet.phon_locked;
        IF v_to_bonus THEN
          UPDATE wallets
             SET phon_bonus_available = (phon_bonus_available::NUMERIC + p_amount::NUMERIC)::TEXT,
                 version = version + 1
           WHERE id = v_wallet.id;
        ELSE
          UPDATE wallets
             SET phon_real_available = (phon_real_available::NUMERIC + p_amount::NUMERIC)::TEXT,
                 version = version + 1
           WHERE id = v_wallet.id;
        END IF;
        PERFORM _sync_phon_wallet_totals(v_wallet.id);
      WHEN 'USDT' THEN
        v_avail_before := v_wallet.usdt_available; v_locked_before := v_wallet.usdt_locked;
        UPDATE wallets SET usdt_available=(usdt_available::NUMERIC+p_amount::NUMERIC)::TEXT,
                           version=version+1 WHERE id=v_wallet.id;
      WHEN 'KRW' THEN
        v_avail_before := v_wallet.krw_available; v_locked_before := v_wallet.krw_locked;
        UPDATE wallets SET krw_available=(krw_available::NUMERIC+p_amount::NUMERIC)::TEXT,
                           version=version+1 WHERE id=v_wallet.id;
    END CASE;

    INSERT INTO wallet_ledger (wallet_id,user_id,idempotency_key,direction,currency,amount,
      available_before,locked_before,available_after,locked_after,reason_code)
    SELECT v_wallet.id,p_user_id,p_idempotency_key,'credit',p_currency,p_amount,
      v_avail_before,v_locked_before,
      CASE p_currency WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available END,
      CASE p_currency WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked END,
      p_reason_code
    FROM wallets WHERE id=v_wallet.id
    RETURNING id INTO v_entry_id;

    IF p_currency = 'PHON' AND _is_reward_issuance_reason(p_reason_code) THEN
      PERFORM _debit_system_account('reward_issuance_phon', p_amount,
        p_reason_code, p_user_id, p_idempotency_key, NULL);
      PERFORM _create_bonus_wagering_obligation(
        p_user_id, v_wallet.id, v_entry_id, p_amount
      );
    END IF;

  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
    IF v_entry_id IS NULL THEN
      RAISE;
    END IF;
  END;

  RETURN v_entry_id;
END;
$$;
CREATE OR REPLACE FUNCTION _debit_wallet_internal(
  p_user_id UUID, p_currency currency, p_amount TEXT,
  p_reason_code TEXT, p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_total NUMERIC;
  v_from_bonus NUMERIC;
  v_from_real NUMERIC;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  IF auth.uid() = p_user_id THEN
    PERFORM _assert_account_activity_live(p_user_id);
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  -- PIR E5: re-check after row lock (closes TOCTOU before mutate)
  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;


  BEGIN
    CASE p_currency
      WHEN 'PHON' THEN
        v_total := p_amount::NUMERIC;
        IF _is_phon_wagering_bet_reason(p_reason_code) THEN
          v_from_bonus := LEAST(v_total, v_wallet.phon_bonus_available::NUMERIC);
          v_from_real  := v_total - v_from_bonus;
        ELSE
          -- Non-bet debits (fees, admin): real first, then bonus
          v_from_real  := LEAST(v_total, v_wallet.phon_real_available::NUMERIC);
          v_from_bonus := v_total - v_from_real;
        END IF;

        IF (v_wallet.phon_bonus_available::NUMERIC + v_wallet.phon_real_available::NUMERIC) < v_total THEN
          RAISE EXCEPTION 'insufficient_available' USING HINT='PHON';
        END IF;

        v_avail_before := v_wallet.phon_available;
        v_locked_before := v_wallet.phon_locked;

        UPDATE wallets
           SET phon_bonus_available = (phon_bonus_available::NUMERIC - v_from_bonus)::TEXT,
               phon_real_available  = (phon_real_available::NUMERIC - v_from_real)::TEXT,
               version = version + 1
         WHERE id = v_wallet.id;

        PERFORM _sync_phon_wallet_totals(v_wallet.id);

        IF _is_phon_wagering_bet_reason(p_reason_code) AND v_total > 0 THEN
          PERFORM _apply_wagering_progress(p_user_id, _fmt6(v_total));
        END IF;

      WHEN 'USDT' THEN
        IF v_wallet.usdt_available::NUMERIC < p_amount::NUMERIC THEN
          RAISE EXCEPTION 'insufficient_available' USING HINT='USDT';
        END IF;
        v_avail_before := v_wallet.usdt_available; v_locked_before := v_wallet.usdt_locked;
        UPDATE wallets SET usdt_available=(usdt_available::NUMERIC-p_amount::NUMERIC)::TEXT,
                           version=version+1 WHERE id=v_wallet.id;
      WHEN 'KRW' THEN
        IF v_wallet.krw_available::NUMERIC < p_amount::NUMERIC THEN
          RAISE EXCEPTION 'insufficient_available' USING HINT='KRW';
        END IF;
        v_avail_before := v_wallet.krw_available; v_locked_before := v_wallet.krw_locked;
        UPDATE wallets SET krw_available=(krw_available::NUMERIC-p_amount::NUMERIC)::TEXT,
                           version=version+1 WHERE id=v_wallet.id;
    END CASE;

    INSERT INTO wallet_ledger (wallet_id,user_id,idempotency_key,direction,currency,amount,
      available_before,locked_before,available_after,locked_after,reason_code)
    SELECT v_wallet.id,p_user_id,p_idempotency_key,'debit',p_currency,p_amount,
      v_avail_before,v_locked_before,
      CASE p_currency WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available END,
      CASE p_currency WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked END,
      p_reason_code
    FROM wallets WHERE id=v_wallet.id
    RETURNING id INTO v_entry_id;

  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
    IF v_entry_id IS NULL THEN
      RAISE;
    END IF;
  END;

  RETURN v_entry_id;
END;
$$;
CREATE OR REPLACE FUNCTION _lock_wallet_internal(
  p_user_id UUID, p_currency currency, p_amount TEXT,
  p_reason_code TEXT, p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_total NUMERIC;
  v_from_bonus NUMERIC;
  v_from_real NUMERIC;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  IF auth.uid() = p_user_id THEN
    PERFORM _assert_account_activity_live(p_user_id);
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  -- PIR E5: re-check after row lock (closes TOCTOU before mutate)
  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;


  BEGIN
    CASE p_currency
      WHEN 'PHON' THEN
        v_total := p_amount::NUMERIC;
        v_avail_before := v_wallet.phon_available;
        v_locked_before := v_wallet.phon_locked;

        IF _is_phon_withdrawal_lock_reason(p_reason_code) THEN
          IF v_wallet.phon_real_available::NUMERIC < v_total THEN
            RAISE EXCEPTION 'insufficient_available' USING HINT='PHON';
          END IF;
          v_from_bonus := 0;
          v_from_real := v_total;
        ELSE
          IF (v_wallet.phon_bonus_available::NUMERIC + v_wallet.phon_real_available::NUMERIC) < v_total THEN
            RAISE EXCEPTION 'insufficient_available' USING HINT='PHON';
          END IF;
          v_from_bonus := LEAST(v_total, v_wallet.phon_bonus_available::NUMERIC);
          v_from_real  := v_total - v_from_bonus;
        END IF;

        UPDATE wallets
           SET phon_bonus_available = (phon_bonus_available::NUMERIC - v_from_bonus)::TEXT,
               phon_bonus_locked    = (phon_bonus_locked::NUMERIC + v_from_bonus)::TEXT,
               phon_real_available  = (phon_real_available::NUMERIC - v_from_real)::TEXT,
               phon_real_locked     = (phon_real_locked::NUMERIC + v_from_real)::TEXT,
               version = version + 1
         WHERE id = v_wallet.id;

        PERFORM _sync_phon_wallet_totals(v_wallet.id);

        IF _is_phon_wagering_bet_reason(p_reason_code) AND v_total > 0 THEN
          PERFORM _apply_wagering_progress(p_user_id, _fmt6(v_total));
        END IF;

      WHEN 'USDT' THEN
        IF v_wallet.usdt_available::NUMERIC < p_amount::NUMERIC THEN
          RAISE EXCEPTION 'insufficient_available' USING HINT='USDT';
        END IF;
        v_avail_before := v_wallet.usdt_available; v_locked_before := v_wallet.usdt_locked;
        UPDATE wallets SET usdt_available=(usdt_available::NUMERIC-p_amount::NUMERIC)::TEXT,
                           usdt_locked=(usdt_locked::NUMERIC+p_amount::NUMERIC)::TEXT,
                           version=version+1 WHERE id=v_wallet.id;
      WHEN 'KRW' THEN
        IF v_wallet.krw_available::NUMERIC < p_amount::NUMERIC THEN
          RAISE EXCEPTION 'insufficient_available' USING HINT='KRW';
        END IF;
        v_avail_before := v_wallet.krw_available; v_locked_before := v_wallet.krw_locked;
        UPDATE wallets SET krw_available=(krw_available::NUMERIC-p_amount::NUMERIC)::TEXT,
                           krw_locked=(krw_locked::NUMERIC+p_amount::NUMERIC)::TEXT,
                           version=version+1 WHERE id=v_wallet.id;
    END CASE;

    INSERT INTO wallet_ledger (wallet_id,user_id,idempotency_key,direction,currency,amount,
      available_before,locked_before,available_after,locked_after,reason_code)
    SELECT v_wallet.id,p_user_id,p_idempotency_key,'lock',p_currency,p_amount,
      v_avail_before,v_locked_before,
      CASE p_currency WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available END,
      CASE p_currency WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked END,
      p_reason_code
    FROM wallets WHERE id=v_wallet.id
    RETURNING id INTO v_entry_id;

  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
    IF v_entry_id IS NULL THEN
      RAISE;
    END IF;
  END;

  RETURN v_entry_id;
END;
$$;
CREATE OR REPLACE FUNCTION _unlock_wallet_internal(
  p_user_id UUID, p_currency currency, p_amount TEXT,
  p_reason_code TEXT, p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_total NUMERIC;
  v_from_bonus NUMERIC;
  v_from_real NUMERIC;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  IF auth.uid() = p_user_id THEN
    PERFORM _assert_account_activity_live(p_user_id);
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  -- PIR E5: re-check after row lock (closes TOCTOU before mutate)
  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;


  BEGIN
    CASE p_currency
      WHEN 'PHON' THEN
        v_total := p_amount::NUMERIC;
        v_avail_before := v_wallet.phon_available;
        v_locked_before := v_wallet.phon_locked;

        IF (v_wallet.phon_bonus_locked::NUMERIC + v_wallet.phon_real_locked::NUMERIC) < v_total THEN
          RAISE EXCEPTION 'insufficient_locked' USING HINT='PHON';
        END IF;

        v_from_bonus := LEAST(v_total, v_wallet.phon_bonus_locked::NUMERIC);
        v_from_real  := v_total - v_from_bonus;

        UPDATE wallets
           SET phon_bonus_locked    = (phon_bonus_locked::NUMERIC - v_from_bonus)::TEXT,
               phon_bonus_available = (phon_bonus_available::NUMERIC + v_from_bonus)::TEXT,
               phon_real_locked     = (phon_real_locked::NUMERIC - v_from_real)::TEXT,
               phon_real_available  = (phon_real_available::NUMERIC + v_from_real)::TEXT,
               version = version + 1
         WHERE id = v_wallet.id;

        PERFORM _sync_phon_wallet_totals(v_wallet.id);

      WHEN 'USDT' THEN
        IF v_wallet.usdt_locked::NUMERIC < p_amount::NUMERIC THEN
          RAISE EXCEPTION 'insufficient_locked' USING HINT='USDT';
        END IF;
        v_avail_before := v_wallet.usdt_available; v_locked_before := v_wallet.usdt_locked;
        UPDATE wallets SET usdt_locked=(usdt_locked::NUMERIC-p_amount::NUMERIC)::TEXT,
                           usdt_available=(usdt_available::NUMERIC+p_amount::NUMERIC)::TEXT,
                           version=version+1 WHERE id=v_wallet.id;
      WHEN 'KRW' THEN
        IF v_wallet.krw_locked::NUMERIC < p_amount::NUMERIC THEN
          RAISE EXCEPTION 'insufficient_locked' USING HINT='KRW';
        END IF;
        v_avail_before := v_wallet.krw_available; v_locked_before := v_wallet.krw_locked;
        UPDATE wallets SET krw_locked=(krw_locked::NUMERIC-p_amount::NUMERIC)::TEXT,
                           krw_available=(krw_available::NUMERIC+p_amount::NUMERIC)::TEXT,
                           version=version+1 WHERE id=v_wallet.id;
    END CASE;

    INSERT INTO wallet_ledger (wallet_id,user_id,idempotency_key,direction,currency,amount,
      available_before,locked_before,available_after,locked_after,reason_code)
    SELECT v_wallet.id,p_user_id,p_idempotency_key,'unlock',p_currency,p_amount,
      v_avail_before,v_locked_before,
      CASE p_currency WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available END,
      CASE p_currency WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked END,
      p_reason_code
    FROM wallets WHERE id=v_wallet.id
    RETURNING id INTO v_entry_id;

  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
    IF v_entry_id IS NULL THEN
      RAISE;
    END IF;
  END;

  RETURN v_entry_id;
END;
$$;
-- ─── Place paths ──────────────────────────────────────────────────────────

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

CREATE OR REPLACE FUNCTION rpc_place_sports_bet(
  p_legs            JSONB,
  p_stake           TEXT,
  p_currency        TEXT,
  p_idempotency_key TEXT,
  p_device_hash     TEXT DEFAULT NULL,
  p_ip_hash         TEXT DEFAULT NULL,
  p_bet_kind        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing sports_bets%ROWTYPE;
  v_ccy currency;
  v_stake NUMERIC;
  v_leg_count INT;
  v_i INT;
  v_leg JSONB;
  v_outcome_id UUID;
  v_outcome sports_outcomes%ROWTYPE;
  v_market sports_markets%ROWTYPE;
  v_fixture sports_fixtures%ROWTYPE;
  v_latest RECORD;
  v_max_age INT;
  v_client_odds TEXT;
  v_combined NUMERIC := 1;
  v_payout NUMERIC;
  v_bet_id UUID := gen_random_uuid();
  v_lock_id UUID;
  v_fixture_id UUID;
  v_sgp_fixture UUID;
  v_seen_outcomes UUID[] := '{}';
  v_seen_fixtures UUID[] := '{}';
  v_is_live BOOLEAN;
  v_leg_outcomes UUID[] := '{}';
  v_kind sports_bet_kind;
  v_max_legs INT := 8;
  v_sgp_max INT;
  v_dup JSONB;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  v_dup := _pir_sports_bet_already_placed(v_user_id, p_idempotency_key);
  IF v_dup IS NOT NULL THEN
    RETURN v_dup;
  END IF;

  PERFORM _assert_sports_user_risk_allowed(v_user_id);
  PERFORM _assert_sports_device_signals(v_user_id, p_device_hash, p_ip_hash);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_place_sports_bet');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('sports');
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

  PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'sports', v_ccy);

  v_stake := p_stake::NUMERIC;
  IF v_stake <= 0 THEN RAISE EXCEPTION 'invalid_stake'; END IF;
  PERFORM _assert_sports_stake_limits(v_ccy, v_stake);
  PERFORM _assert_sports_risk_stake_cap(v_user_id, v_ccy, v_stake);
  PERFORM _assert_sports_user_daily_limits(v_user_id, v_ccy, v_stake);

  IF p_legs IS NULL OR jsonb_typeof(p_legs) <> 'array' THEN
    RAISE EXCEPTION 'invalid_legs';
  END IF;

  v_leg_count := jsonb_array_length(p_legs);
  v_sgp_max := COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'sports_sgp_max_legs'), '')::INT,
    12
  );

  IF p_bet_kind IS NULL OR btrim(p_bet_kind) = '' THEN
    v_kind := CASE
      WHEN v_leg_count = 1 THEN 'single'::sports_bet_kind
      ELSE 'combo'::sports_bet_kind
    END;
  ELSE
    BEGIN
      v_kind := lower(btrim(p_bet_kind))::sports_bet_kind;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid_bet_kind';
    END;
  END IF;

  v_max_legs := CASE WHEN v_kind = 'sgp' THEN v_sgp_max ELSE 8 END;
  IF v_leg_count < 1 OR v_leg_count > v_max_legs THEN
    RAISE EXCEPTION 'invalid_leg_count';
  END IF;

  -- M2: anti-arb delay BEFORE acquiring fixture row locks
  IF _sports_any_live_leg(p_legs) THEN
    PERFORM _sports_live_acceptance_delay(v_user_id, v_ccy, v_stake, TRUE);
  END IF;

  FOR v_i IN 0 .. v_leg_count - 1 LOOP
    v_leg := p_legs->v_i;
    v_outcome_id := (v_leg->>'outcome_id')::UUID;
    IF v_outcome_id IS NULL THEN RAISE EXCEPTION 'invalid_outcome_id'; END IF;

    IF v_outcome_id = ANY(v_seen_outcomes) THEN
      RAISE EXCEPTION 'duplicate_outcome';
    END IF;
    v_seen_outcomes := array_append(v_seen_outcomes, v_outcome_id);

    SELECT * INTO v_outcome FROM sports_outcomes WHERE id = v_outcome_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'outcome_not_found'; END IF;

    SELECT * INTO v_market FROM sports_markets WHERE id = v_outcome.market_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

    SELECT * INTO v_fixture FROM sports_fixtures WHERE id = v_market.fixture_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;

    PERFORM _sports_assert_market_placeable(v_market.id, v_fixture.id);
    PERFORM _assert_sports_no_market_hedge(v_user_id, v_market.id);

    v_is_live := v_fixture.status = 'live';
    IF v_fixture.status NOT IN ('scheduled', 'live') THEN
      RAISE EXCEPTION 'fixture_not_open';
    END IF;

    IF NOT v_is_live THEN
      IF v_fixture.kickoff_at <= NOW() THEN RAISE EXCEPTION 'kickoff_passed'; END IF;
    END IF;
    v_max_age := _sports_odds_max_age_for_fixture(v_fixture.id, v_is_live);

    SELECT * INTO v_latest FROM _sports_latest_odds(v_outcome_id);
    IF v_latest.odds IS NULL THEN RAISE EXCEPTION 'odds_unavailable'; END IF;
    IF v_latest.captured_at < NOW() - make_interval(secs => v_max_age) THEN
      RAISE EXCEPTION 'odds_stale';
    END IF;

    v_client_odds := btrim(v_leg->>'odds_at_bet');
    IF v_client_odds IS NULL OR v_client_odds !~ '^\d+(\.\d+)?$' THEN
      RAISE EXCEPTION 'invalid_odds_at_bet';
    END IF;
    IF v_client_odds::NUMERIC <= 1 THEN RAISE EXCEPTION 'invalid_odds_at_bet'; END IF;
    IF NOT _sports_odds_exact_match(v_latest.odds, v_client_odds) THEN
      RAISE EXCEPTION 'odds_changed'
        USING DETAIL = format('expected=%s client=%s', v_latest.odds, v_client_odds);
    END IF;

    IF v_kind = 'sgp' THEN
      IF v_sgp_fixture IS NULL THEN
        v_sgp_fixture := v_fixture.id;
      ELSIF v_sgp_fixture <> v_fixture.id THEN
        RAISE EXCEPTION 'sgp_fixture_mismatch';
      END IF;
    ELSIF v_kind = 'combo' AND v_leg_count > 1 AND v_fixture.id = ANY(v_seen_fixtures) THEN
      RAISE EXCEPTION 'duplicate_fixture';
    END IF;
    v_seen_fixtures := array_append(v_seen_fixtures, v_fixture.id);

    v_combined := v_combined * v_client_odds::NUMERIC;
    v_leg_outcomes := array_append(v_leg_outcomes, v_outcome_id);
  END LOOP;

  IF v_kind = 'sgp' AND v_leg_count < 2 THEN
    RAISE EXCEPTION 'sgp_min_legs';
  END IF;

  v_payout := trunc(v_stake * v_combined, 6);
  PERFORM _assert_sports_payout_cap(v_ccy, v_payout);
  PERFORM _assert_sports_house_exposure(v_ccy, v_payout);

  FOR v_i IN 1 .. array_length(v_leg_outcomes, 1) LOOP
    PERFORM _assert_sports_outcome_liability(v_leg_outcomes[v_i], v_ccy, v_payout);
  END LOOP;

  v_lock_id := _lock_wallet_internal(
    v_user_id,
    v_ccy,
    _fmt6(v_stake),
    'sports_stake_lock',
    'sbet_lock:' || v_user_id::TEXT || ':' || p_idempotency_key
  );

  BEGIN
    INSERT INTO sports_bets (
      id, user_id, currency, stake, combined_odds, potential_payout,
      status, idempotency_key, stake_lock_id, bet_kind
    ) VALUES (
      v_bet_id, v_user_id, v_ccy, _fmt6(v_stake), _fmt6(v_combined), _fmt6(v_payout),
      'pending', p_idempotency_key, v_lock_id, v_kind
    );
  EXCEPTION WHEN unique_violation THEN
    v_dup := _pir_sports_bet_already_placed(v_user_id, p_idempotency_key);
    IF v_dup IS NULL THEN
      RAISE;
    END IF;
    RETURN v_dup;
  END;

  FOR v_i IN 0 .. v_leg_count - 1 LOOP
    v_leg := p_legs->v_i;
    v_outcome_id := (v_leg->>'outcome_id')::UUID;

    SELECT m.fixture_id INTO v_fixture_id
    FROM sports_outcomes o
    JOIN sports_markets m ON m.id = o.market_id
    WHERE o.id = v_outcome_id;

    INSERT INTO sports_bet_legs (bet_id, outcome_id, fixture_id, odds_at_bet)
    VALUES (v_bet_id, v_outcome_id, v_fixture_id, btrim(v_leg->>'odds_at_bet'));
  END LOOP;

  PERFORM _record_sports_device_signal(v_user_id, v_bet_id, p_device_hash, p_ip_hash);

  RETURN jsonb_build_object(
    'bet_id', v_bet_id,
    'status', 'pending',
    'bet_kind', v_kind,
    'combined_odds', _fmt6(v_combined),
    'potential_payout', _fmt6(v_payout),
    'already_placed', FALSE
  );
END;
$$;


REVOKE ALL ON FUNCTION _credit_wallet_internal(UUID, currency, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _debit_wallet_internal(UUID, currency, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _lock_wallet_internal(UUID, currency, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _unlock_wallet_internal(UUID, currency, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_sports_bet(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;
