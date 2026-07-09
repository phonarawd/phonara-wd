-- Phase 1 — PHON/KRW synthetic rate refresh (PHON_USDT × USDT/KRW)
-- Append-only. Deactivates prior PHON/KRW snapshots; deposit rejects stale rates.

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _refresh_phon_krw_exchange_rate()
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_phon_usdt NUMERIC;
  v_usdt_krw  NUMERIC;
  v_phon_krw  NUMERIC;
  v_new_id    UUID;
  v_rate_txt  TEXT;
BEGIN
  SELECT price::NUMERIC INTO v_phon_usdt
    FROM oracle_prices
   WHERE symbol = 'PHON_USDT';

  IF v_phon_usdt IS NULL OR v_phon_usdt <= 0 THEN
    RAISE EXCEPTION 'phon_usdt_oracle_unavailable';
  END IF;

  SELECT rate::NUMERIC INTO v_usdt_krw
    FROM exchange_rate_snapshots
   WHERE base_currency = 'USDT'
     AND quote_currency = 'KRW'
     AND is_active = TRUE
     AND rate::NUMERIC > 0
   ORDER BY captured_at DESC
   LIMIT 1;

  IF v_usdt_krw IS NULL OR v_usdt_krw <= 0 THEN
    SELECT NULLIF(btrim(value), '')::NUMERIC INTO v_usdt_krw
      FROM app_config
     WHERE key = 'usdt_krw_reference_rate';
  END IF;

  IF v_usdt_krw IS NULL OR v_usdt_krw <= 0 THEN
    RAISE EXCEPTION 'usdt_krw_rate_unavailable';
  END IF;

  v_phon_krw := v_phon_usdt * v_usdt_krw;
  v_rate_txt := _fmt6(v_phon_krw);

  UPDATE exchange_rate_snapshots
     SET is_active = FALSE
   WHERE base_currency = 'PHON'
     AND quote_currency = 'KRW'
     AND is_active = TRUE;

  INSERT INTO exchange_rate_snapshots (
    base_currency, quote_currency, rate, source, is_active
  ) VALUES (
    'PHON', 'KRW', v_rate_txt, 'synthetic_phon_usdt_usdt_krw', TRUE
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION _refresh_phon_krw_exchange_rate() FROM PUBLIC, anon, authenticated;

-- Stale PHON/KRW rejection on deposit (15 min TTL)
CREATE OR REPLACE FUNCTION rpc_create_krw_deposit_request(
  p_amount_krw TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet  wallets%ROWTYPE;
  v_ref     TEXT;
  v_rate_id UUID;
  v_phon    TEXT;
  v_dep_id  UUID;
  v_captured TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('deposit');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);

  IF p_amount_krw !~ '^\d+(\.\d+)?$' OR p_amount_krw::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_create_krw_deposit_request')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  SELECT id INTO v_wallet FROM wallets WHERE user_id = v_user_id;

  SELECT id,
         _fmt6((p_amount_krw::NUMERIC / rate::NUMERIC)),
         captured_at
    INTO v_rate_id, v_phon, v_captured
    FROM exchange_rate_snapshots
   WHERE base_currency = 'PHON'
     AND quote_currency = 'KRW'
     AND is_active = TRUE
     AND rate::NUMERIC > 0
   ORDER BY captured_at DESC
   LIMIT 1;

  IF v_rate_id IS NULL OR v_phon IS NULL OR v_phon::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'phon_krw_rate_unavailable';
  END IF;

  IF v_captured < NOW() - INTERVAL '15 minutes' THEN
    RAISE EXCEPTION 'phon_krw_rate_stale';
  END IF;

  v_ref := upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10));

  INSERT INTO krw_deposit_requests (
    user_id, wallet_id, reference_code, amount_krw, expected_phon, rate_snapshot_id
  ) VALUES (
    v_user_id, v_wallet.id, v_ref, p_amount_krw, v_phon, v_rate_id
  ) RETURNING id INTO v_dep_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'deposit_id', v_dep_id,
    'reference_code', v_ref,
    'expected_phon', v_phon,
    'sla_hours', (SELECT value FROM app_config WHERE key = 'deposit_exception_sla_hours')
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_krw_deposit_request(TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_krw_deposit_request(TEXT, TEXT)
  TO authenticated;

INSERT INTO app_config (key, value)
VALUES ('usdt_krw_reference_rate', '1350')
ON CONFLICT (key) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('phonara_phon_krw_rate_refresh')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_phon_krw_rate_refresh');

SELECT cron.schedule(
  'phonara_phon_krw_rate_refresh',
  '*/5 * * * *',
  $$SELECT _refresh_phon_krw_exchange_rate();$$
);
