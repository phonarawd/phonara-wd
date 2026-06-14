-- ============================================================
-- ENGINE 100 — casino RTP ops_alerts fix + USDT crypto deposit rails
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Fix rpc_check_casino_rtp_drift (ops_alerts schema: summary/runbook_key/metadata) ─
CREATE OR REPLACE FUNCTION rpc_check_casino_rtp_drift()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row RECORD;
  v_theoretical NUMERIC;
  v_tolerance NUMERIC := 0.05;
  v_min_bets INT := 500;
  v_tripped INT := 0;
  v_alerts INT := 0;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_row IN SELECT * FROM casino_game_rtp_stats WHERE bet_count >= v_min_bets LOOP
    v_theoretical := CASE v_row.game::TEXT
      WHEN 'roulette' THEN 36.0 / 37.0
      ELSE NULL
    END;

    IF v_theoretical IS NULL THEN
      CONTINUE;
    END IF;

    IF ABS(v_row.measured_rtp - v_theoretical) > v_tolerance THEN
      v_alerts := v_alerts + 1;
      IF NOT EXISTS (
        SELECT 1 FROM ops_alerts
         WHERE dedupe_key = 'casino_rtp_drift:' || v_row.game::TEXT || ':' || v_row.currency::TEXT
           AND status IN ('open', 'acknowledged')
      ) THEN
        INSERT INTO ops_alerts (
          dedupe_key, source_check_id, severity, status,
          summary, runbook_key, first_seen_at, last_seen_at,
          occurrence_count, metadata
        ) VALUES (
          'casino_rtp_drift:' || v_row.game::TEXT || ':' || v_row.currency::TEXT,
          'casino_rtp_drift',
          'critical',
          'open',
          v_row.game::TEXT || ' ' || v_row.currency::TEXT || ' measured=' || v_row.measured_rtp::TEXT,
          'casino_rtp_drift',
          v_now, v_now, 1,
          jsonb_build_object(
            'game', v_row.game,
            'currency', v_row.currency,
            'measured_rtp', v_row.measured_rtp,
            'theoretical_rtp', v_theoretical,
            'bet_count', v_row.bet_count
          )
        );
      END IF;

      UPDATE app_config
         SET value = 'false', updated_at = NOW()
       WHERE key = 'feature_game_' || v_row.game::TEXT || '_enabled';

      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
      VALUES (
        auth.uid(),
        'casino_rtp_drift_kill_switch',
        'app_config',
        NULL,
        jsonb_build_object('game', v_row.game, 'currency', v_row.currency, 'measured_rtp', v_row.measured_rtp)
      );

      v_tripped := v_tripped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('alerts_opened', v_alerts, 'kill_switches_tripped', v_tripped);
END;
$$;

REVOKE ALL ON FUNCTION rpc_check_casino_rtp_drift() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_check_casino_rtp_drift() TO authenticated, service_role;

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE crypto_chain AS ENUM ('TRC20', 'ERC20');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crypto_asset AS ENUM ('USDT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── System account (USDT deposit conservation) ──────────────────────────────
INSERT INTO system_accounts (code, currency, description) VALUES
  ('deposit_conversion_usdt', 'USDT',
   'Counterparty for on-chain USDT deposit credits. Negative balance = USDT issued against external deposits.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app_config (key, value, description) VALUES
  ('crypto_deposit_confirmations_required', '1', 'Required on-chain confirmations before USDT credit.'),
  ('crypto_deposit_request_ttl_hours', '24', 'Hours until a pending crypto deposit request expires.')
ON CONFLICT (key) DO NOTHING;

-- ─── crypto_deposit_addresses ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crypto_deposit_addresses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  asset      crypto_asset NOT NULL DEFAULT 'USDT',
  chain      crypto_chain NOT NULL,
  address    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, asset, chain),
  UNIQUE (address)
);

CREATE INDEX IF NOT EXISTS cda_user_idx ON crypto_deposit_addresses (user_id);

ALTER TABLE crypto_deposit_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crypto_deposit_addresses: own read" ON crypto_deposit_addresses;
CREATE POLICY "crypto_deposit_addresses: own read" ON crypto_deposit_addresses
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "crypto_deposit_addresses: admin rw" ON crypto_deposit_addresses;
CREATE POLICY "crypto_deposit_addresses: admin rw" ON crypto_deposit_addresses
  FOR ALL USING (_is_admin());

-- ─── crypto_deposit_requests ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crypto_deposit_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  wallet_id                UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  address_id               UUID NOT NULL REFERENCES crypto_deposit_addresses(id) ON DELETE RESTRICT,
  asset                    crypto_asset NOT NULL DEFAULT 'USDT',
  chain                    crypto_chain NOT NULL,
  amount                   TEXT NOT NULL
    CONSTRAINT cdr_amt_fmt CHECK (amount ~ '^\d+(\.\d+)?$'),
  status                   deposit_status NOT NULL DEFAULT 'pending',
  confirmations_required   INT NOT NULL DEFAULT 1 CHECK (confirmations_required >= 1),
  confirmations_seen       INT NOT NULL DEFAULT 0 CHECK (confirmations_seen >= 0),
  tx_hash                  TEXT,
  matched_at               TIMESTAMPTZ,
  credited_at              TIMESTAMPTZ,
  expires_at               TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cdr_user_status_idx ON crypto_deposit_requests (user_id, status);
CREATE INDEX IF NOT EXISTS cdr_address_pending_idx
  ON crypto_deposit_requests (address_id, status) WHERE status = 'pending';

ALTER TABLE crypto_deposit_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crypto_deposit_requests: own read" ON crypto_deposit_requests;
CREATE POLICY "crypto_deposit_requests: own read" ON crypto_deposit_requests
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "crypto_deposit_requests: admin rw" ON crypto_deposit_requests;
CREATE POLICY "crypto_deposit_requests: admin rw" ON crypto_deposit_requests
  FOR ALL USING (_is_admin());

DROP TRIGGER IF EXISTS crypto_deposit_requests_updated_at ON crypto_deposit_requests;
CREATE TRIGGER crypto_deposit_requests_updated_at
  BEFORE UPDATE ON crypto_deposit_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── on_chain_incoming_transfers (tx_hash UNIQUE = layer-1 idempotency) ────────
CREATE TABLE IF NOT EXISTS on_chain_incoming_transfers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash               TEXT NOT NULL UNIQUE,
  chain                 crypto_chain NOT NULL,
  asset                 crypto_asset NOT NULL DEFAULT 'USDT',
  to_address            TEXT NOT NULL,
  amount                TEXT NOT NULL
    CONSTRAINT ocit_amt_fmt CHECK (amount ~ '^\d+(\.\d+)?$'),
  confirmations_seen    INT NOT NULL DEFAULT 0 CHECK (confirmations_seen >= 0),
  received_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_deposit_id    UUID REFERENCES crypto_deposit_requests(id),
  reconciliation_job_id UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ocit_to_address_idx ON on_chain_incoming_transfers (to_address);
CREATE INDEX IF NOT EXISTS ocit_matched_deposit_idx ON on_chain_incoming_transfers (matched_deposit_id);

ALTER TABLE on_chain_incoming_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "on_chain_incoming_transfers: admin rw" ON on_chain_incoming_transfers;
CREATE POLICY "on_chain_incoming_transfers: admin rw" ON on_chain_incoming_transfers
  FOR ALL USING (_is_admin());

-- ─── Address helper ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _generate_crypto_address(p_chain crypto_chain)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN CASE p_chain
    WHEN 'TRC20' THEN 'T' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 33))
    WHEN 'ERC20' THEN '0x' || lower(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 40))
  END;
END;
$$;

REVOKE ALL ON FUNCTION _generate_crypto_address(crypto_chain) FROM PUBLIC, anon, authenticated;

-- ─── Internal: credit crypto deposit → USDT (idempotent on tx_hash) ─────────
CREATE OR REPLACE FUNCTION _credit_crypto_deposit_internal(
  p_deposit_id UUID,
  p_tx_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep       crypto_deposit_requests%ROWTYPE;
  v_ledger_id UUID;
  v_idem      TEXT;
BEGIN
  SELECT * INTO v_dep FROM crypto_deposit_requests WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;

  IF v_dep.status = 'credited' THEN
    SELECT id INTO v_ledger_id FROM wallet_ledger
     WHERE related_entity_id = p_deposit_id AND reason_code = 'crypto_deposit_credit'
     LIMIT 1;
    RETURN v_ledger_id;
  END IF;

  PERFORM _assert_account_activity_live(v_dep.user_id);

  v_idem := 'crypto_dep:' || p_tx_hash;

  SELECT id INTO v_ledger_id FROM wallet_ledger WHERE idempotency_key = v_idem;
  IF FOUND THEN
    UPDATE crypto_deposit_requests
       SET status = 'credited',
           credited_at = COALESCE(credited_at, NOW()),
           matched_at = COALESCE(matched_at, NOW()),
           tx_hash = COALESCE(tx_hash, p_tx_hash)
     WHERE id = p_deposit_id;
    RETURN v_ledger_id;
  END IF;

  v_ledger_id := _credit_wallet_internal(
    v_dep.user_id, 'USDT', v_dep.amount, 'crypto_deposit_credit', v_idem
  );

  PERFORM _debit_system_account(
    'deposit_conversion_usdt', v_dep.amount, 'crypto_deposit_credit',
    v_dep.user_id, p_tx_hash, v_ledger_id
  );

  UPDATE crypto_deposit_requests
     SET status = 'credited',
         credited_at = NOW(),
         matched_at = COALESCE(matched_at, NOW()),
         tx_hash = p_tx_hash
   WHERE id = p_deposit_id;

  RETURN v_ledger_id;
END;
$$;

REVOKE ALL ON FUNCTION _credit_crypto_deposit_internal(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Match on-chain transfer ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _try_match_crypto_deposit(
  p_tx_hash TEXT,
  p_chain crypto_chain,
  p_to_address TEXT,
  p_amount TEXT,
  p_confirmations_seen INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_addr_id   UUID;
  v_user_id   UUID;
  v_dep_id    UUID;
  v_dep       crypto_deposit_requests%ROWTYPE;
  v_ocit_id   UUID;
  v_job_id    UUID;
  v_ledger    UUID;
  v_req_conf  INT;
BEGIN
  SELECT COALESCE(value::INT, 1) INTO v_req_conf
    FROM app_config WHERE key = 'crypto_deposit_confirmations_required';

  IF COALESCE(p_confirmations_seen, 0) < v_req_conf THEN
    RAISE EXCEPTION 'insufficient_confirmations';
  END IF;

  INSERT INTO on_chain_incoming_transfers (
    tx_hash, chain, to_address, amount, confirmations_seen
  ) VALUES (
    p_tx_hash, p_chain, p_to_address, p_amount, p_confirmations_seen
  ) RETURNING id INTO v_ocit_id;

  SELECT id, user_id INTO v_addr_id, v_user_id
    FROM crypto_deposit_addresses
   WHERE address = p_to_address AND chain = p_chain;

  IF v_addr_id IS NULL THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'on_chain_incoming_transfers', v_ocit_id, NULL,
      'address_not_found',
      jsonb_build_object('tx_hash', p_tx_hash, 'to_address', p_to_address, 'chain', p_chain)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'address_not_found', 'exception', TRUE);
  END IF;

  SELECT id INTO v_dep_id
    FROM crypto_deposit_requests
   WHERE address_id = v_addr_id
     AND status = 'pending'
     AND expires_at > NOW()
   ORDER BY created_at ASC
   LIMIT 1
   FOR UPDATE;

  IF v_dep_id IS NULL THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'on_chain_incoming_transfers', v_ocit_id, v_user_id,
      'pending_request_not_found',
      jsonb_build_object('tx_hash', p_tx_hash, 'to_address', p_to_address)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'pending_request_not_found', 'exception', TRUE);
  END IF;

  SELECT * INTO v_dep FROM crypto_deposit_requests WHERE id = v_dep_id;

  IF v_dep.amount IS DISTINCT FROM p_amount THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'crypto_deposit_requests', v_dep_id, v_dep.user_id,
      'amount_mismatch',
      jsonb_build_object('expected', v_dep.amount, 'received', p_amount, 'tx_hash', p_tx_hash)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'amount_mismatch', 'exception', TRUE);
  END IF;

  IF EXISTS (
    SELECT 1 FROM risk_flags
     WHERE user_id = v_dep.user_id AND status = 'active'
       AND flag_type IN ('sanctions_hit', 'sanctions_pending')
  ) OR EXISTS (SELECT 1 FROM profiles WHERE id = v_dep.user_id AND activity_frozen) THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'crypto_deposit_requests', v_dep_id, v_dep.user_id,
      'sanctions_or_freeze',
      jsonb_build_object('tx_hash', p_tx_hash)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'sanctions_or_freeze', 'exception', TRUE);
  END IF;

  UPDATE on_chain_incoming_transfers SET matched_deposit_id = v_dep_id WHERE id = v_ocit_id;
  UPDATE crypto_deposit_requests
     SET status = 'matched', matched_at = NOW(), confirmations_seen = p_confirmations_seen
   WHERE id = v_dep_id;

  v_ledger := _credit_crypto_deposit_internal(v_dep_id, p_tx_hash);

  INSERT INTO deposit_reconciliation_jobs (source, matched_count, exception_count, payload)
  VALUES ('on_chain', 1, 0,
    jsonb_build_object('tx_hash', p_tx_hash, 'deposit_id', v_dep_id))
  RETURNING id INTO v_job_id;

  UPDATE on_chain_incoming_transfers SET reconciliation_job_id = v_job_id WHERE id = v_ocit_id;

  RETURN jsonb_build_object(
    'ok', TRUE, 'deposit_id', v_dep_id, 'ledger_id', v_ledger, 'auto_matched', TRUE
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'duplicate_tx_hash' USING HINT = p_tx_hash;
END;
$$;

REVOKE ALL ON FUNCTION _try_match_crypto_deposit(TEXT, crypto_chain, TEXT, TEXT, INT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_process_on_chain_transfer(
  p_tx_hash TEXT,
  p_chain TEXT,
  p_to_address TEXT,
  p_amount TEXT,
  p_confirmations_seen INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_chain crypto_chain;
BEGIN
  PERFORM _assert_feature_enabled('deposit');
  BEGIN
    v_chain := p_chain::crypto_chain;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_chain';
  END;
  RETURN _try_match_crypto_deposit(p_tx_hash, v_chain, p_to_address, p_amount, p_confirmations_seen);
END;
$$;

REVOKE ALL ON FUNCTION rpc_process_on_chain_transfer(TEXT, TEXT, TEXT, TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_process_on_chain_transfer(TEXT, TEXT, TEXT, TEXT, INT) TO service_role;

CREATE OR REPLACE FUNCTION rpc_admin_match_crypto_deposit(
  p_tx_hash TEXT,
  p_chain TEXT,
  p_to_address TEXT,
  p_amount TEXT,
  p_confirmations_seen INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_chain crypto_chain;
BEGIN
  IF NOT _is_admin() AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF auth.uid() IS NULL AND current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  PERFORM _assert_feature_enabled('deposit');
  BEGIN
    v_chain := p_chain::crypto_chain;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_chain';
  END;
  RETURN _try_match_crypto_deposit(p_tx_hash, v_chain, p_to_address, p_amount, p_confirmations_seen);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_match_crypto_deposit(TEXT, TEXT, TEXT, TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_admin_match_crypto_deposit(TEXT, TEXT, TEXT, TEXT, INT)
  TO authenticated, service_role;

-- ─── User: deposit address + pending request ───────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_get_crypto_deposit_address(
  p_asset TEXT DEFAULT 'USDT',
  p_chain TEXT DEFAULT 'TRC20'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_asset   crypto_asset;
  v_chain   crypto_chain;
  v_row     crypto_deposit_addresses%ROWTYPE;
  v_addr    TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('deposit');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);

  BEGIN
    v_asset := p_asset::crypto_asset;
    v_chain := p_chain::crypto_chain;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_asset_or_chain';
  END;

  SELECT * INTO v_row
    FROM crypto_deposit_addresses
   WHERE user_id = v_user_id AND asset = v_asset AND chain = v_chain;

  IF NOT FOUND THEN
    v_addr := _generate_crypto_address(v_chain);
    INSERT INTO crypto_deposit_addresses (user_id, asset, chain, address)
    VALUES (v_user_id, v_asset, v_chain, v_addr)
    RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'address', v_row.address,
    'asset', v_row.asset,
    'chain', v_row.chain,
    'address_id', v_row.id
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_crypto_deposit_address(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_crypto_deposit_address(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_create_crypto_deposit_request(
  p_amount TEXT,
  p_asset TEXT DEFAULT 'USDT',
  p_chain TEXT DEFAULT 'TRC20',
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_asset   crypto_asset;
  v_chain   crypto_chain;
  v_wallet  wallets%ROWTYPE;
  v_addr    crypto_deposit_addresses%ROWTYPE;
  v_dep_id  UUID;
  v_ttl_h   INT;
  v_conf    INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('deposit');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);

  IF p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_create_crypto_deposit_request')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  BEGIN
    v_asset := p_asset::crypto_asset;
    v_chain := p_chain::crypto_chain;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_asset_or_chain';
  END;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  SELECT * INTO v_addr
    FROM crypto_deposit_addresses
   WHERE user_id = v_user_id AND asset = v_asset AND chain = v_chain;

  IF NOT FOUND THEN
    INSERT INTO crypto_deposit_addresses (user_id, asset, chain, address)
    VALUES (v_user_id, v_asset, v_chain, _generate_crypto_address(v_chain))
    RETURNING * INTO v_addr;
  END IF;

  SELECT COALESCE(value::INT, 24) INTO v_ttl_h FROM app_config WHERE key = 'crypto_deposit_request_ttl_hours';
  SELECT COALESCE(value::INT, 1) INTO v_conf FROM app_config WHERE key = 'crypto_deposit_confirmations_required';

  INSERT INTO crypto_deposit_requests (
    user_id, wallet_id, address_id, asset, chain, amount,
    confirmations_required, expires_at
  ) VALUES (
    v_user_id, v_wallet.id, v_addr.id, v_asset, v_chain, p_amount,
    v_conf, NOW() + (v_ttl_h || ' hours')::INTERVAL
  ) RETURNING id INTO v_dep_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'deposit_id', v_dep_id,
    'address', v_addr.address,
    'asset', v_asset,
    'chain', v_chain,
    'amount', p_amount,
    'confirmations_required', v_conf,
    'sla_hours', v_ttl_h
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_crypto_deposit_request(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_crypto_deposit_request(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ─── First deposit mission on crypto credit ────────────────────────────────────
CREATE OR REPLACE FUNCTION _crypto_deposit_first_deposit_mission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IN ('matched', 'credited') AND NEW.credited_at IS NOT NULL THEN
    PERFORM _grant_mission(NEW.user_id, 'first_deposit');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION _crypto_deposit_first_deposit_mission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS crypto_deposits_first_deposit_mission ON crypto_deposit_requests;
CREATE TRIGGER crypto_deposits_first_deposit_mission
  AFTER INSERT OR UPDATE OF status, credited_at ON crypto_deposit_requests
  FOR EACH ROW EXECUTE FUNCTION _crypto_deposit_first_deposit_mission();

-- ─── USDT withdrawal destination validation (chain + address in JSONB) ─────────
CREATE OR REPLACE FUNCTION rpc_request_withdrawal(
  p_currency TEXT,
  p_amount TEXT,
  p_destination JSONB,
  p_idempotency_key TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_ccy     currency;
  v_wallet  wallets%ROWTYPE;
  v_wr_id   UUID;
  v_lock_id UUID;
  v_cap     TEXT;
  v_today   NUMERIC;
  v_amount  NUMERIC;
  v_chain   TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('withdrawal');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;

  PERFORM _assert_amount_text(p_amount);

  IF v_ccy = 'USDT' THEN
    v_chain := COALESCE(p_destination->>'chain', '');
    IF v_chain NOT IN ('TRC20', 'ERC20') THEN
      RAISE EXCEPTION 'invalid_chain';
    END IF;
    IF COALESCE(length(btrim(p_destination->>'address')), 0) < 10 THEN
      RAISE EXCEPTION 'invalid_destination';
    END IF;
  END IF;

  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  PERFORM _assert_kyc_withdrawal_gate(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);
  PERFORM _assert_solvency_withdrawal_gate(v_ccy);

  SELECT value INTO v_cap
    FROM app_config
   WHERE key = 'withdrawal_daily_cap_per_user';

  IF v_cap IS NOT NULL AND length(btrim(v_cap)) > 0 THEN
    PERFORM _assert_amount_text(v_cap);
    v_amount := p_amount::NUMERIC;
    SELECT COALESCE(SUM(amount::NUMERIC), 0) INTO v_today
      FROM withdrawal_requests
     WHERE user_id = v_user_id
       AND currency = v_ccy
       AND status NOT IN ('rejected', 'cancelled')
       AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC');
    IF v_today + v_amount > v_cap::NUMERIC THEN
      RAISE EXCEPTION 'ERR_WITHDRAWAL_DAILY_CAP';
    END IF;
  END IF;

  SELECT id INTO v_wr_id FROM withdrawal_requests
   WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', TRUE, 'withdrawal_id', v_wr_id, 'idempotent', TRUE);
  END IF;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_request_withdrawal')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  v_wr_id := gen_random_uuid();
  v_lock_id := rpc_lock_wallet(
    v_ccy, p_amount, 'withdrawal_request_lock',
    'wd_lock:' || v_user_id::TEXT || ':' || p_idempotency_key,
    v_wr_id
  );

  INSERT INTO withdrawal_requests (
    id, user_id, wallet_id, currency, amount, destination, status,
    idempotency_key, client_request_id, ledger_lock_id
  ) VALUES (
    v_wr_id, v_user_id, v_wallet.id, v_ccy, p_amount, COALESCE(p_destination, '{}'::JSONB),
    'pending', p_idempotency_key, p_client_request_id, v_lock_id
  );

  RETURN jsonb_build_object('ok', TRUE, 'withdrawal_id', v_wr_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- ─── Table GRANTs (pair with RLS) ──────────────────────────────────────────────
REVOKE ALL ON TABLE crypto_deposit_addresses FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE crypto_deposit_addresses TO authenticated;

REVOKE ALL ON TABLE crypto_deposit_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE crypto_deposit_requests TO authenticated;

REVOKE ALL ON TABLE on_chain_incoming_transfers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE on_chain_incoming_transfers TO authenticated;
