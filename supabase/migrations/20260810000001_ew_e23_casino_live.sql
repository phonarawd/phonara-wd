-- ============================================================
-- Migration: ew_e23_casino_live
-- E23 Casino live — PF seed controls · progressive rounds · live crash
-- EXISTS (do NOT remigrate semantics): rpc_place_game_bet one-shot (nonce=1)
--   when p_use_account_pf=false · 12 one-shot games · no server autobet RPC
-- Plan: ew-e23-casino-live-wave · ADR-017
-- ============================================================

SET search_path = public, pg_temp;

-- ═══════════════════════════════════════════════════════════════
-- A. PF seed controls
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_game_pf_state (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE RESTRICT,
  client_seed TEXT NOT NULL,
  next_nonce INT NOT NULL DEFAULT 1 CHECK (next_nonce >= 1),
  active_server_seed TEXT NOT NULL,
  active_server_seed_hash TEXT NOT NULL,
  previous_server_seed TEXT,
  rotated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_game_pf_state ENABLE ROW LEVEL SECURITY;

-- No authenticated table SELECT — seed material only via rpc_get_game_pf_state.
DROP POLICY IF EXISTS "own read user_game_pf_state" ON user_game_pf_state;

REVOKE ALL ON user_game_pf_state FROM PUBLIC, anon, authenticated;
GRANT ALL ON user_game_pf_state TO service_role;
-- Authenticated must not SELECT active_server_seed — use rpc_get_game_pf_state only.

COMMENT ON TABLE user_game_pf_state IS
  'E23 — account PF client_seed + nonce + server seed commitment. Mutations via RPC only. No authenticated SELECT.';

CREATE OR REPLACE FUNCTION _game_pf_ensure_state(p_user_id UUID)
RETURNS user_game_pf_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row user_game_pf_state%ROWTYPE;
  v_seed TEXT;
  v_hash TEXT;
  v_client TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_user';
  END IF;

  SELECT * INTO v_row FROM user_game_pf_state WHERE user_id = p_user_id;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  v_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_seed, 'sha256'), 'hex');
  v_client := encode(extensions.gen_random_bytes(16), 'hex');

  INSERT INTO user_game_pf_state (
    user_id, client_seed, next_nonce,
    active_server_seed, active_server_seed_hash, updated_at
  ) VALUES (
    p_user_id, v_client, 1, v_seed, v_hash, NOW()
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.user_id IS NULL THEN
    SELECT * INTO v_row FROM user_game_pf_state WHERE user_id = p_user_id;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION _game_pf_ensure_state(UUID) FROM PUBLIC, anon, authenticated;

-- Stub until progressive / live_crash tables exist (replaced at end of migration).
CREATE OR REPLACE FUNCTION _game_pf_has_blocking_activity(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION _game_pf_has_blocking_activity(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_get_game_pf_state()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row user_game_pf_state%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_get_game_pf_state');
  v_row := _game_pf_ensure_state(v_user_id);

  RETURN jsonb_build_object(
    'client_seed', v_row.client_seed,
    'next_nonce', v_row.next_nonce,
    'server_seed_hash', v_row.active_server_seed_hash,
    'previous_server_seed', v_row.previous_server_seed
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_game_pf_state() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_game_pf_state() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_set_game_client_seed(p_client_seed TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_seed TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_set_game_client_seed');

  v_seed := btrim(COALESCE(p_client_seed, ''));
  IF length(v_seed) = 0 THEN
    RAISE EXCEPTION 'invalid_client_seed';
  END IF;

  PERFORM _game_pf_ensure_state(v_user_id);

  IF _game_pf_has_blocking_activity(v_user_id) THEN
    RAISE EXCEPTION 'pf_seed_locked_active_session';
  END IF;

  UPDATE user_game_pf_state
     SET client_seed = v_seed,
         updated_at = NOW()
   WHERE user_id = v_user_id;

  RETURN rpc_get_game_pf_state();
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_game_client_seed(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_game_client_seed(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_rotate_game_server_seed(p_new_client_seed TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row user_game_pf_state%ROWTYPE;
  v_seed TEXT;
  v_hash TEXT;
  v_client TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_rotate_game_server_seed');

  v_row := _game_pf_ensure_state(v_user_id);

  IF _game_pf_has_blocking_activity(v_user_id) THEN
    RAISE EXCEPTION 'pf_seed_locked_active_session';
  END IF;

  v_seed := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_seed, 'sha256'), 'hex');
  v_client := NULLIF(btrim(COALESCE(p_new_client_seed, '')), '');
  IF v_client IS NULL THEN
    v_client := v_row.client_seed;
  END IF;

  UPDATE user_game_pf_state
     SET previous_server_seed = active_server_seed,
         active_server_seed = v_seed,
         active_server_seed_hash = v_hash,
         next_nonce = 1,
         client_seed = v_client,
         rotated_at = NOW(),
         updated_at = NOW()
   WHERE user_id = v_user_id;

  RETURN rpc_get_game_pf_state();
END;
$$;

REVOKE ALL ON FUNCTION rpc_rotate_game_server_seed(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_rotate_game_server_seed(TEXT) TO authenticated, service_role;

-- Extend rpc_place_game_bet with p_use_account_pf (drop 7-arg overload).
DROP FUNCTION IF EXISTS rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION rpc_place_game_bet(
  p_round_id UUID,
  p_currency TEXT,
  p_stake TEXT,
  p_selection JSONB,
  p_client_seed TEXT,
  p_idempotency_key TEXT,
  p_expected_result JSONB DEFAULT NULL,
  p_use_account_pf BOOLEAN DEFAULT FALSE
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
  v_pf user_game_pf_state%ROWTYPE;
  v_client_seed TEXT;
  v_nonce INT := 1;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
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

  -- Account PF: persist client_seed + increment nonce.
  -- Server seed stays the per-round commitment (rpc_open_game_round) so hash↔result match.
  -- Progressive/live paths may bind rounds to account server seed at start.
  IF COALESCE(p_use_account_pf, FALSE) THEN
    v_pf := _game_pf_ensure_state(v_user_id);
    v_client_seed := v_pf.client_seed;
    v_nonce := v_pf.next_nonce;
  ELSE
    IF p_client_seed IS NULL OR length(btrim(p_client_seed)) = 0 THEN
      RAISE EXCEPTION 'invalid_client_seed';
    END IF;
    v_client_seed := p_client_seed;
    v_nonce := 1;
  END IF;

  v_resolution := _game_result(
    v_round.game, v_round.server_seed, v_client_seed, v_nonce, p_selection
  );
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
      v_client_seed, v_nonce, v_result, _fmt6(v_payout), v_status, p_idempotency_key, v_lock_id
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

  IF COALESCE(p_use_account_pf, FALSE) THEN
    UPDATE user_game_pf_state
       SET next_nonce = next_nonce + 1,
           updated_at = NOW()
     WHERE user_id = v_user_id;
  END IF;

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
    'nonce', v_nonce,
    'client_seed', v_client_seed,
    'result', v_result,
    'payout', _fmt6(v_payout),
    'already_placed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, BOOLEAN)
  TO authenticated, service_role;

-- Compatibility overload — existing callers / privilege checks (7-arg).
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.rpc_place_game_bet(
    p_round_id, p_currency, p_stake, p_selection,
    p_client_seed, p_idempotency_key, p_expected_result, FALSE
  );
$$;

REVOKE ALL ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB)
  TO authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════
-- B. Progressive rounds (mines / hilo / blackjack)
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE progressive_session_status AS ENUM (
    'active', 'cashed_out', 'busted', 'expired', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS game_progressive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  game game_code NOT NULL,
  round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE RESTRICT,
  currency currency NOT NULL,
  stake TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  nonce INT NOT NULL DEFAULT 1,
  status progressive_session_status NOT NULL DEFAULT 'active',
  secret_state JSONB NOT NULL,
  public_state JSONB NOT NULL,
  current_multiplier TEXT NOT NULL DEFAULT '1.000000',
  stake_lock_id UUID REFERENCES wallet_ledger(id),
  bet_id UUID,
  idempotency_key TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  CONSTRAINT gps_game_check CHECK (game IN ('mines', 'hilo', 'blackjack')),
  CONSTRAINT gps_stake_pos CHECK (stake ~ '^\d+(\.\d+)?$')
);

CREATE INDEX IF NOT EXISTS gps_user_status_idx
  ON game_progressive_sessions (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS gps_expires_idx
  ON game_progressive_sessions (status, expires_at)
  WHERE status = 'active';

ALTER TABLE game_progressive_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own read progressive sessions" ON game_progressive_sessions;
-- No direct SELECT for authenticated — SECURITY DEFINER RPCs only (strip secret_state).
DROP POLICY IF EXISTS "admin read progressive sessions" ON game_progressive_sessions;
CREATE POLICY "admin read progressive sessions" ON game_progressive_sessions
  FOR SELECT USING (_is_admin());

REVOKE ALL ON game_progressive_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON game_progressive_sessions TO service_role;
GRANT SELECT ON game_progressive_sessions TO authenticated; -- admin policy only effective rows

COMMENT ON COLUMN game_progressive_sessions.secret_state IS
  'E23 — server-only PF secret (mine positions / deck). Never return via client RPCs.';

CREATE OR REPLACE FUNCTION _progressive_session_public(p_row game_progressive_sessions)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN jsonb_build_object(
    'session_id', p_row.id,
    'game', p_row.game,
    'round_id', p_row.round_id,
    'currency', p_row.currency,
    'stake', p_row.stake,
    'client_seed', p_row.client_seed,
    'nonce', p_row.nonce,
    'status', p_row.status,
    'public_state', p_row.public_state,
    'current_multiplier', p_row.current_multiplier,
    'bet_id', p_row.bet_id,
    'expires_at', p_row.expires_at,
    'settled_at', p_row.settled_at
  );
END;
$$;

REVOKE ALL ON FUNCTION _progressive_session_public(game_progressive_sessions)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _progressive_settle_session(
  p_session_id UUID,
  p_status progressive_session_status,
  p_multiplier NUMERIC,
  p_public_state JSONB,
  p_result_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sess game_progressive_sessions%ROWTYPE;
  v_stake NUMERIC;
  v_raw_payout NUMERIC;
  v_payout NUMERIC;
  v_dust NUMERIC;
  v_house NUMERIC;
  v_bet_id UUID := gen_random_uuid();
  v_debit_id UUID;
  v_credit_id UUID;
  v_transfer_id UUID := gen_random_uuid();
  v_house_account TEXT;
  v_bet_status bet_status;
  v_selection JSONB;
BEGIN
  SELECT * INTO v_sess FROM game_progressive_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'session_not_found'; END IF;
  IF v_sess.status <> 'active' THEN
    RAISE EXCEPTION 'session_not_active';
  END IF;

  v_stake := v_sess.stake::NUMERIC;
  v_raw_payout := v_stake * GREATEST(p_multiplier, 0);
  v_payout := trunc(v_raw_payout, 6);
  v_dust := trunc(v_raw_payout - v_payout, 6);
  v_house := v_stake - v_payout - v_dust;
  v_bet_status := CASE WHEN v_payout > 0 THEN 'won'::bet_status ELSE 'lost'::bet_status END;
  v_house_account := CASE WHEN v_sess.currency = 'PHON' THEN 'game_house_phon' ELSE 'game_house_usdt' END;

  v_selection := jsonb_build_object(
    'progressive', TRUE,
    'public_state', COALESCE(p_public_state, v_sess.public_state),
    'multiplier', _fmt6(GREATEST(p_multiplier, 0))
  );

  PERFORM _unlock_wallet_internal(
    v_sess.user_id, v_sess.currency, _fmt6(v_stake),
    'game_stake_unlock', 'gps_unlock:' || v_sess.id::TEXT
  );
  v_debit_id := _debit_wallet_internal(
    v_sess.user_id, v_sess.currency, _fmt6(v_stake),
    'game_stake_settle', 'gps_debit:' || v_sess.id::TEXT
  );
  IF v_payout > 0 THEN
    v_credit_id := _credit_wallet_internal(
      v_sess.user_id, v_sess.currency, _fmt6(v_payout),
      'game_payout', 'gps_pay:' || v_sess.id::TEXT
    );
  END IF;

  IF v_house >= 0 THEN
    PERFORM _credit_system_account(
      v_house_account, _fmt6(v_house), 'game_house_settle',
      v_sess.user_id, v_sess.id::TEXT, v_transfer_id
    );
  ELSE
    PERFORM _debit_system_account(
      v_house_account, _fmt6(abs(v_house)), 'game_house_settle',
      v_sess.user_id, v_sess.id::TEXT, v_transfer_id
    );
  END IF;
  IF v_dust > 0 THEN
    PERFORM _credit_system_account(
      CASE WHEN v_sess.currency = 'PHON' THEN 'dust_phon' ELSE 'dust_usdt' END,
      _fmt6(v_dust), 'game_rounding_dust',
      v_sess.user_id, v_sess.id::TEXT, v_transfer_id
    );
  END IF;

  INSERT INTO game_bets (
    id, round_id, user_id, game, currency, stake, selection,
    client_seed, nonce, result_payload, payout, status, idempotency_key,
    stake_lock_id, payout_ledger_id, house_ledger_transfer_id, settled_at
  ) VALUES (
    v_bet_id, v_sess.round_id, v_sess.user_id, v_sess.game, v_sess.currency,
    _fmt6(v_stake), v_selection, v_sess.client_seed, v_sess.nonce,
    p_result_payload, _fmt6(v_payout), v_bet_status,
    'gps:' || v_sess.id::TEXT || ':' || p_status::TEXT,
    v_sess.stake_lock_id, COALESCE(v_credit_id, v_debit_id), v_transfer_id, NOW()
  );

  UPDATE game_rounds SET
    status = 'settled',
    result_payload = p_result_payload,
    settled_at = NOW()
  WHERE id = v_sess.round_id;

  UPDATE game_progressive_sessions SET
    status = p_status,
    public_state = COALESCE(p_public_state, public_state),
    current_multiplier = _fmt6(GREATEST(p_multiplier, 0)),
    bet_id = v_bet_id,
    settled_at = NOW()
  WHERE id = p_session_id
  RETURNING * INTO v_sess;

  BEGIN
    PERFORM _grant_mission(v_sess.user_id, 'first_game');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  PERFORM _rg_try_refresh_user_month_loss(v_sess.user_id, 'game', v_sess.currency);

  RETURN _progressive_session_public(v_sess) || jsonb_build_object(
    'bet_id', v_bet_id,
    'payout', _fmt6(v_payout),
    'bet_status', v_bet_status
  );
END;
$$;

REVOKE ALL ON FUNCTION _progressive_settle_session(UUID, progressive_session_status, NUMERIC, JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_progressive_start(
  p_game TEXT,
  p_currency TEXT,
  p_stake TEXT,
  p_init JSONB,
  p_client_seed TEXT,
  p_idempotency_key TEXT,
  p_use_account_pf BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_game game_code;
  v_ccy currency;
  v_stake NUMERIC;
  v_existing game_progressive_sessions%ROWTYPE;
  v_pf user_game_pf_state%ROWTYPE;
  v_client_seed TEXT;
  v_nonce INT := 1;
  v_seed TEXT;
  v_hash TEXT;
  v_round_id UUID := gen_random_uuid();
  v_session_id UUID := gen_random_uuid();
  v_lock_id UUID;
  v_ttl INT;
  v_floats DOUBLE PRECISION[];
  v_mine_count INT;
  v_cells INT[];
  v_positions INT[] := ARRAY[]::INT[];
  v_j INT;
  v_tmp INT;
  v_shuffle_idx INT;
  v_start_card INT;
  v_float_idx INT;
  v_deck INT[];
  v_player INT[];
  v_dealer INT[];
  v_secret JSONB;
  v_public JSONB;
  v_selection JSONB;
  v_bj_mult NUMERIC;
  v_settled JSONB;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  SELECT * INTO v_existing
    FROM game_progressive_sessions
   WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.user_id <> v_user_id THEN
      RAISE EXCEPTION 'idempotency_conflict';
    END IF;
    RETURN _progressive_session_public(v_existing);
  END IF;

  PERFORM _enforce_rate_limit(v_user_id, 'rpc_progressive_start');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('game');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_stake);

  BEGIN
    v_game := p_game::game_code;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_game_code';
  END;
  IF v_game NOT IN ('mines', 'hilo', 'blackjack') THEN
    RAISE EXCEPTION 'invalid_progressive_game';
  END IF;

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;
  IF v_ccy NOT IN ('PHON', 'USDT') THEN
    RAISE EXCEPTION 'invalid_currency';
  END IF;

  PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'game', v_ccy);
  PERFORM _assert_game_feature_enabled(v_game);

  v_stake := p_stake::NUMERIC;
  IF v_stake <= 0 THEN RAISE EXCEPTION 'invalid_stake'; END IF;
  PERFORM _assert_game_stake_limits(v_game, v_ccy, v_stake);

  IF EXISTS (
    SELECT 1 FROM game_progressive_sessions
    WHERE user_id = v_user_id AND status = 'active' AND game = v_game
  ) THEN
    RAISE EXCEPTION 'progressive_session_already_active';
  END IF;

  IF COALESCE(p_use_account_pf, FALSE) THEN
    v_pf := _game_pf_ensure_state(v_user_id);
    v_client_seed := v_pf.client_seed;
    v_nonce := v_pf.next_nonce;
    v_seed := v_pf.active_server_seed;
    v_hash := v_pf.active_server_seed_hash;
  ELSE
    IF p_client_seed IS NULL OR length(btrim(p_client_seed)) = 0 THEN
      RAISE EXCEPTION 'invalid_client_seed';
    END IF;
    v_client_seed := p_client_seed;
    v_nonce := 1;
    v_seed := encode(extensions.gen_random_bytes(32), 'hex');
    v_hash := encode(extensions.digest(v_seed, 'sha256'), 'hex');
  END IF;

  IF v_game = 'mines' THEN
    v_mine_count := COALESCE((p_init->>'mineCount')::INT, 0);
    IF v_mine_count < 1 OR v_mine_count > 24 THEN
      RAISE EXCEPTION 'invalid_mines_selection';
    END IF;
    v_selection := jsonb_build_object(
      'mineCount', v_mine_count,
      'revealedCells', '[]'::JSONB
    );
    -- Exposure uses a single-reveal selection (cashout floor); step/cashout re-check via mult.
    PERFORM _assert_game_exposure_cap(v_game, v_ccy, v_stake, jsonb_build_object(
      'mineCount', v_mine_count,
      'revealedCells', '[0]'::JSONB
    ));

    v_floats := _game_float_stream(v_seed, v_client_seed, v_nonce, 25);
    v_cells := ARRAY(SELECT generate_series(0, 24));
    FOR v_shuffle_idx IN REVERSE 25..2 LOOP
      v_j := floor(_require_game_float(v_floats, v_shuffle_idx - 1) * v_shuffle_idx)::INT + 1;
      v_tmp := v_cells[v_shuffle_idx];
      v_cells[v_shuffle_idx] := v_cells[v_j];
      v_cells[v_j] := v_tmp;
    END LOOP;
    v_positions := v_cells[1:v_mine_count];
    v_secret := jsonb_build_object('minePositions', to_jsonb(v_positions));
    v_public := jsonb_build_object(
      'mineCount', v_mine_count,
      'revealedCells', '[]'::JSONB,
      'hitMine', FALSE
    );

  ELSIF v_game = 'hilo' THEN
    v_floats := _game_float_stream(v_seed, v_client_seed, v_nonce, 11);
    v_float_idx := 1;
    IF p_init ? 'startCard' AND p_init->>'startCard' IS NOT NULL THEN
      v_start_card := (p_init->>'startCard')::INT;
      IF v_start_card < 1 OR v_start_card > 13 THEN
        RAISE EXCEPTION 'invalid_hilo_start_card';
      END IF;
    ELSE
      v_start_card := floor(_require_game_float(v_floats, v_float_idx) * 13)::INT + 1;
      v_float_idx := v_float_idx + 1;
    END IF;
    v_selection := jsonb_build_object('guesses', '[]'::JSONB, 'startCard', v_start_card);
    PERFORM _assert_game_exposure_cap(v_game, v_ccy, v_stake, jsonb_build_object(
      'startCard', v_start_card,
      'guesses', '["higher"]'::JSONB
    ));
    v_secret := jsonb_build_object('float_idx', v_float_idx, 'server_seed', v_seed);
    v_public := jsonb_build_object(
      'cards', jsonb_build_array(v_start_card),
      'guesses', '[]'::JSONB,
      'multiplier', '1.000000'
    );

  ELSE
    -- blackjack
    PERFORM _assert_game_exposure_cap(v_game, v_ccy, v_stake, '{}'::JSONB);
    v_floats := _game_float_stream(v_seed, v_client_seed, v_nonce, 51);
    v_deck := _bj_shuffle(v_floats);
    v_player := ARRAY[v_deck[1], v_deck[2]];
    v_dealer := ARRAY[v_deck[3], v_deck[4]];
    v_secret := jsonb_build_object(
      'deck', to_jsonb(v_deck),
      'idx', 5,
      'dealer_hole', v_dealer[2]
    );
    v_public := jsonb_build_object(
      'player', to_jsonb(v_player),
      'dealer', jsonb_build_array(v_dealer[1]),
      'playerValue', _bj_hand_value(v_player),
      'dealerUp', _bj_card_value(v_dealer[1]),
      'actions', '[]'::JSONB,
      'doubled', FALSE
    );
    v_selection := '{}'::JSONB;
  END IF;

  INSERT INTO game_rounds (id, game, server_seed_hash, server_seed)
  VALUES (v_round_id, v_game, v_hash, v_seed);

  v_lock_id := _lock_wallet_internal(
    v_user_id, v_ccy, _fmt6(v_stake),
    'game_stake_lock',
    'gps_lock:' || v_user_id::TEXT || ':' || p_idempotency_key
  );

  v_ttl := COALESCE(
    NULLIF(btrim((SELECT value FROM app_config WHERE key = 'progressive_session_ttl_seconds')), '')::INT,
    900
  );

  INSERT INTO game_progressive_sessions (
    id, user_id, game, round_id, currency, stake, client_seed, nonce,
    status, secret_state, public_state, current_multiplier,
    stake_lock_id, idempotency_key, expires_at
  ) VALUES (
    v_session_id, v_user_id, v_game, v_round_id, v_ccy, _fmt6(v_stake),
    v_client_seed, v_nonce, 'active', v_secret, v_public, '1.000000',
    v_lock_id, p_idempotency_key, NOW() + make_interval(secs => v_ttl)
  )
  RETURNING * INTO v_existing;

  IF COALESCE(p_use_account_pf, FALSE) THEN
    UPDATE user_game_pf_state
       SET next_nonce = next_nonce + 1, updated_at = NOW()
     WHERE user_id = v_user_id;
  END IF;

  -- Natural blackjack settles immediately when player has BJ and dealer does not.
  IF v_game = 'blackjack' THEN
    IF _bj_hand_value(v_player) = 21 AND cardinality(v_player) = 2 THEN
      IF _bj_hand_value(v_dealer) = 21 THEN
        v_bj_mult := 1;
      ELSE
        v_bj_mult := 2.5;
      END IF;
      v_public := v_public || jsonb_build_object(
        'dealer', to_jsonb(v_dealer),
        'dealerValue', _bj_hand_value(v_dealer),
        'terminal', TRUE,
        'outcome', CASE
          WHEN v_bj_mult = 2.5 THEN 'blackjack'
          WHEN v_bj_mult = 1 THEN 'push'
          ELSE 'lost'
        END
      );
      v_settled := _progressive_settle_session(
        v_session_id,
        CASE WHEN v_bj_mult > 0 THEN 'cashed_out'::progressive_session_status
             ELSE 'busted'::progressive_session_status END,
        v_bj_mult,
        v_public,
        v_public
      );
      RETURN v_settled;
    END IF;
  END IF;

  RETURN _progressive_session_public(v_existing);
END;
$$;

REVOKE ALL ON FUNCTION rpc_progressive_start(TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_progressive_start(TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, BOOLEAN)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_progressive_step(
  p_session_id UUID,
  p_action JSONB,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_sess game_progressive_sessions%ROWTYPE;
  v_cell INT;
  v_mines INT[];
  v_revealed INT[];
  v_mine_count INT;
  v_hit BOOLEAN;
  v_mult NUMERIC;
  v_public JSONB;
  v_secret JSONB;
  v_guess TEXT;
  v_cards JSONB;
  v_guesses JSONB;
  v_current INT;
  v_next INT;
  v_float_idx INT;
  v_floats DOUBLE PRECISION[];
  v_correct BOOLEAN;
  v_move TEXT;
  v_deck INT[];
  v_idx INT;
  v_player INT[];
  v_dealer INT[];
  v_dealer_hole INT;
  v_pv INT;
  v_dv INT;
  v_bj_mult NUMERIC;
  v_doubled BOOLEAN;
  v_extra NUMERIC;
  v_lock_id UUID;
  v_terminal BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  PERFORM _enforce_rate_limit(v_user_id, 'rpc_progressive_step');

  SELECT * INTO v_sess FROM game_progressive_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'session_not_found'; END IF;
  IF v_sess.user_id <> v_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF v_sess.status <> 'active' THEN RAISE EXCEPTION 'session_not_active'; END IF;
  IF v_sess.expires_at < NOW() THEN
    RETURN _progressive_settle_session(
      p_session_id, 'expired'::progressive_session_status, 0,
      v_sess.public_state || jsonb_build_object('expired', TRUE),
      jsonb_build_object('expired', TRUE)
    );
  END IF;

  IF v_sess.game = 'mines' THEN
    v_cell := (p_action->>'cell')::INT;
    IF v_cell IS NULL OR v_cell < 0 OR v_cell > 24 THEN
      RAISE EXCEPTION 'invalid_mines_cell';
    END IF;
    SELECT array_agg((value)::INT) INTO v_mines
      FROM jsonb_array_elements_text(v_sess.secret_state->'minePositions');
    SELECT COALESCE(array_agg((value)::INT), ARRAY[]::INT[]) INTO v_revealed
      FROM jsonb_array_elements_text(v_sess.public_state->'revealedCells');
    IF v_cell = ANY(v_revealed) THEN
      RAISE EXCEPTION 'cell_already_revealed';
    END IF;
    v_mine_count := (v_sess.public_state->>'mineCount')::INT;
    v_hit := v_cell = ANY(v_mines);
    IF v_hit THEN
      v_public := v_sess.public_state || jsonb_build_object(
        'revealedCells', to_jsonb(array_append(v_revealed, v_cell)),
        'hitMine', TRUE,
        'minePositions', to_jsonb(v_mines)
      );
      RETURN _progressive_settle_session(
        p_session_id, 'busted'::progressive_session_status, 0, v_public, v_public
      );
    END IF;
    v_revealed := array_append(v_revealed, v_cell);
    v_mult := _mines_multiplier(v_mine_count, cardinality(v_revealed));
    v_public := v_sess.public_state || jsonb_build_object(
      'revealedCells', to_jsonb(v_revealed),
      'hitMine', FALSE
    );
    UPDATE game_progressive_sessions SET
      public_state = v_public,
      current_multiplier = _fmt6(v_mult)
    WHERE id = p_session_id
    RETURNING * INTO v_sess;
    RETURN _progressive_session_public(v_sess);

  ELSIF v_sess.game = 'hilo' THEN
    v_guess := lower(btrim(COALESCE(p_action->>'guess', '')));
    IF v_guess NOT IN ('higher', 'lower', 'skip') THEN
      RAISE EXCEPTION 'invalid_hilo_guess';
    END IF;
    v_cards := v_sess.public_state->'cards';
    v_guesses := COALESCE(v_sess.public_state->'guesses', '[]'::JSONB);
    IF jsonb_array_length(v_guesses) >= 10 THEN
      RAISE EXCEPTION 'hilo_too_many_guesses';
    END IF;
    v_current := (v_cards->>(jsonb_array_length(v_cards) - 1))::INT;
    v_float_idx := COALESCE((v_sess.secret_state->>'float_idx')::INT, 1);
    v_floats := _game_float_stream(
      COALESCE(v_sess.secret_state->>'server_seed',
        (SELECT server_seed FROM game_rounds WHERE id = v_sess.round_id)),
      v_sess.client_seed, v_sess.nonce, 11
    );
    v_next := floor(_require_game_float(v_floats, v_float_idx) * 13)::INT + 1;
    v_float_idx := v_float_idx + 1;
    IF v_guess = 'skip' THEN
      v_correct := TRUE;
      v_mult := v_sess.current_multiplier::NUMERIC;
    ELSIF v_guess = 'higher' THEN
      v_correct := v_next > v_current;
    ELSE
      v_correct := v_next < v_current;
    END IF;
    IF v_guess <> 'skip' THEN
      IF v_correct THEN
        v_mult := floor(v_sess.current_multiplier::NUMERIC
          * _hilo_step_multiplier(v_current, v_guess) * 100) / 100;
      ELSE
        v_mult := 0;
      END IF;
    END IF;
    v_cards := v_cards || to_jsonb(v_next);
    v_guesses := v_guesses || to_jsonb(v_guess);
    v_public := jsonb_build_object(
      'cards', v_cards,
      'guesses', v_guesses,
      'multiplier', _fmt6(v_mult),
      'lastCorrect', v_correct
    );
    v_secret := v_sess.secret_state || jsonb_build_object('float_idx', v_float_idx);
    IF NOT v_correct THEN
      UPDATE game_progressive_sessions SET secret_state = v_secret WHERE id = p_session_id;
      RETURN _progressive_settle_session(
        p_session_id, 'busted'::progressive_session_status, 0, v_public, v_public
      );
    END IF;
    UPDATE game_progressive_sessions SET
      secret_state = v_secret,
      public_state = v_public,
      current_multiplier = _fmt6(v_mult)
    WHERE id = p_session_id
    RETURNING * INTO v_sess;
    RETURN _progressive_session_public(v_sess);

  ELSIF v_sess.game = 'blackjack' THEN
    v_move := lower(btrim(COALESCE(p_action->>'move', '')));
    IF v_move IN ('split', 'insurance') THEN
      RAISE EXCEPTION 'blackjack_action_unsupported';
    END IF;
    IF v_move NOT IN ('hit', 'stand', 'double') THEN
      RAISE EXCEPTION 'invalid_blackjack_move';
    END IF;

    SELECT array_agg((t.value)::INT ORDER BY t.ordinality)
      INTO v_deck
      FROM jsonb_array_elements_text(v_sess.secret_state->'deck') WITH ORDINALITY AS t(value, ordinality);
    v_idx := (v_sess.secret_state->>'idx')::INT;
    v_dealer_hole := (v_sess.secret_state->>'dealer_hole')::INT;
    SELECT array_agg((t.value)::INT ORDER BY t.ordinality)
      INTO v_player
      FROM jsonb_array_elements_text(v_sess.public_state->'player') WITH ORDINALITY AS t(value, ordinality);
    v_dealer := ARRAY[
      (v_sess.public_state->'dealer'->>0)::INT,
      v_dealer_hole
    ];
    v_doubled := COALESCE((v_sess.public_state->>'doubled')::BOOLEAN, FALSE);

    IF v_move = 'double' THEN
      IF cardinality(v_player) <> 2 OR v_doubled THEN
        RAISE EXCEPTION 'invalid_action';
      END IF;
      v_extra := v_sess.stake::NUMERIC;
      -- Additional lock; settle unlocks combined stake amount (original + double).
      v_lock_id := _lock_wallet_internal(
        v_user_id, v_sess.currency, _fmt6(v_extra),
        'game_stake_lock',
        'gps_dbl:' || v_sess.id::TEXT || ':' || p_idempotency_key
      );
      UPDATE game_progressive_sessions SET
        stake = _fmt6(v_sess.stake::NUMERIC * 2),
        stake_lock_id = COALESCE(v_lock_id, stake_lock_id)
      WHERE id = p_session_id
      RETURNING * INTO v_sess;
      v_player := array_append(v_player, v_deck[v_idx]);
      v_idx := v_idx + 1;
      v_doubled := TRUE;
      v_terminal := TRUE;
    ELSIF v_move = 'hit' THEN
      v_player := array_append(v_player, v_deck[v_idx]);
      v_idx := v_idx + 1;
      IF _bj_hand_value(v_player) > 21 THEN
        v_terminal := TRUE;
      END IF;
    ELSE
      v_terminal := TRUE;
    END IF;

    v_pv := _bj_hand_value(v_player);
    IF v_terminal AND v_pv <= 21 THEN
      WHILE _bj_hand_value(v_dealer) < 17 LOOP
        v_dealer := array_append(v_dealer, v_deck[v_idx]);
        v_idx := v_idx + 1;
      END LOOP;
    END IF;

    v_secret := jsonb_build_object(
      'deck', to_jsonb(v_deck),
      'idx', v_idx,
      'dealer_hole', v_dealer_hole
    );
    v_public := jsonb_build_object(
      'player', to_jsonb(v_player),
      'dealer', CASE WHEN v_terminal THEN to_jsonb(v_dealer)
                    ELSE jsonb_build_array(v_dealer[1]) END,
      'playerValue', v_pv,
      'dealerUp', _bj_card_value(v_dealer[1]),
      'actions', COALESCE(v_sess.public_state->'actions', '[]'::JSONB) || to_jsonb(v_move),
      'doubled', v_doubled,
      'terminal', v_terminal
    );

    UPDATE game_progressive_sessions SET secret_state = v_secret WHERE id = p_session_id;

    IF NOT v_terminal THEN
      UPDATE game_progressive_sessions SET public_state = v_public WHERE id = p_session_id
      RETURNING * INTO v_sess;
      RETURN _progressive_session_public(v_sess);
    END IF;

    v_dv := _bj_hand_value(v_dealer);
    IF v_pv > 21 THEN
      v_bj_mult := 0;
    ELSIF cardinality(v_player) = 2 AND v_pv = 21 AND NOT v_doubled AND v_dv <> 21 THEN
      v_bj_mult := 2.5;
    ELSIF v_dv > 21 THEN
      v_bj_mult := 2;
    ELSIF v_pv > v_dv THEN
      v_bj_mult := 2;
    ELSIF v_pv = v_dv THEN
      v_bj_mult := 1;
    ELSE
      v_bj_mult := 0;
    END IF;

    v_public := v_public || jsonb_build_object(
      'dealerValue', v_dv,
      'outcome', CASE
        WHEN v_bj_mult = 2.5 THEN 'blackjack'
        WHEN v_bj_mult = 2 THEN 'won'
        WHEN v_bj_mult = 1 THEN 'push'
        ELSE 'lost'
      END
    );

    RETURN _progressive_settle_session(
      p_session_id,
      CASE WHEN v_bj_mult > 0 THEN 'cashed_out'::progressive_session_status
           ELSE 'busted'::progressive_session_status END,
      v_bj_mult, v_public, v_public
    );
  END IF;

  RAISE EXCEPTION 'invalid_progressive_game';
END;
$$;

REVOKE ALL ON FUNCTION rpc_progressive_step(UUID, JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_progressive_step(UUID, JSONB, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_progressive_cashout(
  p_session_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_sess game_progressive_sessions%ROWTYPE;
  v_revealed_count INT;
  v_mult NUMERIC;
  v_public JSONB;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  PERFORM _enforce_rate_limit(v_user_id, 'rpc_progressive_cashout');

  SELECT * INTO v_sess FROM game_progressive_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'session_not_found'; END IF;
  IF v_sess.user_id <> v_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF v_sess.status <> 'active' THEN RAISE EXCEPTION 'session_not_active'; END IF;
  IF v_sess.game = 'blackjack' THEN
    RAISE EXCEPTION 'blackjack_cashout_forbidden';
  END IF;
  IF v_sess.expires_at < NOW() THEN
    RETURN _progressive_settle_session(
      p_session_id, 'expired'::progressive_session_status, 0,
      v_sess.public_state || jsonb_build_object('expired', TRUE),
      jsonb_build_object('expired', TRUE)
    );
  END IF;

  v_mult := v_sess.current_multiplier::NUMERIC;
  IF v_sess.game = 'mines' THEN
    v_revealed_count := jsonb_array_length(COALESCE(v_sess.public_state->'revealedCells', '[]'::JSONB));
    IF v_revealed_count <= 0 OR v_mult <= 1 THEN
      RAISE EXCEPTION 'cashout_not_available';
    END IF;
  ELSE
    IF jsonb_array_length(COALESCE(v_sess.public_state->'guesses', '[]'::JSONB)) <= 0
       OR v_mult <= 1 THEN
      RAISE EXCEPTION 'cashout_not_available';
    END IF;
  END IF;

  v_public := v_sess.public_state || jsonb_build_object('cashedOut', TRUE, 'multiplier', _fmt6(v_mult));
  IF v_sess.game = 'mines' THEN
    v_public := v_public || jsonb_build_object(
      'minePositions', v_sess.secret_state->'minePositions'
    );
  END IF;

  RETURN _progressive_settle_session(
    p_session_id, 'cashed_out'::progressive_session_status, v_mult, v_public, v_public
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_progressive_cashout(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_progressive_cashout(UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_sweep_stale_progressive_sessions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT := 0;
  v_sess game_progressive_sessions%ROWTYPE;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  FOR v_sess IN
    SELECT * FROM game_progressive_sessions
     WHERE status = 'active' AND expires_at < NOW()
     FOR UPDATE
  LOOP
    PERFORM _progressive_settle_session(
      v_sess.id, 'expired'::progressive_session_status, 0,
      v_sess.public_state || jsonb_build_object('expired', TRUE),
      jsonb_build_object('expired', TRUE, 'forfeit', TRUE)
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('expired', v_count);
END;
$$;

REVOKE ALL ON FUNCTION rpc_sweep_stale_progressive_sessions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_sweep_stale_progressive_sessions() TO service_role;

-- ═══════════════════════════════════════════════════════════════
-- C. Live crash
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE live_crash_round_status AS ENUM ('betting', 'flying', 'crashed', 'void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE live_crash_bet_status AS ENUM ('pending', 'cashed_out', 'busted', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS live_crash_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status live_crash_round_status NOT NULL DEFAULT 'betting',
  server_seed_hash TEXT NOT NULL,
  server_seed TEXT NOT NULL,
  crash_multiplier TEXT,
  sequence_no BIGINT GENERATED ALWAYS AS IDENTITY,
  betting_closes_at TIMESTAMPTZ NOT NULL,
  flew_at TIMESTAMPTZ,
  crashed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lcr_status_idx ON live_crash_rounds (status, created_at DESC);

ALTER TABLE live_crash_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read live_crash_rounds" ON live_crash_rounds;
CREATE POLICY "public read live_crash_rounds" ON live_crash_rounds
  FOR SELECT USING (TRUE);

REVOKE ALL ON live_crash_rounds FROM PUBLIC;
GRANT SELECT ON live_crash_rounds TO anon, authenticated;
GRANT ALL ON live_crash_rounds TO service_role;
REVOKE SELECT (server_seed) ON live_crash_rounds FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS live_crash_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES live_crash_rounds(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  currency currency NOT NULL,
  stake TEXT NOT NULL,
  auto_cashout TEXT,
  cashout_multiplier TEXT,
  status live_crash_bet_status NOT NULL DEFAULT 'pending',
  client_seed TEXT NOT NULL,
  nonce INT NOT NULL DEFAULT 1,
  stake_lock_id UUID REFERENCES wallet_ledger(id),
  payout TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  CONSTRAINT lcb_stake_pos CHECK (stake ~ '^\d+(\.\d+)?$')
);

CREATE UNIQUE INDEX IF NOT EXISTS lcb_one_pending_per_user_round
  ON live_crash_bets (round_id, user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS lcb_user_idx ON live_crash_bets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lcb_round_idx ON live_crash_bets (round_id, status);

ALTER TABLE live_crash_bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own read live_crash_bets" ON live_crash_bets;
CREATE POLICY "own read live_crash_bets" ON live_crash_bets
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON live_crash_bets FROM PUBLIC, anon;
GRANT SELECT ON live_crash_bets TO authenticated;
GRANT ALL ON live_crash_bets TO service_role;

INSERT INTO app_config (key, value, description) VALUES
  ('feature_live_crash_enabled', 'true', 'E23 — live crash shared round feature flag.'),
  ('live_crash_betting_seconds', '8', 'E23 — betting window seconds before fly.'),
  ('progressive_session_ttl_seconds', '900', 'E23 — progressive session TTL seconds.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_get_game_pf_state', 60, 1, 1, 60),
  ('rpc_set_game_client_seed', 20, 0.333, 1, 60),
  ('rpc_rotate_game_server_seed', 10, 0.167, 1, 60),
  ('rpc_progressive_start', 20, 0.333, 1, 60),
  ('rpc_progressive_step', 60, 1, 1, 60),
  ('rpc_progressive_cashout', 20, 0.333, 1, 60),
  ('rpc_live_crash_get_current', 120, 2, 1, 60),
  ('rpc_live_crash_place_bet', 20, 0.333, 1, 60),
  ('rpc_live_crash_cashout', 60, 1, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

CREATE OR REPLACE FUNCTION _live_crash_current_mult(
  p_flew_at TIMESTAMPTZ,
  p_crash_mult TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ms NUMERIC;
  v_mult NUMERIC;
BEGIN
  IF p_flew_at IS NULL OR p_crash_mult IS NULL THEN
    RETURN 1.00;
  END IF;
  v_ms := GREATEST(0, EXTRACT(EPOCH FROM (clock_timestamp() - p_flew_at)) * 1000);
  v_mult := floor(exp(0.00006 * v_ms) * 100) / 100;
  RETURN LEAST(GREATEST(v_mult, 1.00), p_crash_mult::NUMERIC);
END;
$$;

REVOKE ALL ON FUNCTION _live_crash_current_mult(TIMESTAMPTZ, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _live_crash_settle_bet(
  p_bet_id UUID,
  p_status live_crash_bet_status,
  p_cashout_mult NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bet live_crash_bets%ROWTYPE;
  v_stake NUMERIC;
  v_raw_payout NUMERIC;
  v_payout NUMERIC;
  v_dust NUMERIC;
  v_house NUMERIC;
  v_debit_id UUID;
  v_credit_id UUID;
  v_transfer_id UUID := gen_random_uuid();
  v_house_account TEXT;
BEGIN
  SELECT * INTO v_bet FROM live_crash_bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF v_bet.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'bet_id', v_bet.id,
      'status', v_bet.status,
      'payout', v_bet.payout,
      'already_settled', TRUE
    );
  END IF;

  v_stake := v_bet.stake::NUMERIC;
  v_raw_payout := CASE
    WHEN p_status = 'cashed_out' THEN v_stake * GREATEST(p_cashout_mult, 0)
    ELSE 0
  END;
  v_payout := trunc(v_raw_payout, 6);
  v_dust := trunc(v_raw_payout - v_payout, 6);
  v_house := v_stake - v_payout - v_dust;
  v_house_account := CASE WHEN v_bet.currency = 'PHON' THEN 'game_house_phon' ELSE 'game_house_usdt' END;

  PERFORM _unlock_wallet_internal(
    v_bet.user_id, v_bet.currency, _fmt6(v_stake),
    'game_stake_unlock', 'lcb_unlock:' || v_bet.id::TEXT
  );
  v_debit_id := _debit_wallet_internal(
    v_bet.user_id, v_bet.currency, _fmt6(v_stake),
    'game_stake_settle', 'lcb_debit:' || v_bet.id::TEXT
  );
  IF v_payout > 0 THEN
    v_credit_id := _credit_wallet_internal(
      v_bet.user_id, v_bet.currency, _fmt6(v_payout),
      'game_payout', 'lcb_pay:' || v_bet.id::TEXT
    );
  END IF;

  IF v_house >= 0 THEN
    PERFORM _credit_system_account(
      v_house_account, _fmt6(v_house), 'game_house_settle',
      v_bet.user_id, v_bet.id::TEXT, v_transfer_id
    );
  ELSE
    PERFORM _debit_system_account(
      v_house_account, _fmt6(abs(v_house)), 'game_house_settle',
      v_bet.user_id, v_bet.id::TEXT, v_transfer_id
    );
  END IF;
  IF v_dust > 0 THEN
    PERFORM _credit_system_account(
      CASE WHEN v_bet.currency = 'PHON' THEN 'dust_phon' ELSE 'dust_usdt' END,
      _fmt6(v_dust), 'game_rounding_dust',
      v_bet.user_id, v_bet.id::TEXT, v_transfer_id
    );
  END IF;

  UPDATE live_crash_bets SET
    status = p_status,
    cashout_multiplier = CASE WHEN p_status = 'cashed_out' THEN _fmt6(p_cashout_mult) ELSE NULL END,
    payout = _fmt6(v_payout),
    settled_at = NOW()
  WHERE id = p_bet_id
  RETURNING * INTO v_bet;

  PERFORM _rg_try_refresh_user_month_loss(v_bet.user_id, 'game', v_bet.currency);

  RETURN jsonb_build_object(
    'bet_id', v_bet.id,
    'status', v_bet.status,
    'payout', v_bet.payout,
    'cashout_multiplier', v_bet.cashout_multiplier,
    'already_settled', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION _live_crash_settle_bet(UUID, live_crash_bet_status, NUMERIC)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_live_crash_get_current()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_round live_crash_rounds%ROWTYPE;
  v_uid UUID := auth.uid();
  v_current NUMERIC;
BEGIN
  IF v_uid IS NOT NULL THEN
    PERFORM _enforce_rate_limit(v_uid, 'rpc_live_crash_get_current');
  END IF;

  SELECT * INTO v_round
    FROM live_crash_rounds
   WHERE status IN ('betting', 'flying')
   ORDER BY created_at DESC
   LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_round
      FROM live_crash_rounds
     ORDER BY created_at DESC
     LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('round', NULL);
  END IF;

  v_current := CASE
    WHEN v_round.status = 'flying' THEN
      _live_crash_current_mult(v_round.flew_at, v_round.crash_multiplier)
    ELSE NULL
  END;

  RETURN jsonb_build_object(
    'round', jsonb_build_object(
      'id', v_round.id,
      'status', v_round.status,
      'server_seed_hash', v_round.server_seed_hash,
      'server_seed', CASE WHEN v_round.status = 'crashed' THEN v_round.server_seed ELSE NULL END,
      'crash_multiplier', CASE
        WHEN v_round.status IN ('flying', 'crashed') THEN v_round.crash_multiplier
        ELSE NULL
      END,
      'current_multiplier', CASE WHEN v_current IS NULL THEN NULL ELSE _fmt6(v_current) END,
      'sequence_no', v_round.sequence_no,
      'betting_closes_at', v_round.betting_closes_at,
      'flew_at', v_round.flew_at,
      'crashed_at', v_round.crashed_at,
      'created_at', v_round.created_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_live_crash_get_current() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_live_crash_get_current() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_live_crash_place_bet(
  p_currency TEXT,
  p_stake TEXT,
  p_auto_cashout TEXT,
  p_client_seed TEXT,
  p_idempotency_key TEXT,
  p_use_account_pf BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_round live_crash_rounds%ROWTYPE;
  v_ccy currency;
  v_stake NUMERIC;
  v_auto NUMERIC;
  v_existing live_crash_bets%ROWTYPE;
  v_pf user_game_pf_state%ROWTYPE;
  v_client_seed TEXT;
  v_nonce INT := 1;
  v_lock_id UUID;
  v_bet_id UUID := gen_random_uuid();
  v_flag TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  SELECT * INTO v_existing FROM live_crash_bets WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.user_id <> v_user_id THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN jsonb_build_object(
      'bet_id', v_existing.id,
      'round_id', v_existing.round_id,
      'status', v_existing.status,
      'already_placed', TRUE
    );
  END IF;

  SELECT value INTO v_flag FROM app_config WHERE key = 'feature_live_crash_enabled';
  IF v_flag = 'false' THEN RAISE EXCEPTION 'feature_disabled'; END IF;

  PERFORM _enforce_rate_limit(v_user_id, 'rpc_live_crash_place_bet');
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('game');
  PERFORM _assert_game_feature_enabled('crash');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_stake);

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;
  IF v_ccy NOT IN ('PHON', 'USDT') THEN RAISE EXCEPTION 'invalid_currency'; END IF;

  PERFORM _assert_rg_domain_entry_allowed(v_user_id, 'game', v_ccy);

  v_stake := p_stake::NUMERIC;
  IF v_stake <= 0 THEN RAISE EXCEPTION 'invalid_stake'; END IF;
  PERFORM _assert_game_stake_limits('crash'::game_code, v_ccy, v_stake);

  IF p_auto_cashout IS NOT NULL AND btrim(p_auto_cashout) <> '' THEN
    PERFORM _assert_amount_text(p_auto_cashout);
    v_auto := p_auto_cashout::NUMERIC;
    IF v_auto < 1.01 THEN RAISE EXCEPTION 'invalid_auto_cashout'; END IF;
    PERFORM _assert_game_exposure_cap(
      'crash'::game_code, v_ccy, v_stake,
      jsonb_build_object('autoCashout', _fmt6(v_auto))
    );
  ELSE
    v_auto := NULL;
  END IF;

  SELECT * INTO v_round
    FROM live_crash_rounds
   WHERE status = 'betting'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no_betting_round'; END IF;
  IF v_round.betting_closes_at <= NOW() THEN
    RAISE EXCEPTION 'betting_closed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM live_crash_bets
     WHERE round_id = v_round.id AND user_id = v_user_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'already_bet_this_round';
  END IF;

  IF COALESCE(p_use_account_pf, FALSE) THEN
    v_pf := _game_pf_ensure_state(v_user_id);
    v_client_seed := v_pf.client_seed;
    v_nonce := v_pf.next_nonce;
  ELSE
    IF p_client_seed IS NULL OR length(btrim(p_client_seed)) = 0 THEN
      RAISE EXCEPTION 'invalid_client_seed';
    END IF;
    v_client_seed := p_client_seed;
    v_nonce := 1;
  END IF;

  v_lock_id := _lock_wallet_internal(
    v_user_id, v_ccy, _fmt6(v_stake),
    'game_stake_lock',
    'lcb_lock:' || v_user_id::TEXT || ':' || p_idempotency_key
  );

  INSERT INTO live_crash_bets (
    id, round_id, user_id, currency, stake, auto_cashout, status,
    client_seed, nonce, stake_lock_id, idempotency_key
  ) VALUES (
    v_bet_id, v_round.id, v_user_id, v_ccy, _fmt6(v_stake),
    CASE WHEN v_auto IS NULL THEN NULL ELSE _fmt6(v_auto) END,
    'pending', v_client_seed, v_nonce, v_lock_id, p_idempotency_key
  );

  IF COALESCE(p_use_account_pf, FALSE) THEN
    UPDATE user_game_pf_state
       SET next_nonce = next_nonce + 1, updated_at = NOW()
     WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'bet_id', v_bet_id,
    'round_id', v_round.id,
    'status', 'pending',
    'already_placed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_live_crash_place_bet(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_live_crash_place_bet(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_live_crash_cashout(
  p_bet_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_bet live_crash_bets%ROWTYPE;
  v_round live_crash_rounds%ROWTYPE;
  v_mult NUMERIC;
  v_floor NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  PERFORM _enforce_rate_limit(v_user_id, 'rpc_live_crash_cashout');

  SELECT * INTO v_bet FROM live_crash_bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF v_bet.user_id <> v_user_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF v_bet.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'bet_id', v_bet.id,
      'status', v_bet.status,
      'payout', v_bet.payout,
      'already_settled', TRUE
    );
  END IF;

  SELECT * INTO v_round FROM live_crash_rounds WHERE id = v_bet.round_id FOR UPDATE;
  IF v_round.status <> 'flying' THEN
    RAISE EXCEPTION 'round_not_flying';
  END IF;

  v_mult := _live_crash_current_mult(v_round.flew_at, v_round.crash_multiplier);
  IF v_mult >= v_round.crash_multiplier::NUMERIC THEN
    RAISE EXCEPTION 'already_crashed';
  END IF;

  v_floor := floor(v_mult * 100) / 100;
  IF v_floor < 1.01 THEN
    RAISE EXCEPTION 'cashout_too_early';
  END IF;

  RETURN _live_crash_settle_bet(p_bet_id, 'cashed_out'::live_crash_bet_status, v_floor);
END;
$$;

REVOKE ALL ON FUNCTION rpc_live_crash_cashout(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_live_crash_cashout(UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_live_crash_advance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_round live_crash_rounds%ROWTYPE;
  v_bet live_crash_bets%ROWTYPE;
  v_seed TEXT;
  v_hash TEXT;
  v_secs INT;
  v_crash TEXT;
  v_resolution JSONB;
  v_current NUMERIC;
  v_auto NUMERIC;
  v_actions INT := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_round
    FROM live_crash_rounds
   WHERE status IN ('betting', 'flying')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  -- No active round → create betting
  IF NOT FOUND THEN
    v_secs := COALESCE(
      NULLIF(btrim((SELECT value FROM app_config WHERE key = 'live_crash_betting_seconds')), '')::INT,
      8
    );
    v_seed := encode(extensions.gen_random_bytes(32), 'hex');
    v_hash := encode(extensions.digest(v_seed, 'sha256'), 'hex');
    INSERT INTO live_crash_rounds (
      status, server_seed_hash, server_seed, betting_closes_at
    ) VALUES (
      'betting', v_hash, v_seed, NOW() + make_interval(secs => v_secs)
    )
    RETURNING * INTO v_round;
    RETURN jsonb_build_object(
      'action', 'created_betting',
      'round_id', v_round.id,
      'betting_closes_at', v_round.betting_closes_at
    );
  END IF;

  IF v_round.status = 'betting' AND v_round.betting_closes_at <= NOW() THEN
    v_resolution := _game_result(
      'crash'::game_code,
      v_round.server_seed,
      'live_round',
      1,
      '{"autoCashout":"1.01"}'::JSONB
    );
    v_crash := _fmt6((v_resolution->'result'->>'crashMultiplier')::NUMERIC);
    UPDATE live_crash_rounds SET
      status = 'flying',
      crash_multiplier = v_crash,
      flew_at = NOW()
    WHERE id = v_round.id
    RETURNING * INTO v_round;
    RETURN jsonb_build_object(
      'action', 'started_flying',
      'round_id', v_round.id,
      'crash_multiplier', v_crash
    );
  END IF;

  IF v_round.status = 'flying' THEN
    v_current := _live_crash_current_mult(v_round.flew_at, v_round.crash_multiplier);

    FOR v_bet IN
      SELECT * FROM live_crash_bets
       WHERE round_id = v_round.id AND status = 'pending'
         AND auto_cashout IS NOT NULL
       FOR UPDATE
    LOOP
      v_auto := v_bet.auto_cashout::NUMERIC;
      IF v_auto <= v_current AND v_auto <= v_round.crash_multiplier::NUMERIC THEN
        PERFORM _live_crash_settle_bet(v_bet.id, 'cashed_out'::live_crash_bet_status, v_auto);
        v_actions := v_actions + 1;
      END IF;
    END LOOP;

    IF v_current >= v_round.crash_multiplier::NUMERIC THEN
      FOR v_bet IN
        SELECT * FROM live_crash_bets
         WHERE round_id = v_round.id AND status = 'pending'
         FOR UPDATE
      LOOP
        PERFORM _live_crash_settle_bet(v_bet.id, 'busted'::live_crash_bet_status, 0);
        v_actions := v_actions + 1;
      END LOOP;

      UPDATE live_crash_rounds SET
        status = 'crashed',
        crashed_at = NOW()
      WHERE id = v_round.id;

      RETURN jsonb_build_object(
        'action', 'crashed',
        'round_id', v_round.id,
        'crash_multiplier', v_round.crash_multiplier,
        'settled_bets', v_actions
      );
    END IF;

    RETURN jsonb_build_object(
      'action', 'flying_tick',
      'round_id', v_round.id,
      'current_multiplier', _fmt6(v_current),
      'auto_cashed', v_actions
    );
  END IF;

  -- betting still open
  RETURN jsonb_build_object(
    'action', 'betting_open',
    'round_id', v_round.id,
    'betting_closes_at', v_round.betting_closes_at
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_live_crash_advance() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_live_crash_advance() TO service_role;

-- Realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'live_crash_rounds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_crash_rounds;
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL; -- publication may be absent in some local fixtures
END;
$$;

-- Recreate PF blocking helper now that progressive + live tables exist
-- (first definition above references tables created later — replace is safe)
CREATE OR REPLACE FUNCTION _game_pf_has_blocking_activity(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM game_progressive_sessions
    WHERE user_id = p_user_id AND status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM live_crash_bets b
      JOIN live_crash_rounds r ON r.id = b.round_id
     WHERE b.user_id = p_user_id
       AND b.status = 'pending'
       AND r.status IN ('betting', 'flying')
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION _game_pf_has_blocking_activity(UUID) FROM PUBLIC, anon, authenticated;
