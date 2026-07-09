-- E1b — PG webhook/batch ingest → same _try_match_krw_deposit match RPC
BEGIN;

DO $$
DECLARE
  v_uid       UUID := gen_random_uuid();
  v_wid       UUID;
  v_ref_ok    TEXT := 'E1BREF0001';
  v_ref_bad   TEXT := 'E1BREF0002';
  v_batch     JSONB;
  v_res       JSONB;
  v_before    TEXT;
  v_after     TEXT;
  v_job       deposit_reconciliation_jobs%ROWTYPE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated',
          'e1b_batch_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  UPDATE profiles SET legal_name = 'Park E1b', kyc_tier = 'email_verified' WHERE id = v_uid;
  SELECT id INTO v_wid FROM wallets WHERE user_id = v_uid;

  INSERT INTO krw_deposit_requests (
    user_id, wallet_id, reference_code, amount_krw, expected_phon, status
  ) VALUES (
    v_uid, v_wid, v_ref_ok, '50000', '500.000000', 'pending'
  );

  INSERT INTO krw_deposit_requests (
    user_id, wallet_id, reference_code, amount_krw, expected_phon, status
  ) VALUES (
    v_uid, v_wid, v_ref_bad, '10000', '100.000000', 'pending'
  );

  SELECT phon_available INTO v_before FROM wallets WHERE user_id = v_uid;

  v_batch := jsonb_build_array(
    jsonb_build_object(
      'transfer_id', 'PG-E1B-OK-' || v_uid::TEXT,
      'amount_krw', '50000',
      'depositor_name', 'Park E1b',
      'reference_code', v_ref_ok
    ),
    jsonb_build_object(
      'transfer_id', 'PG-E1B-BAD-' || v_uid::TEXT,
      'amount_krw', '99999',
      'depositor_name', 'Park E1b',
      'reference_code', v_ref_bad
    )
  );

  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  v_res := rpc_process_bank_transfer_batch(v_batch, 'pg_webhook');

  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    format('batch ingest must succeed, got %s', v_res);
  ASSERT (v_res->>'matched')::INT = 1,
    format('batch must auto-match exactly one transfer, got %s', v_res->>'matched');
  ASSERT (v_res->>'exceptions')::INT = 1,
    format('batch must record one exception (amount mismatch), got %s', v_res->>'exceptions');
  ASSERT v_res->>'source' = 'pg_webhook',
    format('batch source must be pg_webhook, got %s', v_res->>'source');

  SELECT phon_available INTO v_after FROM wallets WHERE user_id = v_uid;
  -- 500 PHON deposit match + 3000 PHON first_deposit mission on first credited KRW deposit
  ASSERT v_after::NUMERIC - v_before::NUMERIC = 3500::NUMERIC,
    format('batch match must credit 500 PHON + first_deposit 3000, before=%s after=%s', v_before, v_after);

  SELECT * INTO v_job
    FROM deposit_reconciliation_jobs
   WHERE id = (v_res->>'job_id')::UUID;

  ASSERT v_job.source = 'pg_webhook',
    format('reconciliation job source must be pg_webhook, got %s', v_job.source);
  ASSERT v_job.matched_count = 1 AND v_job.exception_count = 1,
    format('job counts mismatch matched=%s exception=%s', v_job.matched_count, v_job.exception_count);

  RAISE NOTICE 'E1B PG WEBHOOK OK — batch ingest uses same match RPC · matched=1 exception=1 · Σ credit 500+3000 PHON';
END;
$$;

DO $$
DECLARE
  v_res JSONB;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  v_res := rpc_process_bank_transfer_batch(
    jsonb_build_array(
      jsonb_build_object(
        'transfer_id', 'PG-E1B-DUP-001',
        'amount_krw', '1000',
        'depositor_name', 'Dup Test',
        'reference_code', 'NOREF00001'
      ),
      jsonb_build_object(
        'transfer_id', 'PG-E1B-DUP-001',
        'amount_krw', '1000',
        'depositor_name', 'Dup Test',
        'reference_code', 'NOREF00001'
      )
    ),
    'pg_batch'
  );

  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
    format('duplicate batch must complete without abort, got %s', v_res);
  ASSERT (v_res->>'duplicates')::INT = 1,
    format('second duplicate transfer_id must be counted as duplicate, got %s', v_res->>'duplicates');

  RAISE NOTICE 'E1B PG WEBHOOK OK — duplicate transfer_id in batch is isolated (no abort)';
END;
$$;

ROLLBACK;
