-- ============================================================
-- Golden Earth tap — conservation + cap enforcement
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_uid           UUID := gen_random_uuid();
  v_grand_before  NUMERIC;
  v_grand_after   NUMERIC;
  v_wallet_before NUMERIC;
  v_wallet_after  NUMERIC;
  v_tap1          JSONB;
  v_tap2          JSONB;
  v_status        JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'ge_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='PHON')
  INTO v_grand_before;

  SELECT phon_available::NUMERIC INTO v_wallet_before FROM wallets WHERE user_id = v_uid;

  v_status := rpc_get_golden_earth_status();
  ASSERT (v_status->>'ok')::BOOLEAN = TRUE, 'status failed';
  ASSERT (v_status->>'authenticated')::BOOLEAN = TRUE, 'status not authenticated';
  ASSERT (v_status->>'remaining')::INT > 0, 'no remaining taps';

  v_tap1 := rpc_golden_earth_tap('test-req-1');
  ASSERT (v_tap1->>'ok')::BOOLEAN = TRUE, 'tap1 failed';
  ASSERT (v_tap1->>'phon_awarded')::NUMERIC >= 3, 'tap1 reward too low';

  v_tap2 := rpc_golden_earth_tap('test-req-1');
  ASSERT (v_tap2->>'duplicate')::BOOLEAN = TRUE, 'idempotency failed';

  SELECT phon_available::NUMERIC INTO v_wallet_after FROM wallets WHERE user_id = v_uid;
  SELECT
    (SELECT COALESCE(SUM(phon_available::NUMERIC + phon_locked::NUMERIC),0) FROM wallets)
    + (SELECT COALESCE(SUM(balance::NUMERIC),0) FROM system_accounts WHERE currency='PHON')
  INTO v_grand_after;

  ASSERT v_wallet_after > v_wallet_before, 'wallet did not increase';
  ASSERT v_grand_after = v_grand_before,
    format('PHON not conserved: before=%s after=%s', v_grand_before, v_grand_after);

  ASSERT NOT EXISTS (SELECT 1 FROM verify_ledger_hash_chain(v_uid)),
    'hash chain broken after golden earth tap';

  RAISE NOTICE 'GOLDEN EARTH CONSERVATION OK — wallet_gain=% grand=%',
    v_wallet_after - v_wallet_before, v_grand_after;
END;
$$;

ROLLBACK;
