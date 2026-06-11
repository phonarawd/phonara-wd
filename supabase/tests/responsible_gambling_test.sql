-- ============================================================
-- Responsible Gambling — SQL integration tests
-- ============================================================
-- Proves loss/deposit limits, self-exclusion, open-position unrealized loss,
-- and RG-excluded affiliate commission base. Every block rolls back.
-- ============================================================

-- ── 1. User limits: operator cap, upward cooldown, downward immediate ─────────
BEGIN;
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_res JSONB;
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
  v_pending TEXT;
  v_current TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'rg_limit_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO app_config (key, value, description)
  VALUES ('rg_operator_loss_cap_trading_usdt', '100.000000', 'RG operator trading cap')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  BEGIN
    PERFORM rpc_set_rg_limit('loss', 'trading', 'USDT', '101.000000');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'rg_limit_above_operator_cap' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, format('operator cap must reject user limit above cap, got %s', COALESCE(v_msg, '<none>'));

  v_res := rpc_set_rg_limit('loss', 'trading', 'USDT', '50.000000');
  ASSERT (v_res->>'pending')::BOOLEAN = FALSE, format('initial limit should apply immediately: %s', v_res);

  v_res := rpc_set_rg_limit('loss', 'trading', 'USDT', '80.000000');
  ASSERT (v_res->>'pending')::BOOLEAN = TRUE, format('limit increase should enter cooldown: %s', v_res);

  SELECT current_limit, pending_limit INTO v_current, v_pending
    FROM rg_user_limits
   WHERE user_id = v_uid AND limit_kind = 'loss' AND domain = 'trading' AND currency = 'USDT';
  ASSERT v_current = '50.000000' AND v_pending = '80.000000',
    format('increase must keep current=50 pending=80, current=%s pending=%s', v_current, v_pending);

  v_res := rpc_set_rg_limit('loss', 'trading', 'USDT', '20.000000');
  SELECT current_limit, pending_limit INTO v_current, v_pending
    FROM rg_user_limits
   WHERE user_id = v_uid AND limit_kind = 'loss' AND domain = 'trading' AND currency = 'USDT';
  ASSERT v_current = '20.000000' AND v_pending IS NULL,
    format('decrease must apply immediately and clear pending, current=%s pending=%s', v_current, v_pending);

  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
     WHERE actor_id = v_uid AND action IN ('rg_limit_set', 'rg_limit_increase_requested')
  ), 'RG limit changes must be audit logged';

  RAISE NOTICE 'RG LIMITS OK — cap, upward cooldown, downward immediate, audit';
END;
$$;
ROLLBACK;

-- ── 2. Open futures unrealized loss blocks additional trading entry ───────────
BEGIN;
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_pos JSONB;
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'rg_unrealized_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM _credit_wallet_internal(v_uid, 'USDT', '10000.000000', 'rg_funding', 'rg-unrealized-usdt-' || v_uid::TEXT);
  PERFORM _debit_system_account('house_liquidity_usdt', '10000.000000', 'rg_funding', v_uid, 'rg-unrealized-usdt-' || v_uid::TEXT, NULL);

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'rg', TRUE
    FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']::TEXT[]) AS doc_type;

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_futures_enabled', 'feature_spot_enabled', 'consent_gate_enabled');
  INSERT INTO app_config (key, value, description)
  VALUES ('rg_operator_loss_cap_trading_usdt', '10000.000000', 'RG operator trading cap')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  UPDATE futures_markets
     SET is_active = TRUE, max_leverage = '10', max_user_positions = 100, max_open_interest = '1000000.000000'
   WHERE symbol = 'PHONUSDT-PERP';
  UPDATE market_circuit_breakers
     SET is_halted = FALSE, staleness_seconds = 86400
   WHERE symbol IN ('PHONUSDT-PERP', 'PHON_USDT');
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHONUSDT-PERP', '0.010000', NOW()), ('PHON_USDT', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  PERFORM rpc_set_rg_limit('loss', 'trading', 'USDT', '100.000000');

  v_pos := rpc_open_futures_position(
    'PHONUSDT-PERP', 'long', 'USDT', '1000.000000', '2', NULL, NULL, 'rg-open-' || v_uid::TEXT
  );
  ASSERT v_pos ? 'position_id', format('first futures open must succeed, got %s', v_pos);

  UPDATE oracle_prices SET price = '0.001000', updated_at = NOW()
   WHERE symbol = 'PHONUSDT-PERP';

  BEGIN
    PERFORM rpc_open_futures_position(
      'PHONUSDT-PERP', 'long', 'USDT', '1.000000', '1', NULL, NULL, 'rg-block-' || v_uid::TEXT
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'rg_loss_limit_reached' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked,
    format('open-position unrealized loss must block additional trading entry, got %s', COALESCE(v_msg, '<none>'));

  RAISE NOTICE 'RG UNREALIZED LOSS OK — open futures loss is included in trading guard';
END;
$$;
ROLLBACK;

-- ── 3. Self-exclusion blocks new entry/deposit but allows position close ──────
BEGIN;
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_exclusion_id UUID;
  v_pos JSONB;
  v_pos_id UUID;
  v_msg TEXT;
  v_release_blocked BOOLEAN := FALSE;
  v_open_blocked BOOLEAN := FALSE;
  v_deposit_blocked BOOLEAN := FALSE;
  v_close JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid, 'authenticated', 'authenticated', 'rg_self_' || v_uid::TEXT || '@test.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'rg_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;
  UPDATE profiles SET legal_name = 'Rg Self', kyc_tier = 'email_verified' WHERE id = v_uid;

  PERFORM _credit_wallet_internal(v_uid, 'USDT', '10000.000000', 'rg_funding', 'rg-self-usdt-' || v_uid::TEXT);
  PERFORM _debit_system_account('house_liquidity_usdt', '10000.000000', 'rg_funding', v_uid, 'rg-self-usdt-' || v_uid::TEXT, NULL);
  PERFORM _credit_wallet_internal(v_uid, 'PHON', '1000.000000', 'rg_funding', 'rg-self-phon-' || v_uid::TEXT);
  PERFORM _debit_system_account('reward_issuance_phon', '1000.000000', 'rg_funding', v_uid, 'rg-self-phon-' || v_uid::TEXT, NULL);

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'rg', TRUE
    FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']::TEXT[]) AS doc_type;
  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());
  INSERT INTO exchange_rate_snapshots (base_currency, quote_currency, rate, source, is_active)
  VALUES ('PHON', 'KRW', '10.000000', 'rg', TRUE);

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_futures_enabled', 'feature_deposit_enabled', 'consent_gate_enabled');
  UPDATE futures_markets
     SET is_active = TRUE, max_leverage = '10', max_user_positions = 100, max_open_interest = '1000000.000000'
   WHERE symbol = 'PHONUSDT-PERP';
  UPDATE market_circuit_breakers SET is_halted = FALSE, staleness_seconds = 86400
   WHERE symbol = 'PHONUSDT-PERP';
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHONUSDT-PERP', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = '0.010000', updated_at = NOW();

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  v_pos := rpc_open_futures_position(
    'PHONUSDT-PERP', 'long', 'USDT', '10.000000', '1', NULL, NULL, 'rg-self-open-' || v_uid::TEXT
  );
  v_pos_id := (v_pos->>'position_id')::UUID;

  v_exclusion_id := (rpc_set_self_exclusion(NOW() + INTERVAL '7 days', 'cooldown') ->> 'exclusion_id')::UUID;

  BEGIN
    PERFORM rpc_open_futures_position(
      'PHONUSDT-PERP', 'long', 'USDT', '1.000000', '1', NULL, NULL, 'rg-self-block-' || v_uid::TEXT
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'rg_self_excluded' THEN v_open_blocked := TRUE; END IF;
  END;
  ASSERT v_open_blocked, format('self-exclusion must block new trading entry, got %s', COALESCE(v_msg, '<none>'));

  v_close := rpc_close_futures_position(v_pos_id);
  ASSERT v_close->>'status' = 'closed', format('self-exclusion must still allow close, got %s', v_close);

  BEGIN
    PERFORM rpc_create_krw_deposit_request('10000', 'rg-self-dep-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'rg_self_excluded' THEN v_deposit_blocked := TRUE; END IF;
  END;
  ASSERT v_deposit_blocked, format('self-exclusion must block new deposit request, got %s', COALESCE(v_msg, '<none>'));

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_admin_release_self_exclusion(v_exclusion_id, 'support review');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'rg_self_exclusion_min_lock' THEN v_release_blocked := TRUE; END IF;
  END;
  ASSERT v_release_blocked,
    format('support/admin release before 24h must be blocked, got %s', COALESCE(v_msg, '<none>'));

  RAISE NOTICE 'RG SELF-EXCLUSION OK — entry/deposit blocked, close allowed, 24h support lock enforced';
END;
$$;
ROLLBACK;

-- ── 4. Affiliate commission base excludes RG-blocked monthly activity ─────────
BEGIN;
DO $$
DECLARE
  v_referrer UUID := gen_random_uuid();
  v_referred UUID := gen_random_uuid();
  v_round UUID := gen_random_uuid();
  v_bet UUID := gen_random_uuid();
  v_tid UUID := gen_random_uuid();
  v_before NUMERIC;
  v_after NUMERIC;
  v_month DATE := date_trunc('month', NOW())::DATE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_referrer, 'authenticated', 'authenticated', 'rg_referrer_' || v_referrer::TEXT || '@test.local', NOW(), NOW()),
    (v_referred, 'authenticated', 'authenticated', 'rg_referred_' || v_referred::TEXT || '@test.local', NOW(), NOW());
  INSERT INTO referrals (referrer_id, referred_id)
  VALUES (v_referrer, v_referred);

  INSERT INTO game_rounds (id, game, server_seed_hash, server_seed, status, result_payload, settled_at)
  VALUES (
    v_round,
    'dice',
    repeat('a', 64),
    repeat('b', 64),
    'settled',
    '{"roll":"90.00"}'::JSONB,
    NOW()
  );
  INSERT INTO game_bets (
    id, round_id, user_id, game, currency, stake, selection, client_seed,
    result_payload, payout, status, idempotency_key, settled_at
  ) VALUES (
    v_bet, v_round, v_referred, 'dice', 'USDT', '100.000000',
    '{"target":"50.00","direction":"over"}'::JSONB,
    'rg-affiliate-seed',
    '{"roll":"90.00"}'::JSONB,
    '0.000000',
    'lost',
    'rg-affiliate-' || v_bet::TEXT,
    NOW()
  );
  PERFORM _credit_system_account('game_house_usdt', '100.000000', 'game_house_settle', v_referred, v_bet::TEXT, v_tid);

  SELECT COALESCE(SUM(gross_revenue::NUMERIC), 0) INTO v_before
    FROM rg_affiliate_commission_base(v_month::TIMESTAMPTZ, (v_month + INTERVAL '1 month')::TIMESTAMPTZ)
   WHERE referrer_id = v_referrer
     AND referred_id = v_referred
     AND domain = 'game'
     AND currency = 'USDT';

  ASSERT v_before = 100,
    format('affiliate base before RG block must include GGR, got %s', v_before);

  INSERT INTO rg_block_events (
    user_id, event_type, domain, currency, month_start,
    effective_start_at, effective_end_at, reason
  ) VALUES (
    v_referred, 'loss_limit_reached', 'game', 'USDT', v_month,
    v_month::TIMESTAMPTZ, (v_month + INTERVAL '1 month')::TIMESTAMPTZ,
    'monthly exclusion'
  );

  SELECT COALESCE(SUM(gross_revenue::NUMERIC), 0) INTO v_after
    FROM rg_affiliate_commission_base(v_month::TIMESTAMPTZ, (v_month + INTERVAL '1 month')::TIMESTAMPTZ)
   WHERE referrer_id = v_referrer
     AND referred_id = v_referred
     AND domain = 'game'
     AND currency = 'USDT';

  ASSERT v_after = 0,
    format('RG-blocked month must be excluded inside aggregate, got %s', v_after);

  RAISE NOTICE 'RG AFFILIATE BASE OK — monthly loss-limit overlap excludes GGR inside aggregate';
END;
$$;
ROLLBACK;
