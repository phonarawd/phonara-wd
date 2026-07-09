-- E4 — HD deposit address slot + pending guard
BEGIN;
DO $$
DECLARE
  v_uid      UUID := gen_random_uuid();
  v_wid      UUID;
  v_slot     JSONB;
  v_addr_id  UUID;
  v_pending  TEXT;
  v_res      JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'crypto_hd_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  UPDATE app_config SET value = 'false'
    WHERE key IN ('system_halt', 'system_readonly', 'consent_gate_enabled');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_deposit_enabled';

  INSERT INTO sanctions_screenings (user_id, status, screened_at)
  VALUES (v_uid, 'clear', NOW());

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_wid FROM wallets WHERE user_id = v_uid;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  v_slot := rpc_get_crypto_deposit_address('USDT', 'TRC20');
  ASSERT (v_slot->>'ok')::BOOLEAN, format('slot reserve failed: %s', v_slot);
  ASSERT (v_slot->>'needs_derivation')::BOOLEAN, 'new slot must need derivation';
  v_pending := v_slot->>'address';
  ASSERT v_pending LIKE 'T_PENDING_%', format('expected pending prefix, got %s', v_pending);

  BEGIN
    PERFORM rpc_create_crypto_deposit_request('10.000000', 'USDT', 'TRC20', 'hd-pending-' || v_uid::TEXT);
    RAISE EXCEPTION 'create must fail when address_not_derived';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'address_not_derived' THEN RAISE; END IF;
  END;

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_res := rpc_process_on_chain_transfer(
    'TX-HD-PENDING-' || v_uid::TEXT, 'TRC20', v_pending, '10.000000', 1
  );
  ASSERT NOT (v_res->>'ok')::BOOLEAN, 'match on pending_hd must fail';
  ASSERT v_res->>'reason' = 'address_not_derived', format('expected address_not_derived, got %s', v_res);

  PERFORM rpc_service_set_crypto_address(
    v_uid, 'TRC20', 'T' || upper(substr(replace(v_uid::TEXT, '-', ''), 1, 33)),
    (v_slot->>'derivation_index')::INT
  );

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  v_slot := rpc_get_crypto_deposit_address('USDT', 'TRC20');
  ASSERT NOT COALESCE((v_slot->>'needs_derivation')::BOOLEAN, TRUE), 'derived slot must not need derivation';

  v_res := rpc_create_crypto_deposit_request('25.000000', 'USDT', 'TRC20', 'hd-create-' || v_uid::TEXT);
  ASSERT (v_res->>'ok')::BOOLEAN, format('create after derive failed: %s', v_res);
  v_addr_id := (v_res->>'deposit_id')::UUID;

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_res := rpc_process_on_chain_transfer(
    'TX-HD-OK-' || v_uid::TEXT, 'TRC20', v_res->>'address', '25.000000', 1
  );
  ASSERT (v_res->>'ok')::BOOLEAN, format('hd_xpub match must succeed: %s', v_res);

  RAISE NOTICE 'CRYPTO HD DEPOSIT E4 OK — pending guard + derive + match';
END;
$$;
ROLLBACK;
