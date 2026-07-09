-- E6 — deposit credited notification outbox + realtime publication
BEGIN;

DO $$
DECLARE
  v_uid    UUID := gen_random_uuid();
  v_admin  UUID := gen_random_uuid();
  v_res    JSONB;
  v_dep_id UUID;
  v_notif  INT;
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (v_uid, v_uid || '@dep-notify.test', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email"}', '{}');

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
  VALUES (v_admin, v_admin || '@admin.dep-notify.test', crypt('test', gen_salt('bf')), NOW(), '{"provider":"email"}', '{}', FALSE);

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
  PERFORM rpc_service_ingest_usdt_krw_rate('1380.000000', 'deposit-notify-e6');

  UPDATE giftcard_fee_market SET enabled = TRUE, last_checked_at = NOW() WHERE kind = 'culture';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, TRUE);
  SET LOCAL ROLE authenticated;

  v_res := rpc_create_giftcard_deposit_request('culture', '12345678901234', '10000', 'dep-notify-gc');
  v_dep_id := (v_res->>'deposit_id')::UUID;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, TRUE);
  SET LOCAL ROLE authenticated;
  PERFORM rpc_admin_approve_giftcard_deposit(v_dep_id, 'approve giftcard deposit notify e6');

  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE service_role;

  SELECT COUNT(*)::INT INTO v_notif
    FROM notification_outbox
   WHERE user_id = v_uid
     AND event_type = 'deposit_credited'
     AND payload->>'rail' = 'giftcard'
     AND payload->>'deposit_id' = v_dep_id::TEXT
     AND payload->>'currency' = 'PHON';

  ASSERT v_notif = 1,
    format('giftcard credit must enqueue deposit_credited notification, got %s', v_notif);

  RAISE NOTICE 'DEPOSIT NOTIFY E6 OK — giftcard credit enqueues unified deposit_credited outbox row';
END;
$$;

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'krw_deposit_requests'
  ), 'krw_deposit_requests must be in supabase_realtime publication';

  ASSERT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'crypto_deposit_requests'
  ), 'crypto_deposit_requests must be in supabase_realtime publication';

  ASSERT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'giftcard_deposit_requests'
  ), 'giftcard_deposit_requests must be in supabase_realtime publication';

  RAISE NOTICE 'DEPOSIT NOTIFY E6 OK — deposit tables published for realtime';
END;
$$;

ROLLBACK;
