-- ============================================================
-- ZA-14 root fix — PHON-margin futures oracle notional
-- ============================================================
-- Asserts:
--   1) PHON margin notional = margin_phon × PHON_USDT × leverage
--   2) USDT margin path unchanged (parity with pre-fix formula)
--   3) All 13 live guards still present in rpc_open_futures_position
--   4) RG self-exclusion still blocks PHON-margin open
--   5) Open fee stays in margin-currency units; settle converts USD→PHON
-- ============================================================

-- ── 1. Guard inventory on live definition ────────────────────────────────────
BEGIN;
DO $$
DECLARE
  v_def TEXT := pg_get_functiondef(
    'public.rpc_open_futures_position(text,text,text,text,text,text,text,text)'::regprocedure
  );
  v_required TEXT[] := ARRAY[
    '_assert_price_fresh(',
    '_enforce_rate_limit(',
    '_assert_onboarding_consent(',
    '_assert_system_live(',
    '_assert_feature_enabled(''futures'')',
    '_assert_position_limits(',
    'p_client_request_id',
    'below_min_notional',
    '_check_house_exposure_alert(',
    '_assert_rg_domain_entry_allowed(',
    '_assert_cross_margin_enabled(',
    '_assert_futures_open_allowed(',
    'futures_phon_margin'
  ];
  v_g TEXT;
BEGIN
  ASSERT position('za14_phon_oracle_notional' IN v_def) > 0,
    'open RPC must carry za14_phon_oracle_notional marker';
  ASSERT position('_assert_price_fresh(''PHON_USDT'')' IN v_def) > 0,
    'open RPC must call _assert_price_fresh(PHON_USDT) for PHON margin';

  FOREACH v_g IN ARRAY v_required LOOP
    ASSERT position(v_g IN v_def) > 0,
      format('guard missing after za14 oracle patch: %s', v_g);
  END LOOP;

  ASSERT position(
    'za14_phon_settle_fx' IN
      pg_get_functiondef('public._settle_futures_position(uuid,numeric,position_status,text)'::regprocedure)
  ) > 0,
    'settle must carry za14_phon_settle_fx marker';

  RAISE NOTICE 'ZA14 GUARDS OK — 13 open guards + settle FX marker present';
END;
$$;
ROLLBACK;

-- ── 2. PHON notional conversion + USDT unchanged + settle FX ─────────────────
BEGIN;
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_open JSONB;
  v_close JSONB;
  v_pos futures_positions%ROWTYPE;
  v_phon_rate NUMERIC := 0.010000;
  v_entry NUMERIC := 0.012345;
  v_exit NUMERIC := 0.012900;
  v_margin NUMERIC := 1000.000000;
  v_lev NUMERIC := 5;
  v_expected_notional NUMERIC;
  v_expected_qty NUMERIC;
  v_expected_open_fee NUMERIC;
  v_expected_pnl_phon NUMERIC;
  v_fee_rate NUMERIC;
  v_usdt_open JSONB;
  v_phon_sum_before NUMERIC;
  v_phon_sum_after NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'za14_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET phon_available = '100000.000000',
         usdt_available = '100000.000000'
   WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config
     SET value = 'true'
   WHERE key IN (
     'feature_futures_enabled',
     'feature_futures_phon_margin_enabled',
     'consent_gate_enabled'
   );
  UPDATE rpc_rate_limit_configs
     SET capacity = 100, refill_rate = 100
   WHERE rpc_name IN ('rpc_open_futures_position', 'rpc_close_futures_position');

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'test', TRUE
    FROM unnest(ARRAY[
      'terms_of_service','privacy_policy','risk_disclosure','age_verification'
    ]) AS doc_type
  ON CONFLICT DO NOTHING;

  UPDATE futures_markets
     SET is_active = TRUE,
         max_leverage = 100,
         max_user_positions = 100,
         max_open_interest = '1000000000.000000',
         min_notional = '1.000000'
   WHERE symbol = 'PHONUSDT-PERP';
  UPDATE market_circuit_breakers
     SET is_halted = FALSE, staleness_seconds = 86400
   WHERE symbol IN ('PHONUSDT-PERP', 'PHON_USDT');

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES
    ('PHON_USDT', _fmt6(v_phon_rate), NOW()),
    ('PHONUSDT-PERP', _fmt6(v_entry), NOW())
  ON CONFLICT (symbol) DO UPDATE
    SET price = EXCLUDED.price, updated_at = NOW();

  SELECT open_fee_rate::NUMERIC INTO v_fee_rate
    FROM futures_markets WHERE symbol = 'PHONUSDT-PERP';

  v_expected_notional := v_margin * v_phon_rate * v_lev;           -- USD
  v_expected_qty := v_expected_notional / v_entry;
  v_expected_open_fee := (v_margin * v_lev) * v_fee_rate;          -- PHON

  SELECT
      (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
    INTO v_phon_sum_before;

  v_open := rpc_open_futures_position(
    'PHONUSDT-PERP', 'long', 'PHON',
    _fmt6(v_margin), v_lev::TEXT, NULL, NULL,
    'za14-phon-' || v_uid::TEXT
  );

  ASSERT v_open->>'notional' = _fmt6(v_expected_notional),
    format('PHON notional mismatch: got=%s expected=%s',
      v_open->>'notional', _fmt6(v_expected_notional));
  ASSERT v_open->>'quantity' = _fmt6(v_expected_qty),
    format('PHON quantity mismatch: got=%s expected=%s',
      v_open->>'quantity', _fmt6(v_expected_qty));
  ASSERT v_open->>'open_fee' = _fmt6(v_expected_open_fee),
    format('PHON open_fee mismatch: got=%s expected=%s',
      v_open->>'open_fee', _fmt6(v_expected_open_fee));

  SELECT * INTO v_pos FROM futures_positions WHERE id = (v_open->>'position_id')::UUID;
  ASSERT v_pos.margin_currency = 'PHON', 'stored margin_currency must be PHON';
  ASSERT v_pos.notional = _fmt6(v_expected_notional), 'stored notional mismatch';
  ASSERT v_pos.open_fee = _fmt6(v_expected_open_fee), 'stored open_fee mismatch';

  -- USDT path must still be margin × leverage (no PHON_USDT multiply).
  v_usdt_open := rpc_open_futures_position(
    'PHONUSDT-PERP', 'long', 'USDT',
    '100.000000', '10', NULL, NULL,
    'za14-usdt-' || v_uid::TEXT
  );
  ASSERT v_usdt_open->>'notional' = '1000.000000',
    format('USDT notional must stay margin×lev, got %s', v_usdt_open->>'notional');

  -- Settle: PnL in mark/USD → PHON via oracle.
  UPDATE oracle_prices
     SET price = _fmt6(v_exit), updated_at = NOW()
   WHERE symbol = 'PHONUSDT-PERP';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHON_USDT', _fmt6(v_phon_rate), NOW())
  ON CONFLICT (symbol) DO UPDATE
    SET price = EXCLUDED.price, updated_at = NOW();

  -- Settle reads stored 6dp quantity (not full-precision open math).
  v_expected_pnl_phon :=
    ((v_open->>'quantity')::NUMERIC * (v_exit - v_entry)) / v_phon_rate;

  v_close := rpc_close_futures_position((v_open->>'position_id')::UUID);
  ASSERT v_close->>'realized_pnl' = _fmt6(v_expected_pnl_phon),
    format('PHON settle PnL mismatch: got=%s expected=%s',
      v_close->>'realized_pnl', _fmt6(v_expected_pnl_phon));

  SELECT
      (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
    INTO v_phon_sum_after;

  ASSERT v_phon_sum_after = v_phon_sum_before,
    format('PHON conservation broken: before=%s after=%s',
      _fmt6(v_phon_sum_before), _fmt6(v_phon_sum_after));

  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'wallet ledger hash chain broken after PHON open/close';

  RAISE NOTICE 'ZA14 NOTIONAL OK — PHON oracle conversion + USDT unchanged + settle FX + Σ=0';
END;
$$;
ROLLBACK;

-- ── 3. RG self-exclusion still blocks PHON-margin open ───────────────────────
BEGIN;
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'za14_rg_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '100000.000000' WHERE user_id = v_uid;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config
     SET value = 'true'
   WHERE key IN (
     'feature_futures_enabled',
     'feature_futures_phon_margin_enabled',
     'consent_gate_enabled'
   );

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'test', TRUE
    FROM unnest(ARRAY[
      'terms_of_service','privacy_policy','risk_disclosure','age_verification'
    ]) AS doc_type
  ON CONFLICT DO NOTHING;

  UPDATE futures_markets
     SET is_active = TRUE, max_open_interest = '1000000000.000000'
   WHERE symbol = 'PHONUSDT-PERP';
  UPDATE market_circuit_breakers SET is_halted = FALSE
   WHERE symbol IN ('PHONUSDT-PERP', 'PHON_USDT');
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES
    ('PHON_USDT', '0.010000', NOW()),
    ('PHONUSDT-PERP', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE
    SET price = EXCLUDED.price, updated_at = NOW();

  PERFORM rpc_set_self_exclusion(NOW() + INTERVAL '7 days', 'cooldown');

  BEGIN
    PERFORM rpc_open_futures_position(
      'PHONUSDT-PERP', 'long', 'PHON',
      '100.000000', '2', NULL, NULL,
      'za14-rg-' || v_uid::TEXT
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'rg_self_excluded' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked,
    format('RG self-exclusion must still block PHON-margin open, got %s',
      COALESCE(v_msg, '<none>'));

  RAISE NOTICE 'ZA14 RG OK — self-exclusion blocks PHON-margin open';
END;
$$;
ROLLBACK;
