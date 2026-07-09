-- Launch RC — admin KRW deposit match bypasses depositor name (Σ=0)
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_dep JSONB;
  v_dep_id UUID;
  v_ref TEXT;
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_match JSONB;
  v_status TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid, 'authenticated', 'authenticated', 'krw_' || v_uid::TEXT || '@test.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'adm_' || v_admin::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET legal_name = '홍길동', username = 'user' || substr(v_uid::TEXT, 1, 8) WHERE id = v_uid;
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '0.000000' WHERE user_id = v_uid;

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_deposit_enabled';

  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  INSERT INTO exchange_rate_snapshots (base_currency, quote_currency, rate, source, is_active)
  VALUES ('PHON', 'KRW', '7.500000', 'test', TRUE)
  ON CONFLICT DO NOTHING;
  UPDATE exchange_rate_snapshots SET is_active = TRUE, rate = '7.500000'
   WHERE base_currency = 'PHON' AND quote_currency = 'KRW';
  PERFORM _refresh_phon_krw_exchange_rate();

  SELECT phon_available::NUMERIC INTO v_phon_before FROM wallets WHERE user_id = v_uid;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  v_dep := rpc_create_krw_deposit_request('10000', 'admin-match-' || v_uid::TEXT);
  v_dep_id := (v_dep->>'deposit_id')::UUID;
  v_ref := v_dep->>'reference_code';
  ASSERT v_dep_id IS NOT NULL, 'deposit request must return deposit_id';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT, true);

  v_match := rpc_admin_match_krw_deposit(
    v_dep_id,
    'ADMIN-TX-' || substr(v_uid::TEXT, 1, 8),
    'manual bank reconciliation'
  );
  ASSERT (v_match->>'ok')::BOOLEAN = TRUE, format('admin match must succeed, got %s', v_match);

  SELECT status INTO v_status FROM krw_deposit_requests WHERE id = v_dep_id;
  ASSERT v_status = 'credited', format('deposit must be credited, got %s', v_status);

  SELECT phon_available::NUMERIC INTO v_phon_after FROM wallets WHERE user_id = v_uid;

  ASSERT v_phon_after > v_phon_before, 'admin match must credit PHON to user wallet';

  RAISE NOTICE 'ADMIN KRW MATCH OK — depositor override, credited, Σ=0';
END;
$$;

ROLLBACK;
