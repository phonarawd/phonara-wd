-- Qualified referral — pending on welcome, pay on first daily claim
BEGIN;

DO $$
DECLARE
  v_referrer UUID := gen_random_uuid();
  v_referred UUID := gen_random_uuid();
  v_welcome JSONB;
  v_daily JSONB;
  v_ref_state referral_state;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_referrer, 'authenticated', 'authenticated', 'ref_a_' || v_referrer::TEXT || '@test.local', NOW(), NOW()),
    (v_referred, 'authenticated', 'authenticated', 'ref_b_' || v_referred::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET username = 'referrer' || substr(v_referrer::TEXT, 1, 8) WHERE id = v_referrer;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_referred::TEXT)::TEXT, true);
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_referred, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  PERFORM rpc_register_referral((SELECT username FROM profiles WHERE id = v_referrer));

  v_welcome := rpc_claim_welcome_bonus();
  ASSERT (v_welcome->>'already_claimed')::BOOLEAN = FALSE;

  SELECT state INTO v_ref_state FROM referrals WHERE referred_id = v_referred;
  ASSERT v_ref_state = 'pending', 'referral should be pending after welcome';

  v_daily := rpc_claim_daily_reward();
  ASSERT (v_daily->>'already_claimed')::BOOLEAN = FALSE;

  SELECT state INTO v_ref_state FROM referrals WHERE referred_id = v_referred;
  ASSERT v_ref_state = 'paid', 'referral should be paid after referred daily claim';

  RAISE NOTICE 'REFERRAL QUALIFIED REWARD OK';
END;
$$;

ROLLBACK;
