-- E4 — HD deposit address slot contract + pending guard + create alignment
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _ensure_crypto_deposit_address_slot(
  p_user_id UUID,
  p_asset crypto_asset,
  p_chain crypto_chain
)
RETURNS crypto_deposit_addresses
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row crypto_deposit_addresses%ROWTYPE;
  v_idx   INT;
  v_pending TEXT;
BEGIN
  SELECT * INTO v_row
    FROM crypto_deposit_addresses
   WHERE user_id = p_user_id AND asset = p_asset AND chain = p_chain;

  IF NOT FOUND THEN
    v_idx := _reserve_crypto_derivation_index(p_chain);
    v_pending := CASE p_chain
      WHEN 'TRC20' THEN 'T_PENDING_' || lpad(v_idx::TEXT, 8, '0')
      WHEN 'ERC20' THEN '0xPENDING' || lpad(to_hex(v_idx), 8, '0')
    END;
    INSERT INTO crypto_deposit_addresses (user_id, asset, chain, address, derivation_index, address_source)
    VALUES (p_user_id, p_asset, p_chain, v_pending, v_idx, 'pending_hd')
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION _ensure_crypto_deposit_address_slot(UUID, crypto_asset, crypto_chain)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_get_crypto_deposit_address(
  p_asset TEXT DEFAULT 'USDT',
  p_chain TEXT DEFAULT 'TRC20'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_asset   crypto_asset;
  v_chain   crypto_chain;
  v_row     crypto_deposit_addresses%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('deposit');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);

  BEGIN
    v_asset := p_asset::crypto_asset;
    v_chain := p_chain::crypto_chain;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_asset_or_chain';
  END;

  v_row := _ensure_crypto_deposit_address_slot(v_user_id, v_asset, v_chain);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'address', v_row.address,
    'asset', v_row.asset,
    'chain', v_row.chain,
    'address_id', v_row.id,
    'derivation_index', v_row.derivation_index,
    'needs_derivation', v_row.address_source = 'pending_hd',
    'address_source', v_row.address_source
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_crypto_deposit_address(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_crypto_deposit_address(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_create_crypto_deposit_request(
  p_amount TEXT,
  p_asset TEXT DEFAULT 'USDT',
  p_chain TEXT DEFAULT 'TRC20',
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_asset   crypto_asset;
  v_chain   crypto_chain;
  v_wallet  wallets%ROWTYPE;
  v_addr    crypto_deposit_addresses%ROWTYPE;
  v_dep_id  UUID;
  v_ttl_h   INT;
  v_conf    INT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('deposit');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);

  IF p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_create_crypto_deposit_request')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  BEGIN
    v_asset := p_asset::crypto_asset;
    v_chain := p_chain::crypto_chain;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_asset_or_chain';
  END;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  v_addr := _ensure_crypto_deposit_address_slot(v_user_id, v_asset, v_chain);

  IF v_addr.address_source = 'pending_hd' THEN
    RAISE EXCEPTION 'address_not_derived';
  END IF;

  SELECT COALESCE(value::INT, 24) INTO v_ttl_h FROM app_config WHERE key = 'crypto_deposit_request_ttl_hours';
  SELECT COALESCE(value::INT, 1) INTO v_conf FROM app_config WHERE key = 'crypto_deposit_confirmations_required';

  INSERT INTO crypto_deposit_requests (
    user_id, wallet_id, address_id, asset, chain, amount,
    confirmations_required, expires_at
  ) VALUES (
    v_user_id, v_wallet.id, v_addr.id, v_asset, v_chain, p_amount,
    v_conf, NOW() + (v_ttl_h || ' hours')::INTERVAL
  ) RETURNING id INTO v_dep_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'deposit_id', v_dep_id,
    'address', v_addr.address,
    'asset', v_asset,
    'chain', v_chain,
    'amount', p_amount,
    'confirmations_required', v_conf,
    'sla_hours', v_ttl_h,
    'address_source', v_addr.address_source
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_crypto_deposit_request(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_crypto_deposit_request(TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION _try_match_crypto_deposit(
  p_tx_hash TEXT,
  p_chain crypto_chain,
  p_to_address TEXT,
  p_amount TEXT,
  p_confirmations_seen INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_addr_id       UUID;
  v_user_id       UUID;
  v_addr_source   TEXT;
  v_dep_id        UUID;
  v_dep           crypto_deposit_requests%ROWTYPE;
  v_ocit_id       UUID;
  v_job_id        UUID;
  v_ledger        UUID;
  v_req_conf      INT;
BEGIN
  SELECT COALESCE(value::INT, 1) INTO v_req_conf
    FROM app_config WHERE key = 'crypto_deposit_confirmations_required';

  IF COALESCE(p_confirmations_seen, 0) < v_req_conf THEN
    RAISE EXCEPTION 'insufficient_confirmations';
  END IF;

  INSERT INTO on_chain_incoming_transfers (
    tx_hash, chain, to_address, amount, confirmations_seen
  ) VALUES (
    p_tx_hash, p_chain, p_to_address, p_amount, p_confirmations_seen
  ) RETURNING id INTO v_ocit_id;

  SELECT id, user_id, address_source
    INTO v_addr_id, v_user_id, v_addr_source
    FROM crypto_deposit_addresses
   WHERE address = p_to_address AND chain = p_chain;

  IF v_addr_id IS NULL THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'on_chain_incoming_transfers', v_ocit_id, NULL,
      'address_not_found',
      jsonb_build_object('tx_hash', p_tx_hash, 'to_address', p_to_address, 'chain', p_chain)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'address_not_found', 'exception', TRUE);
  END IF;

  IF v_addr_source = 'pending_hd' THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'on_chain_incoming_transfers', v_ocit_id, v_user_id,
      'address_not_derived',
      jsonb_build_object('tx_hash', p_tx_hash, 'to_address', p_to_address, 'chain', p_chain)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'address_not_derived', 'exception', TRUE);
  END IF;

  SELECT id INTO v_dep_id
    FROM crypto_deposit_requests
   WHERE address_id = v_addr_id
     AND status = 'pending'
     AND expires_at > NOW()
   ORDER BY created_at ASC
   LIMIT 1
   FOR UPDATE;

  IF v_dep_id IS NULL THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'on_chain_incoming_transfers', v_ocit_id, v_user_id,
      'pending_request_not_found',
      jsonb_build_object('tx_hash', p_tx_hash, 'to_address', p_to_address)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'pending_request_not_found', 'exception', TRUE);
  END IF;

  SELECT * INTO v_dep FROM crypto_deposit_requests WHERE id = v_dep_id;

  IF v_dep.amount IS DISTINCT FROM p_amount THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'crypto_deposit_requests', v_dep_id, v_dep.user_id,
      'amount_mismatch',
      jsonb_build_object('expected', v_dep.amount, 'received', p_amount, 'tx_hash', p_tx_hash)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'amount_mismatch', 'exception', TRUE);
  END IF;

  IF EXISTS (
    SELECT 1 FROM risk_flags
     WHERE user_id = v_dep.user_id AND status = 'active'
       AND flag_type IN ('sanctions_hit', 'sanctions_pending')
  ) OR EXISTS (SELECT 1 FROM profiles WHERE id = v_dep.user_id AND activity_frozen) THEN
    PERFORM _enqueue_admin_review(
      'deposit_exception', 'crypto_deposit_requests', v_dep_id, v_dep.user_id,
      'sanctions_or_freeze',
      jsonb_build_object('tx_hash', p_tx_hash)
    );
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'sanctions_or_freeze', 'exception', TRUE);
  END IF;

  UPDATE on_chain_incoming_transfers SET matched_deposit_id = v_dep_id WHERE id = v_ocit_id;
  UPDATE crypto_deposit_requests
     SET status = 'matched', matched_at = NOW(), confirmations_seen = p_confirmations_seen
   WHERE id = v_dep_id;

  v_ledger := _credit_crypto_deposit_internal(v_dep_id, p_tx_hash);

  INSERT INTO deposit_reconciliation_jobs (source, matched_count, exception_count, payload)
  VALUES ('on_chain', 1, 0,
    jsonb_build_object('tx_hash', p_tx_hash, 'deposit_id', v_dep_id))
  RETURNING id INTO v_job_id;

  UPDATE on_chain_incoming_transfers SET reconciliation_job_id = v_job_id WHERE id = v_ocit_id;

  RETURN jsonb_build_object(
    'ok', TRUE, 'deposit_id', v_dep_id, 'ledger_id', v_ledger, 'auto_matched', TRUE
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'duplicate_tx_hash' USING HINT = p_tx_hash;
END;
$$;

REVOKE ALL ON FUNCTION _try_match_crypto_deposit(TEXT, crypto_chain, TEXT, TEXT, INT)
  FROM PUBLIC, anon, authenticated;
