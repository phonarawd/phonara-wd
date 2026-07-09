-- WorldNo1 rails — manual adjust · giftcard · CMS · USDT/KRW ingest
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_dep_id UUID;
  v_ledger UUID;
  v_phon_before TEXT;
  v_phon_after TEXT;
  v_res JSONB;
BEGIN
  INSERT INTO oracle_prices (symbol, price)
  VALUES ('PHON_USDT', '1.000000')
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (v_uid, v_uid || '@worldno1.test', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email"}', '{}');

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
  VALUES (v_admin, v_admin || '@admin.worldno1.test', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email"}', '{}', FALSE);

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

  v_res := rpc_service_ingest_usdt_krw_rate('1380.000000', 'test');
  ASSERT (v_res->>'ok')::BOOLEAN IS TRUE, 'USDT/KRW ingest must succeed';

  UPDATE giftcard_fee_market
     SET enabled = TRUE, last_checked_at = NOW()
   WHERE kind IN ('culture', 'book');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;

  v_res := rpc_create_giftcard_deposit_request('culture', '12345678901234', '10000', 'gc-test-1');
  v_dep_id := (v_res->>'deposit_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, TRUE);
  SET LOCAL ROLE authenticated;

  PERFORM rpc_admin_approve_giftcard_deposit(v_dep_id, 'test approve giftcard');

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  SELECT phon_available INTO v_phon_before FROM wallets WHERE user_id = v_uid;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  PERFORM rpc_admin_manual_wallet_adjust(v_uid, 'PHON', '10.000000', 'credit', 'test manual credit bonus', 'adj-1');
  v_res := rpc_admin_manual_wallet_adjust(v_uid, 'PHON', '10.000000', 'credit', 'test manual credit bonus', 'adj-1');
  ASSERT (v_res->>'ok')::BOOLEAN IS TRUE, 'manual adjust replay must ok';
  ASSERT (v_res->>'idempotent')::BOOLEAN IS TRUE, 'manual adjust replay must be idempotent';
  ASSERT v_res->>'ledger_id' IS NOT NULL, 'manual adjust replay must return ledger_id';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  v_res := rpc_create_giftcard_deposit_request('book', '98765432109876', '5000', 'gc-flag-1');
  v_dep_id := (v_res->>'deposit_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  v_res := rpc_admin_flag_deposit(v_dep_id, 'pin mismatch suspected');
  ASSERT (v_res->>'ok')::BOOLEAN IS TRUE, 'flag deposit must succeed';
  ASSERT v_res->>'status' = 'rejected', 'giftcard flag must reject';

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;
  SELECT phon_available INTO v_phon_after FROM wallets WHERE user_id = v_uid;
  ASSERT v_phon_after::NUMERIC > v_phon_before::NUMERIC, 'manual credit must increase balance';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  PERFORM rpc_admin_upsert_cms_content(jsonb_build_object(
    'content_key', 'home.hero.test',
    'kind', 'banner',
    'locale', 'ko',
    'surface', 'home',
    'status', 'published',
    'title', 'Test Banner',
    'headline', 'Welcome'
  ));

  ASSERT (SELECT COUNT(*) FROM cms_content WHERE content_key = 'home.hero.test') = 1,
    'CMS upsert must persist row';
END $$;

ROLLBACK;
