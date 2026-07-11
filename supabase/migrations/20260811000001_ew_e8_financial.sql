-- ============================================================
-- Migration: ew_e8_financial
-- E8 Financial — P2P transfer · trading API keys · giftcard redeem reverse
-- Plan: ew-e8-financial-wave · ADR-018
-- ============================================================

SET search_path = public, pg_temp;

-- ─── System accounts ─────────────────────────────────────────────────────────

INSERT INTO system_accounts (code, currency, description) VALUES
  ('p2p_transfer_fee_phon', 'PHON', 'P2P transfer fee counter-leg (Σ=0).'),
  ('giftcard_redeem_hold_phon', 'PHON', 'Pending PHON→giftcard redeem hold (Σ=0).'),
  ('giftcard_redeem_settled_phon', 'PHON', 'Fulfilled giftcard redeem settlement sink (Σ=0).')
ON CONFLICT (code) DO NOTHING;

-- ─── Config + feature kills ──────────────────────────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('feature_p2p_transfer_enabled', 'true',
   'P2P transfer kill switch. false disables rpc_transfer_to_user.'),
  ('feature_giftcard_redeem_enabled', 'true',
   'Giftcard redeem (PHON→giftcard out) kill switch.'),
  ('p2p_transfer_fee_bps', '0',
   'P2P transfer fee in basis points of gross amount (Closed Beta default 0).'),
  ('p2p_transfer_min_phon', '1.000000',
   'Minimum PHON amount for P2P transfer (gross before fee).'),
  ('p2p_transfer_daily_cap_phon', '1000000.000000',
   'Per-user UTC-day P2P debit cap including fee (PHON).'),
  ('trading_api_keys_max_active', '5',
   'Max non-revoked trading API keys per user.'),
  ('giftcard_redeem_fee_bps', '500',
   'Extra redeem fee bps on face PHON equivalent (PHON→giftcard out).')
ON CONFLICT (key) DO NOTHING;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_transfer_to_user', 10, 0.2, 1, 60),
  ('rpc_create_trading_api_key', 5, 0.1, 1, 60),
  ('rpc_revoke_trading_api_key', 10, 0.2, 1, 60),
  ('rpc_create_giftcard_redeem_request', 5, 0.1, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- Extend admin feature whitelist for new kills
CREATE OR REPLACE FUNCTION rpc_set_feature_enabled(
  p_feature TEXT,
  p_enabled BOOLEAN,
  p_reason  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_key   TEXT;
  v_rows  INT;
BEGIN
  IF NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_feature NOT IN (
    'spot','futures','staking','game','referral','deposit','withdrawal',
    'p2p_transfer','giftcard_redeem'
  ) THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  v_key := 'feature_' || p_feature || '_enabled';
  UPDATE app_config
     SET value = CASE WHEN p_enabled THEN 'true' ELSE 'false' END, updated_at = NOW()
   WHERE key = v_key;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (v_actor, 'feature_toggle', 'app_config',
    jsonb_build_object('feature', p_feature, 'enabled', p_enabled, 'reason', p_reason));

  RETURN jsonb_build_object('feature', p_feature, 'enabled', p_enabled);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT) TO authenticated, service_role;

-- ─── Tables: p2p_transfers ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS p2p_transfers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  recipient_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  currency           currency NOT NULL DEFAULT 'PHON' CHECK (currency = 'PHON'),
  amount             TEXT NOT NULL,
  fee_amount         TEXT NOT NULL DEFAULT '0.000000',
  net_amount         TEXT NOT NULL,
  memo               TEXT,
  status             TEXT NOT NULL DEFAULT 'completed'
                     CHECK (status IN ('completed', 'failed')),
  client_request_id  TEXT,
  sender_ledger_id   UUID REFERENCES wallet_ledger(id),
  recipient_ledger_id UUID REFERENCES wallet_ledger(id),
  fee_ledger_id      UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT p2p_transfers_distinct_users CHECK (sender_id <> recipient_id),
  CONSTRAINT p2p_transfers_sender_client_uq UNIQUE (sender_id, client_request_id)
);

CREATE INDEX IF NOT EXISTS p2p_transfers_sender_idx
  ON p2p_transfers (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS p2p_transfers_recipient_idx
  ON p2p_transfers (recipient_id, created_at DESC);

ALTER TABLE p2p_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "p2p_transfers: participant select" ON p2p_transfers;
CREATE POLICY "p2p_transfers: participant select" ON p2p_transfers
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "p2p_transfers: admin select" ON p2p_transfers;
CREATE POLICY "p2p_transfers: admin select" ON p2p_transfers
  FOR SELECT USING (_is_admin());

REVOKE ALL ON TABLE p2p_transfers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE p2p_transfers TO authenticated;
GRANT ALL ON TABLE p2p_transfers TO service_role;

-- ─── Tables: trading_api_keys ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trading_api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_prefix   TEXT NOT NULL,
  key_hash     TEXT NOT NULL,
  scopes       TEXT[] NOT NULL DEFAULT ARRAY['read']::TEXT[],
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trading_api_keys_name_len CHECK (char_length(btrim(name)) BETWEEN 1 AND 64),
  CONSTRAINT trading_api_keys_scopes_nonempty CHECK (cardinality(scopes) >= 1),
  CONSTRAINT trading_api_keys_prefix_uq UNIQUE (key_prefix)
);

CREATE INDEX IF NOT EXISTS trading_api_keys_user_idx
  ON trading_api_keys (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trading_api_keys_hash_idx
  ON trading_api_keys (key_hash)
  WHERE revoked_at IS NULL;

ALTER TABLE trading_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trading_api_keys: own select" ON trading_api_keys;
CREATE POLICY "trading_api_keys: own select" ON trading_api_keys
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trading_api_keys: admin select" ON trading_api_keys;
CREATE POLICY "trading_api_keys: admin select" ON trading_api_keys
  FOR SELECT USING (_is_admin());

REVOKE ALL ON TABLE trading_api_keys FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE trading_api_keys TO authenticated;
GRANT ALL ON TABLE trading_api_keys TO service_role;

-- ─── Tables: giftcard_redeem_requests ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS giftcard_redeem_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  wallet_id          UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  kind               giftcard_kind NOT NULL,
  face_value_krw     TEXT NOT NULL,
  phon_gross         TEXT NOT NULL,
  fee_phon           TEXT NOT NULL,
  phon_cost          TEXT NOT NULL,
  fee_rate_bps       INT NOT NULL,
  rate_snapshot_id   UUID REFERENCES exchange_rate_snapshots(id),
  fee_market_id      UUID REFERENCES giftcard_fee_market(id),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'fulfilled', 'rejected')),
  admin_note         TEXT,
  reviewed_by        UUID REFERENCES profiles(id),
  reviewed_at        TIMESTAMPTZ,
  fulfilled_at       TIMESTAMPTZ,
  client_request_id  TEXT,
  debit_ledger_id    UUID REFERENCES wallet_ledger(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT giftcard_redeem_user_client_uq UNIQUE (user_id, client_request_id)
);

CREATE INDEX IF NOT EXISTS grr_user_status_idx
  ON giftcard_redeem_requests (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS grr_status_created_idx
  ON giftcard_redeem_requests (status, created_at DESC);

ALTER TABLE giftcard_redeem_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "giftcard_redeem: own select" ON giftcard_redeem_requests;
CREATE POLICY "giftcard_redeem: own select" ON giftcard_redeem_requests
  FOR SELECT USING (auth.uid() = user_id OR _is_admin());

DROP POLICY IF EXISTS "giftcard_redeem: admin update" ON giftcard_redeem_requests;
CREATE POLICY "giftcard_redeem: admin update" ON giftcard_redeem_requests
  FOR UPDATE USING (_is_admin());

REVOKE ALL ON TABLE giftcard_redeem_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE giftcard_redeem_requests TO authenticated;
GRANT ALL ON TABLE giftcard_redeem_requests TO service_role;

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _p2p_resolve_recipient(p_recipient TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_raw TEXT := btrim(COALESCE(p_recipient, ''));
BEGIN
  IF v_raw = '' THEN
    RAISE EXCEPTION 'p2p_recipient_required';
  END IF;

  BEGIN
    v_id := v_raw::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_id := NULL;
  END;

  IF v_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_id) THEN
      RAISE EXCEPTION 'p2p_recipient_not_found';
    END IF;
    RETURN v_id;
  END IF;

  SELECT id INTO v_id
    FROM profiles
   WHERE lower(username) = lower(v_raw)
   LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'p2p_recipient_not_found';
  END IF;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION _p2p_resolve_recipient(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _trading_api_key_hash(p_secret TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT encode(extensions.digest(convert_to(p_secret, 'UTF8'), 'sha256'), 'hex');
$$;

REVOKE ALL ON FUNCTION _trading_api_key_hash(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _giftcard_redeem_quote(p_kind giftcard_kind, p_face_krw TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_market   giftcard_fee_market%ROWTYPE;
  v_rate_id  UUID;
  v_rate     NUMERIC;
  v_captured TIMESTAMPTZ;
  v_stale_d  INT;
  v_fee_bps  INT;
  v_face     NUMERIC;
  v_gross    NUMERIC;
  v_fee      NUMERIC;
  v_cost     NUMERIC;
BEGIN
  IF p_face_krw IS NULL OR p_face_krw !~ '^\d+(\.\d+)?$' OR p_face_krw::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  v_face := p_face_krw::NUMERIC;

  SELECT * INTO v_market
    FROM giftcard_fee_market
   WHERE kind = p_kind;

  IF NOT FOUND OR v_market.enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'giftcard_kind_disabled';
  END IF;

  SELECT COALESCE(NULLIF(value, '')::INT, 30) INTO v_stale_d
    FROM app_config WHERE key = 'giftcard_fee_market_stale_days';
  IF v_market.last_checked_at < NOW() - make_interval(days => COALESCE(v_stale_d, 30)) THEN
    RAISE EXCEPTION 'giftcard_fee_stale';
  END IF;

  IF v_face < v_market.min_face_value_krw::NUMERIC THEN
    RAISE EXCEPTION 'face_value_below_min';
  END IF;
  IF v_face > v_market.max_face_value_krw::NUMERIC THEN
    RAISE EXCEPTION 'face_value_above_max';
  END IF;

  SELECT id, rate::NUMERIC, captured_at
    INTO v_rate_id, v_rate, v_captured
    FROM exchange_rate_snapshots
   WHERE base_currency = 'PHON' AND quote_currency = 'KRW'
     AND is_active = TRUE AND rate::NUMERIC > 0
   ORDER BY captured_at DESC
   LIMIT 1;

  IF v_rate_id IS NULL OR v_rate IS NULL OR v_rate <= 0 THEN
    RAISE EXCEPTION 'phon_krw_rate_unavailable';
  END IF;
  IF v_captured < NOW() - INTERVAL '15 minutes' THEN
    RAISE EXCEPTION 'phon_krw_rate_stale';
  END IF;

  SELECT COALESCE(NULLIF(value, '')::INT, 500) INTO v_fee_bps
    FROM app_config WHERE key = 'giftcard_redeem_fee_bps';

  v_gross := v_face / v_rate;
  v_fee := floor(v_gross * v_fee_bps) / 10000.0;
  v_cost := v_gross + v_fee;

  IF v_cost <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  RETURN jsonb_build_object(
    'kind', p_kind,
    'face_value_krw', _fmt6(v_face),
    'phon_gross', _fmt6(v_gross),
    'fee_phon', _fmt6(v_fee),
    'phon_cost', _fmt6(v_cost),
    'fee_rate_bps', v_fee_bps,
    'rate_snapshot_id', v_rate_id,
    'fee_market_id', v_market.id
  );
END;
$$;

REVOKE ALL ON FUNCTION _giftcard_redeem_quote(giftcard_kind, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── P2P RPCs ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_transfer_to_user(
  p_recipient TEXT,
  p_amount TEXT,
  p_memo TEXT DEFAULT NULL,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sender UUID := auth.uid();
  v_recipient UUID;
  v_first UUID;
  v_second UUID;
  v_amount NUMERIC;
  v_fee_bps INT;
  v_fee NUMERIC;
  v_net NUMERIC;
  v_min TEXT;
  v_cap TEXT;
  v_day_sum NUMERIC;
  v_transfer_id UUID;
  v_out_id UUID;
  v_in_id UUID;
  v_memo TEXT;
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('p2p_transfer');
  PERFORM _assert_account_activity_live(v_sender);
  PERFORM _assert_onboarding_consent(v_sender);
  PERFORM _assert_sanctions_screening(v_sender);
  PERFORM _enforce_rate_limit(v_sender, 'rpc_transfer_to_user');

  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  v_amount := p_amount::NUMERIC;

  SELECT COALESCE(NULLIF(value, ''), '1.000000') INTO v_min
    FROM app_config WHERE key = 'p2p_transfer_min_phon';
  IF v_amount < v_min::NUMERIC THEN
    RAISE EXCEPTION 'p2p_amount_below_min';
  END IF;

  v_recipient := _p2p_resolve_recipient(p_recipient);
  IF v_recipient = v_sender THEN
    RAISE EXCEPTION 'p2p_self_transfer';
  END IF;

  PERFORM _assert_account_activity_live(v_recipient);

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_sender, btrim(p_client_request_id), 'rpc_transfer_to_user')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      SELECT id, amount, fee_amount, net_amount, recipient_id
        INTO v_transfer_id, p_amount, v_fee, v_net, v_recipient
        FROM p2p_transfers
       WHERE sender_id = v_sender AND client_request_id = btrim(p_client_request_id);
      IF FOUND THEN
        RETURN jsonb_build_object(
          'ok', TRUE,
          'transfer_id', v_transfer_id,
          'amount', _fmt6(p_amount::NUMERIC),
          'fee_amount', _fmt6(v_fee::NUMERIC),
          'net_amount', _fmt6(v_net::NUMERIC),
          'recipient_id', v_recipient,
          'idempotent', TRUE
        );
      END IF;
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  SELECT COALESCE(NULLIF(value, '')::INT, 0) INTO v_fee_bps
    FROM app_config WHERE key = 'p2p_transfer_fee_bps';
  v_fee := floor(v_amount * v_fee_bps) / 10000.0;
  v_net := v_amount - v_fee;
  IF v_net <= 0 THEN
    RAISE EXCEPTION 'p2p_fee_exceeds_amount';
  END IF;

  SELECT COALESCE(NULLIF(value, ''), '1000000.000000') INTO v_cap
    FROM app_config WHERE key = 'p2p_transfer_daily_cap_phon';
  SELECT COALESCE(SUM(amount::NUMERIC), 0) INTO v_day_sum
    FROM p2p_transfers
   WHERE sender_id = v_sender
     AND status = 'completed'
     AND (created_at AT TIME ZONE 'UTC')::DATE = (NOW() AT TIME ZONE 'UTC')::DATE;
  IF v_day_sum + v_amount > v_cap::NUMERIC THEN
    RAISE EXCEPTION 'p2p_daily_cap_exceeded';
  END IF;

  v_memo := NULLIF(btrim(COALESCE(p_memo, '')), '');
  IF v_memo IS NOT NULL AND char_length(v_memo) > 200 THEN
    RAISE EXCEPTION 'p2p_memo_too_long';
  END IF;

  -- Deadlock-safe wallet lock order
  IF v_sender < v_recipient THEN
    v_first := v_sender; v_second := v_recipient;
  ELSE
    v_first := v_recipient; v_second := v_sender;
  END IF;
  PERFORM 1 FROM wallets WHERE user_id = v_first FOR UPDATE;
  PERFORM 1 FROM wallets WHERE user_id = v_second FOR UPDATE;

  v_transfer_id := gen_random_uuid();

  v_out_id := _debit_wallet_internal(
    v_sender, 'PHON', _fmt6(v_amount), 'p2p_transfer_out',
    'p2p:' || v_transfer_id::TEXT || ':out'
  );
  v_in_id := _credit_wallet_internal(
    v_recipient, 'PHON', _fmt6(v_net), 'p2p_transfer_in',
    'p2p:' || v_transfer_id::TEXT || ':in'
  );

  IF v_fee > 0 THEN
    PERFORM _credit_system_account(
      'p2p_transfer_fee_phon', _fmt6(v_fee), 'p2p_transfer_fee',
      v_sender, v_transfer_id::TEXT, v_out_id
    );
  END IF;

  INSERT INTO p2p_transfers (
    id, sender_id, recipient_id, currency, amount, fee_amount, net_amount,
    memo, status, client_request_id, sender_ledger_id, recipient_ledger_id
  ) VALUES (
    v_transfer_id, v_sender, v_recipient, 'PHON',
    _fmt6(v_amount), _fmt6(v_fee), _fmt6(v_net),
    v_memo, 'completed',
    CASE WHEN p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0
         THEN btrim(p_client_request_id) ELSE NULL END,
    v_out_id, v_in_id
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'transfer_id', v_transfer_id,
    'amount', _fmt6(v_amount),
    'fee_amount', _fmt6(v_fee),
    'net_amount', _fmt6(v_net),
    'recipient_id', v_recipient,
    'sender_ledger_id', v_out_id,
    'recipient_ledger_id', v_in_id
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_transfer_to_user(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_transfer_to_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_list_p2p_transfers(p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_lim INT := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_rows JSONB;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::JSONB ORDER BY t.created_at DESC), '[]'::JSONB)
    INTO v_rows
    FROM (
      SELECT id, sender_id, recipient_id, amount, fee_amount, net_amount,
             memo, status, created_at
        FROM p2p_transfers
       WHERE sender_id = v_user OR recipient_id = v_user
       ORDER BY created_at DESC
       LIMIT v_lim
    ) t;

  RETURN jsonb_build_object('ok', TRUE, 'transfers', v_rows);
END;
$$;

REVOKE ALL ON FUNCTION rpc_list_p2p_transfers(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_list_p2p_transfers(INT) TO authenticated;

-- ─── Trading API key RPCs ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_list_trading_api_keys()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_rows JSONB;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::JSONB ORDER BY t.created_at DESC), '[]'::JSONB)
    INTO v_rows
    FROM (
      SELECT id, name, key_prefix,
             (key_prefix || '…') AS key_masked,
             scopes, last_used_at, revoked_at, created_at
        FROM trading_api_keys
       WHERE user_id = v_user
       ORDER BY created_at DESC
    ) t;

  RETURN jsonb_build_object('ok', TRUE, 'keys', v_rows);
END;
$$;

REVOKE ALL ON FUNCTION rpc_list_trading_api_keys() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_list_trading_api_keys() TO authenticated;

CREATE OR REPLACE FUNCTION rpc_create_trading_api_key(
  p_name TEXT,
  p_scopes TEXT[] DEFAULT ARRAY['read']::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_name TEXT := btrim(COALESCE(p_name, ''));
  v_scopes TEXT[];
  v_max INT;
  v_active INT;
  v_secret TEXT;
  v_prefix TEXT;
  v_hash TEXT;
  v_id UUID;
  v_scope TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_user);
  PERFORM _assert_onboarding_consent(v_user);
  PERFORM _enforce_rate_limit(v_user, 'rpc_create_trading_api_key');

  IF char_length(v_name) < 1 OR char_length(v_name) > 64 THEN
    RAISE EXCEPTION 'api_key_name_invalid';
  END IF;

  IF p_scopes IS NULL OR cardinality(p_scopes) < 1 THEN
    RAISE EXCEPTION 'api_key_scopes_required';
  END IF;

  v_scopes := ARRAY[]::TEXT[];
  FOREACH v_scope IN ARRAY p_scopes LOOP
    v_scope := lower(btrim(v_scope));
    IF v_scope NOT IN ('read', 'trade') THEN
      RAISE EXCEPTION 'api_key_scope_invalid' USING HINT = v_scope;
    END IF;
    IF NOT (v_scope = ANY (v_scopes)) THEN
      v_scopes := array_append(v_scopes, v_scope);
    END IF;
  END LOOP;

  SELECT COALESCE(NULLIF(value, '')::INT, 5) INTO v_max
    FROM app_config WHERE key = 'trading_api_keys_max_active';
  SELECT COUNT(*)::INT INTO v_active
    FROM trading_api_keys
   WHERE user_id = v_user AND revoked_at IS NULL;
  IF v_active >= v_max THEN
    RAISE EXCEPTION 'api_key_limit_reached';
  END IF;

  v_secret := 'phon_live_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_prefix := left(v_secret, 16);
  v_hash := _trading_api_key_hash(v_secret);

  INSERT INTO trading_api_keys (user_id, name, key_prefix, key_hash, scopes)
  VALUES (v_user, v_name, v_prefix, v_hash, v_scopes)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'id', v_id,
    'name', v_name,
    'key_prefix', v_prefix,
    'api_key', v_secret,
    'scopes', to_jsonb(v_scopes),
    'secret_shown_once', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_trading_api_key(TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_trading_api_key(TEXT, TEXT[]) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_revoke_trading_api_key(p_key_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row trading_api_keys%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user, 'rpc_revoke_trading_api_key');

  IF p_key_id IS NULL THEN RAISE EXCEPTION 'api_key_required'; END IF;

  SELECT * INTO v_row
    FROM trading_api_keys
   WHERE id = p_key_id AND user_id = v_user
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'api_key_not_found'; END IF;
  IF v_row.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', TRUE, 'id', v_row.id, 'already_revoked', TRUE);
  END IF;

  UPDATE trading_api_keys
     SET revoked_at = NOW(), updated_at = NOW()
   WHERE id = p_key_id;

  RETURN jsonb_build_object('ok', TRUE, 'id', p_key_id, 'revoked', TRUE);
END;
$$;

REVOKE ALL ON FUNCTION rpc_revoke_trading_api_key(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_revoke_trading_api_key(UUID) TO authenticated;

-- ─── Giftcard redeem (reverse) RPCs ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_preview_giftcard_redeem(
  p_kind TEXT,
  p_face_value_krw TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_kind giftcard_kind;
  v_quote JSONB;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_feature_enabled('giftcard_redeem');

  BEGIN
    v_kind := p_kind::giftcard_kind;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_kind';
  END;

  v_quote := _giftcard_redeem_quote(v_kind, p_face_value_krw);
  RETURN jsonb_build_object('ok', TRUE) || v_quote;
END;
$$;

REVOKE ALL ON FUNCTION rpc_preview_giftcard_redeem(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_preview_giftcard_redeem(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_create_giftcard_redeem_request(
  p_kind TEXT,
  p_face_value_krw TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_kind giftcard_kind;
  v_quote JSONB;
  v_wallet wallets%ROWTYPE;
  v_req_id UUID;
  v_ledger UUID;
  v_gross TEXT;
  v_fee TEXT;
  v_cost TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('giftcard_redeem');
  PERFORM _assert_feature_enabled('withdrawal');
  PERFORM _assert_account_activity_live(v_user);
  PERFORM _assert_onboarding_consent(v_user);
  PERFORM _assert_sanctions_screening(v_user);
  PERFORM _enforce_rate_limit(v_user, 'rpc_create_giftcard_redeem_request');

  BEGIN
    v_kind := p_kind::giftcard_kind;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_kind';
  END;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user, btrim(p_client_request_id), 'rpc_create_giftcard_redeem_request')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      SELECT id INTO v_req_id FROM giftcard_redeem_requests
       WHERE user_id = v_user AND client_request_id = btrim(p_client_request_id);
      IF FOUND THEN
        RETURN jsonb_build_object('ok', TRUE, 'redeem_id', v_req_id, 'idempotent', TRUE);
      END IF;
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  v_quote := _giftcard_redeem_quote(v_kind, p_face_value_krw);
  v_gross := v_quote->>'phon_gross';
  v_fee := v_quote->>'fee_phon';
  v_cost := v_quote->>'phon_cost';

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  v_req_id := gen_random_uuid();
  v_ledger := _debit_wallet_internal(
    v_user, 'PHON', v_cost, 'giftcard_redeem_debit',
    'gcr:' || v_req_id::TEXT || ':debit'
  );

  PERFORM _credit_system_account(
    'giftcard_redeem_hold_phon', v_gross, 'giftcard_redeem_hold',
    v_user, v_req_id::TEXT, v_ledger
  );
  IF v_fee::NUMERIC > 0 THEN
    PERFORM _credit_system_account(
      'giftcard_fee_phon', v_fee, 'giftcard_redeem_fee',
      v_user, v_req_id::TEXT, v_ledger
    );
  END IF;

  INSERT INTO giftcard_redeem_requests (
    id, user_id, wallet_id, kind, face_value_krw, phon_gross, fee_phon, phon_cost,
    fee_rate_bps, rate_snapshot_id, fee_market_id, status, client_request_id, debit_ledger_id
  ) VALUES (
    v_req_id, v_user, v_wallet.id, v_kind,
    v_quote->>'face_value_krw', v_gross, v_fee, v_cost,
    (v_quote->>'fee_rate_bps')::INT,
    (v_quote->>'rate_snapshot_id')::UUID,
    (v_quote->>'fee_market_id')::UUID,
    'pending',
    CASE WHEN p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0
         THEN btrim(p_client_request_id) ELSE NULL END,
    v_ledger
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'redeem_id', v_req_id,
    'face_value_krw', v_quote->>'face_value_krw',
    'phon_cost', v_cost,
    'fee_phon', v_fee,
    'phon_gross', v_gross,
    'status', 'pending'
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_giftcard_redeem_request(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_giftcard_redeem_request(TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_fulfill_giftcard_redeem(
  p_redeem_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_req giftcard_redeem_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN RAISE EXCEPTION 'reason_too_short'; END IF;
  IF p_redeem_id IS NULL THEN RAISE EXCEPTION 'redeem_required'; END IF;

  SELECT * INTO v_req FROM giftcard_redeem_requests WHERE id = p_redeem_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'redeem_not_found'; END IF;
  IF v_req.status = 'fulfilled' THEN
    RETURN jsonb_build_object('ok', TRUE, 'redeem_id', p_redeem_id, 'already_fulfilled', TRUE);
  END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'invalid_redeem_status'; END IF;

  PERFORM _debit_system_account(
    'giftcard_redeem_hold_phon', v_req.phon_gross, 'giftcard_redeem_fulfill',
    v_req.user_id, p_redeem_id::TEXT, v_req.debit_ledger_id
  );
  PERFORM _credit_system_account(
    'giftcard_redeem_settled_phon', v_req.phon_gross, 'giftcard_redeem_fulfill',
    v_req.user_id, p_redeem_id::TEXT, v_req.debit_ledger_id
  );

  UPDATE giftcard_redeem_requests
     SET status = 'fulfilled',
         admin_note = btrim(p_reason),
         reviewed_by = auth.uid(),
         reviewed_at = NOW(),
         fulfilled_at = NOW(),
         updated_at = NOW()
   WHERE id = p_redeem_id;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    auth.uid(), 'giftcard_redeem_fulfill', 'giftcard_redeem_requests', p_redeem_id,
    jsonb_build_object('reason', btrim(p_reason), 'phon_gross', v_req.phon_gross)
  );

  RETURN jsonb_build_object('ok', TRUE, 'redeem_id', p_redeem_id, 'status', 'fulfilled');
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_fulfill_giftcard_redeem(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_fulfill_giftcard_redeem(UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_reject_giftcard_redeem(
  p_redeem_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_req giftcard_redeem_requests%ROWTYPE;
  v_refund UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN RAISE EXCEPTION 'reason_too_short'; END IF;
  IF p_redeem_id IS NULL THEN RAISE EXCEPTION 'redeem_required'; END IF;

  SELECT * INTO v_req FROM giftcard_redeem_requests WHERE id = p_redeem_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'redeem_not_found'; END IF;
  IF v_req.status = 'rejected' THEN
    RETURN jsonb_build_object('ok', TRUE, 'redeem_id', p_redeem_id, 'already_rejected', TRUE);
  END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'invalid_redeem_status'; END IF;

  PERFORM _debit_system_account(
    'giftcard_redeem_hold_phon', v_req.phon_gross, 'giftcard_redeem_reject',
    v_req.user_id, p_redeem_id::TEXT, v_req.debit_ledger_id
  );
  IF v_req.fee_phon::NUMERIC > 0 THEN
    PERFORM _debit_system_account(
      'giftcard_fee_phon', v_req.fee_phon, 'giftcard_redeem_reject_fee',
      v_req.user_id, p_redeem_id::TEXT, v_req.debit_ledger_id
    );
  END IF;

  v_refund := _credit_wallet_internal(
    v_req.user_id, 'PHON', v_req.phon_cost, 'giftcard_redeem_refund',
    'gcr:' || p_redeem_id::TEXT || ':refund'
  );

  UPDATE giftcard_redeem_requests
     SET status = 'rejected',
         admin_note = btrim(p_reason),
         reviewed_by = auth.uid(),
         reviewed_at = NOW(),
         updated_at = NOW()
   WHERE id = p_redeem_id;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    auth.uid(), 'giftcard_redeem_reject', 'giftcard_redeem_requests', p_redeem_id,
    jsonb_build_object('reason', btrim(p_reason), 'refund_ledger_id', v_refund)
  );

  RETURN jsonb_build_object(
    'ok', TRUE, 'redeem_id', p_redeem_id, 'status', 'rejected', 'refund_ledger_id', v_refund
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_reject_giftcard_redeem(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_reject_giftcard_redeem(UUID, TEXT) TO authenticated, service_role;
