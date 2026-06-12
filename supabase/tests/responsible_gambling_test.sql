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
  v_batch JSONB;
  v_month DATE := date_trunc('month', NOW())::DATE;
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
  ASSERT NOT EXISTS (
    SELECT 1 FROM rg_block_events
     WHERE user_id = v_uid
       AND event_type = 'loss_limit_reached'
       AND domain = 'trading'
       AND currency = 'USDT'
       AND month_start = v_month
  ), 'entry guard raise alone must not be the durable RG event source';

  v_batch := _rg_refresh_all_user_month_losses(v_month);
  ASSERT (v_batch->>'scanned')::INT >= 1, format('RG daily batch must scan at least this user, got %s', v_batch);
  ASSERT EXISTS (
    SELECT 1 FROM rg_block_events
     WHERE user_id = v_uid
       AND event_type = 'loss_limit_reached'
       AND domain = 'trading'
       AND currency = 'USDT'
       AND month_start = v_month
       AND effective_start_at = v_month::TIMESTAMPTZ
       AND effective_end_at = (v_month + INTERVAL '1 month')::TIMESTAMPTZ
  ), 'daily RG refresh batch must persist unrealized-loss limit events for aggregate exclusion';

  RAISE NOTICE 'RG UNREALIZED LOSS OK — guard blocks immediately; daily refresh persists monthly block event';
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

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);
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
  v_after NUMERIC;
  v_bet JSONB;
  v_house NUMERIC;
  v_month DATE := date_trunc('month', NOW())::DATE;
  v_msg TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_referrer, 'authenticated', 'authenticated', 'rg_referrer_' || v_referrer::TEXT || '@test.local', NOW(), NOW()),
    (v_referred, 'authenticated', 'authenticated', 'rg_referred_' || v_referred::TEXT || '@test.local', NOW(), NOW());
  INSERT INTO referrals (referrer_id, referred_id)
  VALUES (v_referrer, v_referred);
  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_referred, v_referrer);

  PERFORM _credit_wallet_internal(v_referred, 'USDT', '1000.000000', 'rg_funding', 'rg-affiliate-usdt-' || v_referred::TEXT);
  PERFORM _debit_system_account('house_liquidity_usdt', '1000.000000', 'rg_funding', v_referred, 'rg-affiliate-usdt-' || v_referred::TEXT, NULL);

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_referred, doc_type::consent_doc_type, 'rg', TRUE
    FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']::TEXT[]) AS doc_type;

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_game_enabled', 'feature_game_dice_enabled', 'consent_gate_enabled');

  INSERT INTO rg_user_limits (
    user_id, limit_kind, domain, currency, current_limit
  ) VALUES (
    v_referred, 'loss', 'game', 'USDT', '1.000000'
  );

  INSERT INTO game_rounds (id, game, server_seed_hash, server_seed, status, result_payload, settled_at)
  VALUES (
    v_round,
    'dice',
    repeat('a', 64),
    repeat('b', 64),
    'open',
    NULL,
    NULL
  );

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_referred::TEXT)::TEXT, true);
  v_bet := rpc_place_game_bet(
    v_round, 'USDT', '100.000000',
    '{"target":"100.00","direction":"under"}'::JSONB,
    'rg-affiliate-seed', 'rg-affiliate-' || v_round::TEXT
  );
  ASSERT v_bet->>'status' = 'won', format('controlled dice bet should settle with tiny house GGR, got %s', v_bet);

  SELECT COALESCE(SUM(amount::NUMERIC), 0) INTO v_house
    FROM system_account_ledger
   WHERE related_user_id = v_referred
     AND account_code = 'game_house_usdt'
     AND reason_code = 'game_house_settle';
  ASSERT v_house = 1,
    format('controlled dice settlement should create exactly 1 USDT GGR, got %s', v_house);

  ASSERT EXISTS (
    SELECT 1 FROM rg_block_events
     WHERE user_id = v_referred
       AND event_type = 'loss_limit_reached'
       AND domain = 'game'
       AND currency = 'USDT'
       AND month_start = v_month
       AND effective_start_at = v_month::TIMESTAMPTZ
       AND effective_end_at = (v_month + INTERVAL '1 month')::TIMESTAMPTZ
  ), 'successful settlement refresh must persist a same-window loss_limit_reached block event';

  SELECT COALESCE(SUM(gross_revenue::NUMERIC), 0) INTO v_after
    FROM rg_affiliate_commission_base(v_month::TIMESTAMPTZ, (v_month + INTERVAL '1 month')::TIMESTAMPTZ)
   WHERE referrer_id = v_referrer
     AND referred_id = v_referred
     AND domain = 'game'
     AND currency = 'USDT';

  ASSERT v_after = 0,
    format('settlement-created RG block must exclude same-month GGR inside aggregate, got %s', v_after);

  INSERT INTO game_rounds (id, game, server_seed_hash, server_seed, status)
  VALUES (gen_random_uuid(), 'dice', repeat('c', 64), repeat('d', 64), 'open')
  RETURNING id INTO v_round;

  BEGIN
    PERFORM rpc_place_game_bet(
      v_round, 'USDT', '1.000000',
      '{"target":"100.00","direction":"under"}'::JSONB,
      'rg-affiliate-seed-2', 'rg-affiliate-next-' || v_round::TEXT
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'rg_loss_limit_reached' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked,
    format('entry guard must still block subsequent game entry after settlement-created event, got %s', COALESCE(v_msg, '<none>'));

  RAISE NOTICE 'RG AFFILIATE BASE OK — settlement refresh records monthly block and aggregate excludes GGR';
END;
$$;
ROLLBACK;

-- ── 5. RG refresh failure is isolated from committed settlement ───────────────
BEGIN;
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_round UUID := gen_random_uuid();
  v_bet JSONB;
  v_bet_id UUID;
  v_status TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'rg_refresh_fail_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM _credit_wallet_internal(v_uid, 'USDT', '1000.000000', 'rg_funding', 'rg-refresh-fail-usdt-' || v_uid::TEXT);
  PERFORM _debit_system_account('house_liquidity_usdt', '1000.000000', 'rg_funding', v_uid, 'rg-refresh-fail-usdt-' || v_uid::TEXT, NULL);

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'rg', TRUE
    FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']::TEXT[]) AS doc_type;

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true'
    WHERE key IN ('feature_game_enabled', 'feature_game_dice_enabled', 'consent_gate_enabled');

  INSERT INTO rg_user_limits (
    user_id, limit_kind, domain, currency, current_limit
  ) VALUES (
    v_uid, 'loss', 'game', 'USDT', '1.000000'
  );

  CREATE FUNCTION _test_rg_refresh_fail()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $fn$
  BEGIN
    RAISE EXCEPTION 'forced_rg_refresh_failure';
  END;
  $fn$;

  CREATE TRIGGER trg_test_rg_refresh_fail
    BEFORE INSERT OR UPDATE ON rg_loss_tracking
    FOR EACH ROW EXECUTE FUNCTION _test_rg_refresh_fail();

  INSERT INTO game_rounds (id, game, server_seed_hash, server_seed, status)
  VALUES (v_round, 'dice', repeat('e', 64), repeat('f', 64), 'open');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  v_bet := rpc_place_game_bet(
    v_round, 'USDT', '100.000000',
    '{"target":"100.00","direction":"under"}'::JSONB,
    'rg-refresh-fail-seed', 'rg-refresh-fail-' || v_round::TEXT
  );
  v_bet_id := (v_bet->>'bet_id')::UUID;

  SELECT status INTO v_status FROM game_bets WHERE id = v_bet_id;
  ASSERT v_status IN ('won', 'lost'),
    format('settlement must commit even when RG refresh trigger fails, bet=%s status=%s', v_bet, COALESCE(v_status, '<missing>'));
  ASSERT EXISTS (
    SELECT 1 FROM system_account_ledger
     WHERE related_user_id = v_uid
       AND account_code = 'game_house_usdt'
       AND reason_code = 'game_house_settle'
  ), 'house settlement leg must commit even when RG refresh fails';

  RAISE NOTICE 'RG REFRESH FAILURE ISOLATION OK — settlement commits while refresh failure is swallowed';
END;
$$;
ROLLBACK;
