-- ============================================================
-- Migration: 20260703072352_sports_finalize_zero_house_guard
-- Push/void settle paths: skip zero house ledger leg (Σ=0 conservation)
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _finalize_sports_bet(p_bet_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bet sports_bets%ROWTYPE;
  v_pending INT;
  v_lost INT;
  v_product NUMERIC := 1;
  v_payout NUMERIC;
  v_house NUMERIC;
  v_house_account TEXT;
  v_transfer_id UUID := gen_random_uuid();
  v_unlock_id UUID;
  v_debit_id UUID;
  v_credit_id UUID;
  v_leg RECORD;
BEGIN
  SELECT * INTO v_bet FROM sports_bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND OR v_bet.status <> 'pending' THEN
    RETURN;
  END IF;

  SELECT COUNT(*) FILTER (WHERE leg_status = 'pending'),
         COUNT(*) FILTER (WHERE leg_status = 'lost')
    INTO v_pending, v_lost
    FROM sports_bet_legs
   WHERE bet_id = p_bet_id;

  IF v_pending > 0 THEN
    RETURN;
  END IF;

  v_house_account := CASE WHEN v_bet.currency = 'PHON' THEN 'sports_house_phon' ELSE 'sports_house_usdt' END;

  IF v_lost > 0 THEN
    v_unlock_id := _unlock_wallet_internal(
      v_bet.user_id, v_bet.currency, v_bet.stake,
      'sports_stake_unlock', 'sbet_unlock:' || p_bet_id::TEXT
    );
    v_debit_id := _debit_wallet_internal(
      v_bet.user_id, v_bet.currency, v_bet.stake,
      'sports_stake_lost', 'sbet_debit:' || p_bet_id::TEXT
    );
    PERFORM _credit_system_account(
      v_house_account, v_bet.stake, 'sports_house_win',
      v_bet.user_id, p_bet_id::TEXT, v_transfer_id
    );

    UPDATE sports_bets SET
      status = 'lost',
      payout_ledger_id = v_debit_id,
      house_transfer_id = v_transfer_id,
      settled_at = NOW()
    WHERE id = p_bet_id;
    RETURN;
  END IF;

  FOR v_leg IN
    SELECT odds_at_bet, leg_status
    FROM sports_bet_legs
    WHERE bet_id = p_bet_id
    ORDER BY created_at
  LOOP
    IF v_leg.leg_status = 'void' THEN
      v_product := v_product * 1;
    ELSE
      v_product := v_product * v_leg.odds_at_bet::NUMERIC;
    END IF;
  END LOOP;

  v_payout := trunc(v_bet.stake::NUMERIC * v_product, 6);
  v_house := v_bet.stake::NUMERIC - v_payout;

  v_unlock_id := _unlock_wallet_internal(
    v_bet.user_id, v_bet.currency, v_bet.stake,
    'sports_stake_unlock', 'sbet_unlock:' || p_bet_id::TEXT
  );
  v_debit_id := _debit_wallet_internal(
    v_bet.user_id, v_bet.currency, v_bet.stake,
    'sports_stake_settle', 'sbet_debit:' || p_bet_id::TEXT
  );

  IF v_payout > 0 THEN
    v_credit_id := _credit_wallet_internal(
      v_bet.user_id, v_bet.currency, _fmt6(v_payout),
      'sports_payout', 'sbet_pay:' || p_bet_id::TEXT
    );
  END IF;

  -- Push/void full refunds leave v_house = 0; system account helpers reject zero amounts.
  IF v_house > 0 THEN
    PERFORM _credit_system_account(
      v_house_account, _fmt6(v_house), 'sports_house_settle',
      v_bet.user_id, p_bet_id::TEXT, v_transfer_id
    );
  ELSIF v_house < 0 THEN
    PERFORM _debit_system_account(
      v_house_account, _fmt6(abs(v_house)), 'sports_house_settle',
      v_bet.user_id, p_bet_id::TEXT, v_transfer_id
    );
  END IF;

  UPDATE sports_bets SET
    status = CASE
      WHEN v_payout > v_bet.stake::NUMERIC THEN 'won'::sports_bet_status
      WHEN v_payout = v_bet.stake::NUMERIC THEN 'void'::sports_bet_status
      ELSE 'lost'::sports_bet_status
    END,
    potential_payout = _fmt6(v_payout),
    combined_odds = CASE
      WHEN v_product > 1 THEN _fmt6(v_product)
      ELSE v_bet.combined_odds
    END,
    payout_ledger_id = COALESCE(v_credit_id, v_debit_id),
    house_transfer_id = v_transfer_id,
    settled_at = NOW()
  WHERE id = p_bet_id;
END;
$$;

REVOKE ALL ON FUNCTION _finalize_sports_bet(UUID) FROM PUBLIC, anon, authenticated;
