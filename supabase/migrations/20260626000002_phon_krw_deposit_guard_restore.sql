-- Phase 1 follow-up — restore deposit RG/sanctions guards + earn-hub anon lockdown
-- (000001 replaced rpc_create_krw_deposit_request without inherited guards)

SET search_path = public, pg_temp;

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
  PERFORM _assert_sanctions_screening(v_user_id);

  IF p_amount_krw !~ '^\d+(\.\d+)?$' OR p_amount_krw::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  PERFORM _assert_rg_deposit_allowed(v_user_id, 'KRW', p_amount_krw::NUMERIC);

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

REVOKE ALL ON FUNCTION rpc_golden_earth_tap(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_golden_earth_tap(TEXT) TO authenticated;
