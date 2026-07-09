-- Phase 1 — PHON/KRW synthetic rate refresh + stale deposit gate

BEGIN;
DO $$
DECLARE
  v_uid     UUID := gen_random_uuid();
  v_id      UUID;
  v_rate    TEXT;
  v_msg     TEXT;
  v_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'phon_krw_refresh_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_deposit_enabled';

  UPDATE exchange_rate_snapshots SET is_active = FALSE
   WHERE base_currency IN ('PHON', 'USDT') AND quote_currency = 'KRW';

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHON_USDT', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  UPDATE app_config SET value = '1000' WHERE key = 'usdt_krw_reference_rate';

  v_id := _refresh_phon_krw_exchange_rate();

  SELECT rate INTO v_rate
    FROM exchange_rate_snapshots
   WHERE id = v_id;

  ASSERT v_rate = '10.000000',
    format('PHON/KRW must be PHON_USDT*USDT/KRW = 10, got %s', v_rate);

  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  PERFORM rpc_create_krw_deposit_request('10000', 'refresh-ok-' || v_uid::TEXT);

  UPDATE exchange_rate_snapshots
     SET captured_at = NOW() - INTERVAL '20 minutes'
   WHERE id = v_id;

  BEGIN
    PERFORM rpc_create_krw_deposit_request('10000', 'refresh-stale-' || v_uid::TEXT);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'phon_krw_rate_stale' THEN v_blocked := TRUE; END IF;
  END;

  ASSERT v_blocked,
    format('stale PHON/KRW rate must raise phon_krw_rate_stale, got %s', COALESCE(v_msg, '<none>'));

  RAISE NOTICE 'PHON/KRW REFRESH OK — synthetic rate + stale deposit gate';
END;
$$;
ROLLBACK;
