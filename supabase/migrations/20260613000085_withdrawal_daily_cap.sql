-- ============================================================
-- Migration: 20260613000085_withdrawal_daily_cap
-- Per-user daily withdrawal cap (entry check only).
-- Does NOT enable withdrawals; feature_withdrawal_enabled unchanged.
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO app_config (key, value, description, is_public)
VALUES (
  'withdrawal_daily_cap_per_user',
  '1000.000000',
  'Maximum PHON withdrawal amount per user per UTC day (sum of active requests).',
  FALSE
)
ON CONFLICT (key) DO NOTHING;

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
