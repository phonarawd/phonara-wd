-- ============================================================
-- Migration: 20260616000102_wave_s4_sportsbook_settle
-- Wave-S4: prematch settle/void + conservation paths
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

  IF v_house >= 0 THEN
    PERFORM _credit_system_account(
      v_house_account, _fmt6(v_house), 'sports_house_settle',
      v_bet.user_id, p_bet_id::TEXT, v_transfer_id
    );
  ELSE
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
    combined_odds = _fmt6(v_product),
    payout_ledger_id = COALESCE(v_credit_id, v_debit_id),
    house_transfer_id = v_transfer_id,
    settled_at = NOW()
  WHERE id = p_bet_id;
END;
$$;

REVOKE ALL ON FUNCTION _finalize_sports_bet(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_settle_sports_fixture(
  p_fixture_id UUID,
  p_result     TEXT,
  p_reason     TEXT DEFAULT 'ft_result'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fixture sports_fixtures%ROWTYPE;
  v_selection sports_selection;
  v_legs_updated INT := 0;
  v_bet_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  BEGIN
    v_selection := lower(btrim(p_result))::sports_selection;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_result';
  END;

  IF v_selection NOT IN ('home', 'draw', 'away') THEN
    RAISE EXCEPTION 'invalid_result';
  END IF;

  SELECT * INTO v_fixture FROM sports_fixtures WHERE id = p_fixture_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;

  UPDATE sports_fixtures SET status = 'finished', updated_at = NOW()
  WHERE id = p_fixture_id;

  UPDATE sports_markets SET status = 'closed', updated_at = NOW()
  WHERE fixture_id = p_fixture_id AND status <> 'closed';

  UPDATE sports_bet_legs l
  SET leg_status = CASE
    WHEN o.selection = v_selection THEN 'won'::sports_leg_status
    ELSE 'lost'::sports_leg_status
  END
  FROM sports_outcomes o
  JOIN sports_markets m ON m.id = o.market_id
  WHERE l.outcome_id = o.id
    AND l.fixture_id = p_fixture_id
    AND l.leg_status = 'pending'
    AND m.market_type = 'match_1x2';

  GET DIAGNOSTICS v_legs_updated = ROW_COUNT;

  FOR v_bet_id IN
    SELECT DISTINCT l.bet_id
    FROM sports_bet_legs l
    WHERE l.fixture_id = p_fixture_id
  LOOP
    PERFORM _finalize_sports_bet(v_bet_id);
  END LOOP;

  IF auth.uid() IS NOT NULL THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (auth.uid(), 'sports_fixture_settle', 'sports_fixtures', p_fixture_id,
      jsonb_build_object('result', p_result, 'reason', p_reason, 'legs_updated', v_legs_updated));
  END IF;

  RETURN jsonb_build_object(
    'fixture_id', p_fixture_id,
    'result', p_result,
    'legs_updated', v_legs_updated
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_settle_sports_fixture(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_settle_sports_fixture(UUID, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION rpc_void_sports_market(
  p_market_id UUID,
  p_reason    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_market sports_markets%ROWTYPE;
  v_bet_id UUID;
  v_legs_updated INT := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  SELECT * INTO v_market FROM sports_markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  UPDATE sports_markets SET status = 'closed', updated_at = NOW()
  WHERE id = p_market_id;

  UPDATE sports_bet_legs l
  SET leg_status = 'void'
  WHERE l.outcome_id IN (SELECT id FROM sports_outcomes WHERE market_id = p_market_id)
    AND l.leg_status = 'pending';

  GET DIAGNOSTICS v_legs_updated = ROW_COUNT;

  FOR v_bet_id IN
    SELECT DISTINCT l.bet_id
    FROM sports_bet_legs l
    JOIN sports_outcomes o ON o.id = l.outcome_id
    WHERE o.market_id = p_market_id
  LOOP
    PERFORM _finalize_sports_bet(v_bet_id);
  END LOOP;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'sports_market_void', 'sports_markets', p_market_id,
    jsonb_build_object('reason', p_reason, 'legs_updated', v_legs_updated));

  RETURN jsonb_build_object('market_id', p_market_id, 'legs_voided', v_legs_updated);
END;
$$;

REVOKE ALL ON FUNCTION rpc_void_sports_market(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_void_sports_market(UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_void_sports_bet(
  p_bet_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bet sports_bets%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  SELECT * INTO v_bet FROM sports_bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF v_bet.status <> 'pending' THEN RAISE EXCEPTION 'bet_not_pending'; END IF;

  UPDATE sports_bet_legs SET leg_status = 'void' WHERE bet_id = p_bet_id AND leg_status = 'pending';

  PERFORM _unlock_wallet_internal(
    v_bet.user_id, v_bet.currency, v_bet.stake,
    'sports_stake_refund', 'sbet_refund:' || p_bet_id::TEXT
  );

  UPDATE sports_bets SET status = 'void', settled_at = NOW() WHERE id = p_bet_id;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'sports_bet_void', 'sports_bets', p_bet_id,
    jsonb_build_object('reason', p_reason));

  RETURN jsonb_build_object('bet_id', p_bet_id, 'status', 'void');
END;
$$;

REVOKE ALL ON FUNCTION rpc_void_sports_bet(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_void_sports_bet(UUID, TEXT) TO authenticated, service_role;
