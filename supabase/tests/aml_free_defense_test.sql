-- ============================================================
-- AML free defense — duplicate identity · account age · velocity
-- ============================================================

BEGIN;
DO $$
DECLARE
  v_uid_a   UUID := gen_random_uuid();
  v_uid_b   UUID := gen_random_uuid();
  v_admin   UUID := gen_random_uuid();
  v_msg     TEXT;
  v_blocked BOOLEAN := FALSE;
  v_res     JSONB;
  v_sub_a   UUID;
  v_sub_b   UUID;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_uid_a, 'authenticated', 'authenticated', 'aml_a_' || v_uid_a::TEXT || '@test.local', NOW(), NOW()),
    (v_uid_b, 'authenticated', 'authenticated', 'aml_b_' || v_uid_b::TEXT || '@test.local', NOW(), NOW()),
    (v_admin, 'authenticated', 'authenticated', 'aml_admin_' || v_admin::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET kyc_tier = 'email_verified', role = 'admin' WHERE id = v_admin;
  UPDATE profiles SET kyc_tier = 'email_verified' WHERE id IN (v_uid_a, v_uid_b);

  -- User A submits and gets approved KYC
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_a::TEXT)::TEXT, true);

  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES
    ('kyc-documents', v_uid_a::TEXT || '/id-front.jpg', v_uid_a, '{}'::jsonb),
    ('kyc-documents', v_uid_a::TEXT || '/id-back.jpg', v_uid_a, '{}'::jsonb),
    ('kyc-documents', v_uid_a::TEXT || '/selfie.jpg', v_uid_a, '{}'::jsonb);

  v_res := rpc_submit_kyc(
    jsonb_build_object(
      'legal_name', 'Park Jisoo',
      'document_type', 'id_card',
      'document_last4', 'B456',
      'country', 'KR',
      'document_front_path', v_uid_a::TEXT || '/id-front.jpg',
      'document_back_path', v_uid_a::TEXT || '/id-back.jpg',
      'selfie_path', v_uid_a::TEXT || '/selfie.jpg'
    ),
    'aml-idem-a-' || v_uid_a::TEXT
  );
  v_sub_a := (v_res->>'submission_id')::UUID;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    true
  );
  v_res := rpc_review_kyc_submission(v_sub_a, 'approved', 'test approval aml');

  UPDATE sanctions_screenings SET status = 'clear' WHERE user_id = v_uid_a;

  -- User B blocked on duplicate document at submit
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_b::TEXT)::TEXT, true);

  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES
    ('kyc-documents', v_uid_b::TEXT || '/id-front.jpg', v_uid_b, '{}'::jsonb),
    ('kyc-documents', v_uid_b::TEXT || '/id-back.jpg', v_uid_b, '{}'::jsonb),
    ('kyc-documents', v_uid_b::TEXT || '/selfie.jpg', v_uid_b, '{}'::jsonb);

  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_submit_kyc(
      jsonb_build_object(
        'legal_name', 'Other Name',
        'document_type', 'passport',
        'document_last4', 'B456',
        'country', 'KR',
        'document_front_path', v_uid_b::TEXT || '/id-front.jpg',
        'document_back_path', v_uid_b::TEXT || '/id-back.jpg',
        'selfie_path', v_uid_b::TEXT || '/selfie.jpg'
      ),
      'aml-idem-b-' || v_uid_b::TEXT
    );
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'aml_duplicate_identity' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, format('duplicate document must block user B, got %s', v_msg);

  -- Account age blocks fresh user withdrawal
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid_a::TEXT)::TEXT, true);
  UPDATE profiles SET kyc_tier = 'id_verified' WHERE id = v_uid_a;

  v_blocked := FALSE;
  BEGIN
    PERFORM _aml_assert_withdrawal_defense(v_uid_a, '100', 'PHON'::currency);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'aml_account_too_young' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, format('young account must block withdraw, got %s', v_msg);

  -- Compliance status RPC exposes steps
  v_res := rpc_get_compliance_status();
  ASSERT (v_res->'steps'->>'kyc_review')::BOOLEAN = TRUE, 'compliance should show kyc_review done';
  ASSERT (v_res->>'withdrawal_ready')::BOOLEAN = FALSE, 'withdraw not ready for young account';

  RAISE NOTICE 'aml_free_defense_test: OK';
END;
$$;
ROLLBACK;
