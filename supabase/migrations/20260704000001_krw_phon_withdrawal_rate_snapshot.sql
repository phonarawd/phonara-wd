-- PHON → KRW bank-transfer withdrawal: rate snapshot + expected_krw on request.
SET search_path = public, pg_temp;

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS expected_krw TEXT,
  ADD COLUMN IF NOT EXISTS rate_snapshot_id UUID REFERENCES exchange_rate_snapshots(id);

CREATE INDEX IF NOT EXISTS wr_phon_krw_rate_idx
  ON withdrawal_requests (rate_snapshot_id)
  WHERE currency = 'PHON' AND expected_krw IS NOT NULL;

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
  v_user_id       UUID := auth.uid();
  v_ccy           currency;
  v_wallet        wallets%ROWTYPE;
  v_wr_id         UUID;
  v_lock_id       UUID;
  v_cap           TEXT;
  v_today         NUMERIC;
  v_amount        NUMERIC;
  v_chain         TEXT;
  v_account       TEXT;
  v_dest          JSONB;
  v_rate_id       UUID;
  v_rate          NUMERIC;
  v_captured      TIMESTAMPTZ;
  v_expected_krw  TEXT;
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
    v_dest := COALESCE(p_destination, '{}'::JSONB);
  ELSIF v_ccy = 'PHON' THEN
    v_account := btrim(COALESCE(p_destination->>'account', p_destination->>'address', ''));
    IF length(v_account) < 6 THEN
      RAISE EXCEPTION 'invalid_destination';
    END IF;
    v_dest := COALESCE(p_destination, '{}'::JSONB)
      || jsonb_build_object(
           'type', 'bank',
           'chain', 'BANK',
           'account', v_account,
           'address', v_account,
           'currency', 'PHON'
         );

    SELECT id, rate::NUMERIC, captured_at
      INTO v_rate_id, v_rate, v_captured
      FROM exchange_rate_snapshots
     WHERE base_currency = 'PHON'
       AND quote_currency = 'KRW'
       AND is_active = TRUE
       AND rate::NUMERIC > 0
     ORDER BY captured_at DESC
     LIMIT 1;

    IF v_rate_id IS NULL OR v_rate IS NULL OR v_rate <= 0 THEN
      RAISE EXCEPTION 'phon_krw_rate_unavailable';
    END IF;

    IF v_captured < NOW() - INTERVAL '15 minutes' THEN
      RAISE EXCEPTION 'phon_krw_rate_stale';
    END IF;

    v_expected_krw := _fmt6(p_amount::NUMERIC * v_rate);
  ELSE
    RAISE EXCEPTION 'invalid_currency';
  END IF;

  PERFORM _assert_withdrawal_whitelist(v_user_id, v_dest, v_ccy);

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
    idempotency_key, client_request_id, ledger_lock_id,
    expected_krw, rate_snapshot_id
  ) VALUES (
    v_wr_id, v_user_id, v_wallet.id, v_ccy, p_amount, v_dest,
    'pending', p_idempotency_key, p_client_request_id, v_lock_id,
    v_expected_krw, v_rate_id
  );

  PERFORM _aml_log_event(v_user_id, 'withdrawal_requested', 'info',
    jsonb_build_object(
      'withdrawal_id', v_wr_id,
      'amount', p_amount,
      'currency', v_ccy,
      'expected_krw', v_expected_krw,
      'rate_snapshot_id', v_rate_id
    ));

  RETURN jsonb_build_object(
    'ok', TRUE,
    'withdrawal_id', v_wr_id,
    'expected_krw', v_expected_krw,
    'rate_snapshot_id', v_rate_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

INSERT INTO exchange_rate_snapshots (base_currency, quote_currency, rate, source, is_active, captured_at)
SELECT 'PHON', 'KRW', '10.000000', 'krw_withdraw_bootstrap', TRUE, NOW()
WHERE NOT EXISTS (
  SELECT 1
    FROM exchange_rate_snapshots
   WHERE base_currency = 'PHON'
     AND quote_currency = 'KRW'
     AND is_active = TRUE
);
