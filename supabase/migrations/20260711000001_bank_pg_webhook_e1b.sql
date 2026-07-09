-- ============================================================
-- Migration: 20260711000001_bank_pg_webhook_e1b
-- E1b — Hybrid L4 PG webhook/batch ingest → same match RPC
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Batch ingest (service_role · PG webhook / statement export) ───────────────
-- Each item invokes existing rpc_process_bank_transfer → _try_match_krw_deposit.
-- Match rules unchanged from L3 manual ingest (E1a).

CREATE OR REPLACE FUNCTION rpc_process_bank_transfer_batch(
  p_items JSONB,
  p_source TEXT DEFAULT 'pg_webhook'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item       JSONB;
  v_res        JSONB;
  v_results    JSONB := '[]'::JSONB;
  v_matched    INT := 0;
  v_exceptions INT := 0;
  v_duplicates INT := 0;
  v_errors     INT := 0;
  v_job_id     UUID;
  v_count      INT;
  v_source     TEXT;
  v_tid        TEXT;
  v_amt        TEXT;
  v_name       TEXT;
  v_ref        TEXT;
BEGIN
  PERFORM _assert_feature_enabled('deposit');

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'invalid_batch_items';
  END IF;

  v_count := jsonb_array_length(p_items);
  IF v_count < 1 OR v_count > 100 THEN
    RAISE EXCEPTION 'invalid_batch_size';
  END IF;

  v_source := COALESCE(NULLIF(btrim(p_source), ''), 'pg_webhook');
  IF v_source NOT IN ('pg_webhook', 'pg_batch', 'manual_entry') THEN
    RAISE EXCEPTION 'invalid_batch_source';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_tid := NULLIF(btrim(v_item->>'transfer_id'), '');
    v_amt := NULLIF(btrim(v_item->>'amount_krw'), '');
    v_name := NULLIF(btrim(v_item->>'depositor_name'), '');
    v_ref := NULLIF(btrim(v_item->>'reference_code'), '');

    IF v_tid IS NULL OR v_amt IS NULL OR v_name IS NULL OR v_ref IS NULL THEN
      v_errors := v_errors + 1;
      v_results := v_results || jsonb_build_array(
        jsonb_build_object('ok', FALSE, 'reason', 'invalid_item', 'item', v_item)
      );
      CONTINUE;
    END IF;

    BEGIN
      v_res := rpc_process_bank_transfer(v_tid, v_amt, v_name, v_ref);

      IF COALESCE((v_res->>'ok')::BOOLEAN, FALSE) THEN
        v_matched := v_matched + 1;
      ELSIF COALESCE((v_res->>'exception')::BOOLEAN, FALSE) THEN
        v_exceptions := v_exceptions + 1;
      END IF;

      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'ok', COALESCE((v_res->>'ok')::BOOLEAN, FALSE),
          'transfer_id', v_tid,
          'reference_code', v_ref,
          'auto_matched', v_res->'auto_matched',
          'reason', v_res->'reason',
          'exception', v_res->'exception',
          'deposit_id', v_res->'deposit_id'
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM = 'duplicate_transfer_id' THEN
          v_duplicates := v_duplicates + 1;
          v_results := v_results || jsonb_build_array(
            jsonb_build_object(
              'ok', FALSE,
              'transfer_id', v_tid,
              'reference_code', v_ref,
              'reason', 'duplicate_transfer_id',
              'duplicate', TRUE
            )
          );
        ELSE
          v_errors := v_errors + 1;
          v_results := v_results || jsonb_build_array(
            jsonb_build_object(
              'ok', FALSE,
              'transfer_id', v_tid,
              'reference_code', v_ref,
              'reason', SQLERRM
            )
          );
        END IF;
    END;
  END LOOP;

  INSERT INTO deposit_reconciliation_jobs (source, matched_count, exception_count, payload)
  VALUES (
    v_source,
    v_matched,
    v_exceptions + v_duplicates + v_errors,
    jsonb_build_object(
      'batch_size', v_count,
      'matched', v_matched,
      'exceptions', v_exceptions,
      'duplicates', v_duplicates,
      'errors', v_errors,
      'results', v_results
    )
  )
  RETURNING id INTO v_job_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'job_id', v_job_id,
    'source', v_source,
    'processed', v_count,
    'matched', v_matched,
    'exceptions', v_exceptions,
    'duplicates', v_duplicates,
    'errors', v_errors,
    'results', v_results
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_process_bank_transfer_batch(JSONB, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_process_bank_transfer_batch(JSONB, TEXT) TO service_role;
