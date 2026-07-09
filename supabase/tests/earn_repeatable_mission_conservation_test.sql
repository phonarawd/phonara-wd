-- Earn hub — repeatable mission claim conservation
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_phon_before NUMERIC;
  v_phon_after NUMERIC;
  v_claim JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'earn_rep_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_before;

  v_claim := rpc_claim_repeatable_mission('social_follow_x', 'earn-rep-idem-' || v_uid::TEXT);
  ASSERT (v_claim->>'ok')::BOOLEAN = TRUE, 'social mission claim should succeed';

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC), 0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC), 0) FROM system_accounts WHERE currency = 'PHON')
  INTO v_phon_after;

  ASSERT v_phon_before = v_phon_after, 'repeatable mission claim must conserve PHON';

  BEGIN
    PERFORM rpc_claim_repeatable_mission('social_follow_x', 'earn-rep-dup-' || v_uid::TEXT);
    RAISE EXCEPTION 'duplicate claim should fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT ILIKE '%already_claimed%' THEN
      RAISE;
    END IF;
  END;

  RAISE NOTICE 'EARN REPEATABLE MISSION CONSERVATION OK';
END $$;

ROLLBACK;
