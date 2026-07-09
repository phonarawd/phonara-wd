-- Gift card fee market — snapshot calculation, stale/disabled guard, admin upsert
BEGIN;

DO $$
DECLARE
  v_uid    UUID := gen_random_uuid();
  v_admin  UUID := gen_random_uuid();
  v_res    JSONB;
  v_dep_id UUID;
BEGIN
  INSERT INTO oracle_prices (symbol, price)
  VALUES ('PHON_USDT', '1.000000')
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (v_uid, v_uid || '@gc-fee.test', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email"}', '{}');

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
  VALUES (v_admin, v_admin || '@admin.gc-fee.test', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email"}', '{}', FALSE);

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  PERFORM rpc_record_consent('terms_of_service', '1.0', TRUE);
  PERFORM rpc_record_consent('privacy_policy', '1.0', TRUE);
  PERFORM rpc_record_consent('risk_disclosure', '1.0', TRUE);
  PERFORM rpc_record_consent('age_verification', '1.0', TRUE);

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  PERFORM rpc_service_ingest_usdt_krw_rate('1380.000000', 'giftcard-fee-test');

  ASSERT (SELECT COUNT(*) FROM giftcard_fee_market WHERE enabled = TRUE) = 0,
    'Q3 default: fee market rows must start disabled';

  UPDATE giftcard_fee_market
     SET enabled = TRUE, last_checked_at = NOW();

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;

  v_res := rpc_preview_giftcard_deposit('culture', '10000');
  ASSERT (v_res->>'ok')::BOOLEAN IS TRUE, 'preview must succeed';
  ASSERT v_res->>'net_krw' = '9000.000000', 'culture 10% fee on 10000 => net 9000';
  ASSERT v_res->>'total_fee_krw' = '1000.000000', 'culture percent fee must be 1000';
  ASSERT v_res->>'percent_fee_bps' = '1000', 'culture percent_fee_bps snapshot';

  v_res := rpc_create_giftcard_deposit_request('culture', '12345678901234', '10000', 'gc-fee-1');
  v_dep_id := (v_res->>'deposit_id')::UUID;
  ASSERT v_res->>'net_krw' = '9000.000000', 'create must match preview net';
  ASSERT (SELECT fee_market_id IS NOT NULL FROM giftcard_deposit_requests WHERE id = v_dep_id),
    'deposit must store fee_market_id snapshot';

  -- mobile has fixed fee 500 on top of percent fee
  v_res := rpc_preview_giftcard_deposit('mobile', '10000');
  ASSERT v_res->>'total_fee_krw' = '2300.000000', 'mobile 18% + 500 fixed on 10000';

  -- below min face value
  BEGIN
    PERFORM rpc_preview_giftcard_deposit('culture', '1000');
    RAISE EXCEPTION 'expected face_value_below_min';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%face_value_below_min%', 'min face guard';
  END;

  -- stale market blocks deposit
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  UPDATE giftcard_fee_market
     SET last_checked_at = NOW() - INTERVAL '60 days'
   WHERE kind = 'happy';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_preview_giftcard_deposit('happy', '10000');
    RAISE EXCEPTION 'expected giftcard_fee_stale';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%giftcard_fee_stale%', 'stale fee market guard';
  END;

  -- disabled market blocks deposit
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  UPDATE giftcard_fee_market
     SET enabled = FALSE, last_checked_at = NOW()
   WHERE kind = 'book';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_preview_giftcard_deposit('book', '10000');
    RAISE EXCEPTION 'expected giftcard_kind_disabled';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLERRM LIKE '%giftcard_kind_disabled%', 'disabled kind guard';
  END;

  -- admin upsert refreshes market
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, TRUE);
  SET LOCAL ROLE authenticated;

  v_res := rpc_admin_upsert_giftcard_fee_market(jsonb_build_object(
    'kind', 'happy',
    'provider_name', '해피머니',
    'giftcard_type', '해피머니상품권',
    'payout_rate_bps', 8900,
    'percent_fee_bps', 1100,
    'fixed_fee_krw', '0',
    'min_face_value_krw', '5000',
    'max_face_value_krw', '500000',
    'sla_minutes', 45,
    'evidence_url', 'https://www.happymoney.co.kr',
    'last_checked_at', NOW()::TEXT,
    'enabled', TRUE
  ));
  ASSERT (v_res->>'ok')::BOOLEAN IS TRUE, 'admin upsert must succeed';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  v_res := rpc_preview_giftcard_deposit('happy', '10000');
  ASSERT (v_res->>'ok')::BOOLEAN IS TRUE, 'refreshed happy market must be available';
  ASSERT v_res->>'net_krw' = '8900.000000', 'updated happy fee 11% => net 8900';

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  ASSERT (SELECT COUNT(*) FROM giftcard_fee_market) >= 6,
    'seed must include major Korean gift card categories';
END $$;

ROLLBACK;
