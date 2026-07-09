-- WorldNo1 Phase 3/H — withdrawal whitelist · admin staking · custody reconciliation · sports ops
SET search_path = public, pg_temp;

-- ─── Withdrawal address whitelist (H2) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawal_address_whitelist (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chain        TEXT NOT NULL CHECK (chain IN ('TRC20', 'ERC20', 'BANK')),
  address      TEXT NOT NULL,
  label        TEXT,
  cooldown_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, chain, address)
);

CREATE INDEX IF NOT EXISTS withdrawal_whitelist_user_idx
  ON withdrawal_address_whitelist (user_id, chain);

ALTER TABLE withdrawal_address_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "withdrawal_whitelist: read"
  ON withdrawal_address_whitelist FOR SELECT
  USING (auth.uid() = user_id OR _is_admin());

REVOKE ALL ON withdrawal_address_whitelist FROM PUBLIC, anon, authenticated;
GRANT SELECT ON withdrawal_address_whitelist TO authenticated;
GRANT ALL ON withdrawal_address_whitelist TO service_role;

CREATE OR REPLACE FUNCTION _assert_withdrawal_whitelist(
  p_user_id UUID,
  p_destination JSONB,
  p_currency currency
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_enabled TEXT;
  v_chain   TEXT;
  v_address TEXT;
  v_row     withdrawal_address_whitelist%ROWTYPE;
BEGIN
  SELECT value INTO v_enabled FROM app_config WHERE key = 'withdrawal_whitelist_enabled';
  IF COALESCE(v_enabled, 'false') <> 'true' THEN
    RETURN;
  END IF;

  IF p_currency = 'USDT' THEN
    v_chain := COALESCE(p_destination->>'chain', '');
    v_address := lower(btrim(COALESCE(p_destination->>'address', '')));
  ELSE
    v_chain := 'BANK';
    v_address := lower(btrim(COALESCE(p_destination->>'account', p_destination->>'address', '')));
  END IF;

  IF length(v_address) < 4 THEN
    RAISE EXCEPTION 'withdrawal_address_not_whitelisted';
  END IF;

  SELECT * INTO v_row
    FROM withdrawal_address_whitelist
   WHERE user_id = p_user_id
     AND chain = v_chain
     AND lower(address) = v_address
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'withdrawal_address_not_whitelisted';
  END IF;

  IF v_row.cooldown_until IS NOT NULL AND v_row.cooldown_until > NOW() THEN
    RAISE EXCEPTION 'withdrawal_address_cooldown';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_withdrawal_whitelist(UUID, JSONB, currency) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_list_withdrawal_addresses()
RETURNS SETOF withdrawal_address_whitelist
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT *
    FROM withdrawal_address_whitelist
   WHERE user_id = auth.uid()
   ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION rpc_list_withdrawal_addresses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_list_withdrawal_addresses() TO authenticated;

CREATE OR REPLACE FUNCTION rpc_add_withdrawal_address(
  p_chain TEXT,
  p_address TEXT,
  p_label TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_chain   TEXT := upper(btrim(p_chain));
  v_address TEXT := btrim(p_address);
  v_id      UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_chain NOT IN ('TRC20', 'ERC20', 'BANK') THEN RAISE EXCEPTION 'invalid_chain'; END IF;
  IF length(v_address) < 6 THEN RAISE EXCEPTION 'invalid_address'; END IF;

  INSERT INTO withdrawal_address_whitelist (user_id, chain, address, label, cooldown_until)
  VALUES (v_user_id, v_chain, v_address, NULLIF(btrim(p_label), ''), NOW() + INTERVAL '24 hours')
  ON CONFLICT (user_id, chain, address) DO UPDATE
    SET label = COALESCE(EXCLUDED.label, withdrawal_address_whitelist.label),
        updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', TRUE, 'id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_add_withdrawal_address(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_add_withdrawal_address(TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_remove_withdrawal_address(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  DELETE FROM withdrawal_address_whitelist WHERE id = p_id AND user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  RETURN jsonb_build_object('ok', TRUE);
END;
$$;

REVOKE ALL ON FUNCTION rpc_remove_withdrawal_address(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_remove_withdrawal_address(UUID) TO authenticated;

-- Patch withdrawal to enforce whitelist when enabled
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
  PERFORM _assert_withdrawal_mfa_step_up();

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

  PERFORM _assert_withdrawal_whitelist(v_user_id, p_destination, v_ccy);

  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  PERFORM _assert_kyc_withdrawal_gate(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);
  PERFORM _aml_assert_withdrawal_defense(v_user_id, p_amount, v_ccy);
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

  PERFORM _aml_log_event(v_user_id, 'withdrawal_requested', 'info',
    jsonb_build_object('withdrawal_id', v_wr_id, 'amount', p_amount, 'currency', v_ccy));

  RETURN jsonb_build_object('ok', TRUE, 'withdrawal_id', v_wr_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- ─── Admin staking desk RPCs ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_admin_list_staking_pools()
RETURNS SETOF staking_pools
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  RETURN QUERY
    SELECT *
      FROM staking_pools
     ORDER BY reference_asset, stake_currency, term;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_staking_pools() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_list_staking_pools() TO authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_set_staking_pool_active(
  p_pool_id UUID,
  p_is_active BOOLEAN,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reason TEXT := NULLIF(btrim(p_reason), '');
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF v_reason IS NULL OR length(v_reason) < 4 THEN RAISE EXCEPTION 'reason_too_short'; END IF;

  UPDATE staking_pools
     SET is_active = p_is_active
   WHERE id = p_pool_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'pool_not_found'; END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'staking_pool_active_set', 'staking_pools', p_pool_id,
          jsonb_build_object('is_active', p_is_active, 'reason', v_reason));

  RETURN jsonb_build_object('ok', TRUE, 'pool_id', p_pool_id, 'is_active', p_is_active);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_set_staking_pool_active(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_set_staking_pool_active(UUID, BOOLEAN, TEXT) TO authenticated;

-- ─── Custody reconciliation snapshot (H3) ────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_run_custody_reconciliation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pending_crypto BIGINT;
  v_pending_wd BIGINT;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COUNT(*) INTO v_pending_crypto
    FROM crypto_deposit_requests
   WHERE status IN ('pending', 'unmatched');

  SELECT COUNT(*) INTO v_pending_wd
    FROM withdrawal_requests
   WHERE status IN ('pending', 'approved', 'sent');

  INSERT INTO reconciliation_log (run_at, check_type, is_match, delta, notes)
  VALUES (
    NOW(),
    'custody_snapshot',
    TRUE,
    '0',
    jsonb_build_object(
      'pending_crypto_deposits', v_pending_crypto,
      'pending_withdrawals', v_pending_wd
    )::TEXT
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'pending_crypto_deposits', v_pending_crypto,
    'pending_withdrawals', v_pending_wd
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_custody_reconciliation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_custody_reconciliation() TO service_role;

INSERT INTO app_config (key, value, description)
VALUES
  ('withdrawal_whitelist_enabled', 'false', 'Require whitelisted withdrawal destinations'),
  ('sports_ingest_enabled', 'true', 'Sports odds ingest worker enabled flag')
ON CONFLICT (key) DO NOTHING;
