-- ============================================================
-- Migration: 20260713000001_p0_edge_contracts_claim_webhook
-- P0 edge contracts — notification claim/complete, PG webhook replay,
-- withdrawal broadcast single-flight claim.
-- ============================================================
-- Closes:
-- 1) notification-dispatch marking pending rows sent without provider handoff
-- 2) pg-bank-webhook external auth (replay table + service RPC; verify_jwt in config.toml)
-- 3) crypto-withdraw-broadcast duplicate processing (claim before sign/broadcast)
-- ============================================================

SET search_path = public, pg_temp;

-- ─── PG webhook replay + config (HMAC path; timestamp skew 5m, nonce TTL 24h) ─
CREATE TABLE IF NOT EXISTS pg_webhook_replay (
  provider             TEXT NOT NULL DEFAULT 'pg_bank',
  replay_key           TEXT NOT NULL,
  timestamp_unix       BIGINT,
  signature_digest     TEXT,
  request_hash         TEXT NOT NULL,
  canonical_body_hash  TEXT NOT NULL,
  first_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, replay_key)
);

CREATE INDEX IF NOT EXISTS pg_webhook_replay_first_seen_idx
  ON pg_webhook_replay (first_seen_at);

ALTER TABLE pg_webhook_replay ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pg_webhook_replay FROM PUBLIC, anon, authenticated;
GRANT ALL ON pg_webhook_replay TO service_role;

INSERT INTO app_config (key, value, description)
VALUES
  ('pg_webhook_timestamp_skew_seconds', '300',
   'PG bank webhook HMAC timestamp tolerance (5 minutes).'),
  ('pg_webhook_nonce_ttl_seconds', '86400',
   'PG bank webhook replay nonce retention window (24 hours).')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = NOW();

CREATE OR REPLACE FUNCTION rpc_service_register_pg_webhook_replay(
  p_replay_key         TEXT,
  p_timestamp_unix     BIGINT,
  p_signature_digest   TEXT,
  p_request_hash       TEXT,
  p_canonical_body_hash TEXT,
  p_provider           TEXT DEFAULT 'pg_bank'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing pg_webhook_replay%ROWTYPE;
  v_ttl_seconds INT;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_replay_key IS NULL OR btrim(p_replay_key) = '' THEN
    RAISE EXCEPTION 'invalid_replay_key';
  END IF;
  IF p_request_hash IS NULL OR btrim(p_request_hash) = '' THEN
    RAISE EXCEPTION 'invalid_request_hash';
  END IF;
  IF p_canonical_body_hash IS NULL OR btrim(p_canonical_body_hash) = '' THEN
    RAISE EXCEPTION 'invalid_canonical_body_hash';
  END IF;

  SELECT value::INT INTO v_ttl_seconds
    FROM app_config
   WHERE key = 'pg_webhook_nonce_ttl_seconds';
  v_ttl_seconds := COALESCE(v_ttl_seconds, 86400);

  DELETE FROM pg_webhook_replay
   WHERE provider = COALESCE(NULLIF(btrim(p_provider), ''), 'pg_bank')
     AND first_seen_at < NOW() - (v_ttl_seconds || ' seconds')::INTERVAL;

  SELECT * INTO v_existing
    FROM pg_webhook_replay
   WHERE provider = COALESCE(NULLIF(btrim(p_provider), ''), 'pg_bank')
     AND replay_key = p_replay_key;

  IF FOUND THEN
    IF v_existing.canonical_body_hash = p_canonical_body_hash
       AND v_existing.request_hash = p_request_hash THEN
      RETURN jsonb_build_object(
        'ok', TRUE,
        'duplicate', TRUE,
        'replay_key', p_replay_key
      );
    END IF;

    RETURN jsonb_build_object(
      'ok', FALSE,
      'duplicate', FALSE,
      'conflict', TRUE,
      'replay_key', p_replay_key,
      'alert', 'pg_webhook_replay_body_mismatch'
    );
  END IF;

  INSERT INTO pg_webhook_replay (
    provider, replay_key, timestamp_unix, signature_digest,
    request_hash, canonical_body_hash
  ) VALUES (
    COALESCE(NULLIF(btrim(p_provider), ''), 'pg_bank'),
    p_replay_key,
    p_timestamp_unix,
    p_signature_digest,
    p_request_hash,
    p_canonical_body_hash
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'duplicate', FALSE,
    'replay_key', p_replay_key
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_register_pg_webhook_replay(TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_register_pg_webhook_replay(TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT)
  TO service_role;

-- ─── notification_outbox claim workflow ───────────────────────────────────────
ALTER TABLE notification_outbox
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by TEXT,
  ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_error_code TEXT;

ALTER TABLE notification_outbox DROP CONSTRAINT IF EXISTS notification_outbox_status_check;
ALTER TABLE notification_outbox
  ADD CONSTRAINT notification_outbox_status_check
  CHECK (status IN (
    'pending', 'processing', 'retryable_failed', 'failed', 'manual_review', 'sent'
  ));

DROP INDEX IF EXISTS notification_outbox_pending_idx;
CREATE INDEX IF NOT EXISTS notification_outbox_dispatch_claim_idx
  ON notification_outbox (next_attempt_at, created_at)
  WHERE status IN ('pending', 'retryable_failed');

CREATE INDEX IF NOT EXISTS notification_outbox_processing_claim_idx
  ON notification_outbox (claim_expires_at)
  WHERE status = 'processing';

CREATE OR REPLACE FUNCTION rpc_service_claim_notification_dispatch_batch(
  p_worker_id          TEXT,
  p_batch_size         INT DEFAULT 50,
  p_claim_ttl_seconds  INT DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_worker TEXT;
  v_limit  INT;
  v_ttl    INT;
  v_row    notification_outbox%ROWTYPE;
  v_items  JSONB := '[]'::JSONB;
  v_count  INT := 0;
  v_attempt INT;
  v_idem   TEXT;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_worker := NULLIF(btrim(p_worker_id), '');
  IF v_worker IS NULL THEN
    RAISE EXCEPTION 'invalid_worker_id';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_batch_size, 50), 1), 100);
  v_ttl := GREATEST(COALESCE(p_claim_ttl_seconds, 300), 60);

  -- Reclaim stale processing rows without incrementing attempts (worker crash recovery).
  UPDATE notification_outbox
     SET status = CASE
           WHEN attempts >= 5 THEN 'failed'
           ELSE 'retryable_failed'
         END,
         claimed_at = NULL,
         claimed_by = NULL,
         claim_expires_at = NULL,
         last_error_code = COALESCE(last_error_code, 'claim_timeout'),
         next_attempt_at = NOW() + (
           POWER(2, LEAST(GREATEST(attempts, 1), 10)) * 30
         ) * INTERVAL '1 second'
   WHERE status = 'processing'
     AND claim_expires_at IS NOT NULL
     AND claim_expires_at < NOW()
     AND attempts < 5;

  FOR v_row IN
    SELECT *
      FROM notification_outbox
     WHERE (
       status IN ('pending', 'retryable_failed')
       AND attempts < 5
       AND next_attempt_at <= NOW()
     )
     ORDER BY created_at
     FOR UPDATE SKIP LOCKED
     LIMIT v_limit
  LOOP
    v_attempt := v_row.attempts;
    v_idem := format('notification:dispatch:%s:%s', v_row.id, v_attempt);

    UPDATE notification_outbox
       SET status = 'processing',
           claimed_at = NOW(),
           claimed_by = v_worker,
           claim_expires_at = NOW() + (v_ttl || ' seconds')::INTERVAL,
           provider_idempotency_key = v_idem
     WHERE id = v_row.id;

    v_items := v_items || jsonb_build_array(
      jsonb_build_object(
        'id', v_row.id,
        'user_id', v_row.user_id,
        'channel', v_row.channel,
        'event_type', v_row.event_type,
        'payload', v_row.payload,
        'attempts', v_row.attempts,
        'provider_idempotency_key', v_idem
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'worker_id', v_worker,
    'claimed', v_count,
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_claim_notification_dispatch_batch(TEXT, INT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_claim_notification_dispatch_batch(TEXT, INT, INT)
  TO service_role;

CREATE OR REPLACE FUNCTION rpc_service_complete_notification_dispatch(
  p_notification_id    UUID,
  p_worker_id          TEXT,
  p_outcome            TEXT,
  p_error_code         TEXT DEFAULT NULL,
  p_provider_attempted BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_worker TEXT;
  v_row    notification_outbox%ROWTYPE;
  v_outcome TEXT;
  v_attempts INT;
  v_max_attempts CONSTANT INT := 5;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_worker := NULLIF(btrim(p_worker_id), '');
  IF v_worker IS NULL THEN
    RAISE EXCEPTION 'invalid_worker_id';
  END IF;

  v_outcome := NULLIF(btrim(p_outcome), '');
  IF v_outcome IS NULL OR v_outcome NOT IN (
    'sent', 'retryable_failed', 'failed', 'manual_review'
  ) THEN
    RAISE EXCEPTION 'invalid_outcome';
  END IF;

  SELECT * INTO v_row
    FROM notification_outbox
   WHERE id = p_notification_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'notification_not_found';
  END IF;

  IF v_row.status = 'sent' THEN
    RETURN jsonb_build_object('ok', TRUE, 'idempotent', TRUE, 'status', 'sent');
  END IF;

  IF v_row.status <> 'processing' THEN
    RAISE EXCEPTION 'invalid_notification_status';
  END IF;

  IF v_row.claimed_by IS DISTINCT FROM v_worker
     AND (v_row.claim_expires_at IS NULL OR v_row.claim_expires_at >= NOW()) THEN
    RAISE EXCEPTION 'claim_owner_mismatch';
  END IF;

  v_attempts := v_row.attempts;
  IF p_provider_attempted THEN
    v_attempts := v_attempts + 1;
  END IF;

  IF v_outcome = 'sent' THEN
    UPDATE notification_outbox
       SET status = 'sent',
           sent_at = NOW(),
           attempts = v_attempts,
           last_error = NULL,
           last_error_code = NULL,
           claimed_at = NULL,
           claimed_by = NULL,
           claim_expires_at = NULL
     WHERE id = p_notification_id;

    RETURN jsonb_build_object(
      'ok', TRUE,
      'status', 'sent',
      'provider_idempotency_key', v_row.provider_idempotency_key
    );
  END IF;

  IF v_outcome = 'manual_review' THEN
    UPDATE notification_outbox
       SET status = 'manual_review',
           attempts = v_attempts,
           last_error = p_error_code,
           last_error_code = p_error_code,
           claimed_at = NULL,
           claimed_by = NULL,
           claim_expires_at = NULL
     WHERE id = p_notification_id;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'manual_review');
  END IF;

  IF v_outcome = 'failed' OR v_attempts >= v_max_attempts THEN
    UPDATE notification_outbox
       SET status = 'failed',
           attempts = v_attempts,
           last_error = p_error_code,
           last_error_code = p_error_code,
           claimed_at = NULL,
           claimed_by = NULL,
           claim_expires_at = NULL
     WHERE id = p_notification_id;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'failed', 'terminal', TRUE);
  END IF;

  UPDATE notification_outbox
     SET status = 'retryable_failed',
         attempts = v_attempts,
         last_error = p_error_code,
         last_error_code = p_error_code,
         claimed_at = NULL,
         claimed_by = NULL,
         claim_expires_at = NULL,
         next_attempt_at = NOW() + (
           POWER(2, LEAST(GREATEST(v_attempts, 1), 10)) * 30
         ) * INTERVAL '1 second'
   WHERE id = p_notification_id;

  RETURN jsonb_build_object('ok', TRUE, 'status', 'retryable_failed');
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_complete_notification_dispatch(UUID, TEXT, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_complete_notification_dispatch(UUID, TEXT, TEXT, TEXT, BOOLEAN)
  TO service_role;

-- ─── withdrawal broadcast single-flight claim ─────────────────────────────────
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'broadcasting';
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'broadcast_failed';

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS broadcast_claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS broadcast_claimed_by TEXT,
  ADD COLUMN IF NOT EXISTS broadcast_claim_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS broadcast_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS broadcast_idempotency_key TEXT;

CREATE OR REPLACE FUNCTION rpc_service_claim_withdrawal_broadcast_batch(
  p_worker_id          TEXT,
  p_batch_size         INT DEFAULT 20,
  p_claim_ttl_seconds  INT DEFAULT 600
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_worker TEXT;
  v_limit  INT;
  v_ttl    INT;
  v_row    withdrawal_requests%ROWTYPE;
  v_items  JSONB := '[]'::JSONB;
  v_count  INT := 0;
  v_idem   TEXT;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_worker := NULLIF(btrim(p_worker_id), '');
  IF v_worker IS NULL THEN
    RAISE EXCEPTION 'invalid_worker_id';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_batch_size, 20), 1), 50);
  v_ttl := GREATEST(COALESCE(p_claim_ttl_seconds, 600), 120);

  -- Release stale broadcasting claims back to approved (crash recovery, no attempt bump).
  UPDATE withdrawal_requests
     SET status = 'approved',
         broadcast_claimed_at = NULL,
         broadcast_claimed_by = NULL,
         broadcast_claim_expires_at = NULL
   WHERE status = 'broadcasting'
     AND broadcast_claim_expires_at IS NOT NULL
     AND broadcast_claim_expires_at < NOW()
     AND on_chain_tx_hash IS NULL;

  FOR v_row IN
    SELECT *
      FROM withdrawal_requests
     WHERE status = 'approved'
       AND on_chain_tx_hash IS NULL
       AND broadcast_attempts < 5
     ORDER BY created_at
     FOR UPDATE SKIP LOCKED
     LIMIT v_limit
  LOOP
    v_idem := format('withdrawal:broadcast:%s:%s', v_row.id, v_row.broadcast_attempts);

    UPDATE withdrawal_requests
       SET status = 'broadcasting',
           broadcast_claimed_at = NOW(),
           broadcast_claimed_by = v_worker,
           broadcast_claim_expires_at = NOW() + (v_ttl || ' seconds')::INTERVAL,
           broadcast_idempotency_key = v_idem
     WHERE id = v_row.id;

    v_items := v_items || jsonb_build_array(
      jsonb_build_object(
        'id', v_row.id,
        'amount', v_row.amount,
        'currency', v_row.currency,
        'destination', v_row.destination,
        'broadcast_attempts', v_row.broadcast_attempts,
        'broadcast_idempotency_key', v_idem
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'worker_id', v_worker,
    'claimed', v_count,
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_claim_withdrawal_broadcast_batch(TEXT, INT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_claim_withdrawal_broadcast_batch(TEXT, INT, INT)
  TO service_role;

CREATE OR REPLACE FUNCTION rpc_service_fail_withdrawal_broadcast(
  p_withdrawal_id UUID,
  p_worker_id     TEXT,
  p_error_code    TEXT DEFAULT 'broadcast_failed',
  p_retryable     BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_worker TEXT;
  v_row    withdrawal_requests%ROWTYPE;
  v_attempts INT;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_worker := NULLIF(btrim(p_worker_id), '');
  IF v_worker IS NULL THEN
    RAISE EXCEPTION 'invalid_worker_id';
  END IF;

  SELECT * INTO v_row
    FROM withdrawal_requests
   WHERE id = p_withdrawal_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'withdrawal_not_found';
  END IF;

  IF v_row.status = 'sent' AND v_row.on_chain_tx_hash IS NOT NULL THEN
    RETURN jsonb_build_object('ok', TRUE, 'idempotent', TRUE, 'status', 'sent');
  END IF;

  IF v_row.status <> 'broadcasting' THEN
    RAISE EXCEPTION 'invalid_withdrawal_status';
  END IF;

  IF v_row.broadcast_claimed_by IS DISTINCT FROM v_worker
     AND (v_row.broadcast_claim_expires_at IS NULL OR v_row.broadcast_claim_expires_at >= NOW()) THEN
    RAISE EXCEPTION 'claim_owner_mismatch';
  END IF;

  v_attempts := v_row.broadcast_attempts + 1;

  IF NOT p_retryable OR v_attempts >= 5 THEN
    UPDATE withdrawal_requests
       SET status = 'broadcast_failed',
           broadcast_attempts = v_attempts,
           broadcast_claimed_at = NULL,
           broadcast_claimed_by = NULL,
           broadcast_claim_expires_at = NULL,
           admin_note = COALESCE(admin_note, '') || ' [' || p_error_code || ']'
     WHERE id = p_withdrawal_id;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'broadcast_failed', 'terminal', TRUE);
  END IF;

  UPDATE withdrawal_requests
     SET status = 'approved',
         broadcast_attempts = v_attempts,
         broadcast_claimed_at = NULL,
         broadcast_claimed_by = NULL,
         broadcast_claim_expires_at = NULL,
         admin_note = COALESCE(admin_note, '') || ' [' || p_error_code || ']'
   WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object('ok', TRUE, 'status', 'approved', 'retryable', TRUE);
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_fail_withdrawal_broadcast(UUID, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_fail_withdrawal_broadcast(UUID, TEXT, TEXT, BOOLEAN)
  TO service_role;

-- Replace prior 3-arg mark RPC (broadcasting claim gate + optional worker match).
DROP FUNCTION IF EXISTS rpc_service_mark_withdrawal_broadcast(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION rpc_service_mark_withdrawal_broadcast(
  p_withdrawal_id UUID,
  p_tx_hash TEXT,
  p_reason TEXT DEFAULT 'on_chain_broadcast',
  p_worker_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_req withdrawal_requests%ROWTYPE;
  v_worker TEXT;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_tx_hash IS NULL OR btrim(p_tx_hash) = '' OR btrim(p_tx_hash) LIKE 'sim_%' THEN
    RAISE EXCEPTION 'invalid_tx_hash';
  END IF;

  v_worker := NULLIF(btrim(p_worker_id), '');

  SELECT * INTO v_req FROM withdrawal_requests WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'withdrawal_not_found'; END IF;

  IF v_req.status = 'sent' AND v_req.on_chain_tx_hash = p_tx_hash THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'idempotent', TRUE,
      'withdrawal_id', p_withdrawal_id,
      'tx_hash', p_tx_hash
    );
  END IF;

  IF v_req.on_chain_tx_hash IS NOT NULL AND v_req.on_chain_tx_hash <> p_tx_hash THEN
    RAISE EXCEPTION 'tx_hash_conflict';
  END IF;

  IF v_req.status <> 'broadcasting' THEN
    RAISE EXCEPTION 'invalid_withdrawal_status';
  END IF;

  IF v_worker IS NOT NULL
     AND v_req.broadcast_claimed_by IS DISTINCT FROM v_worker
     AND (v_req.broadcast_claim_expires_at IS NULL OR v_req.broadcast_claim_expires_at >= NOW()) THEN
    RAISE EXCEPTION 'claim_owner_mismatch';
  END IF;

  UPDATE withdrawal_requests
     SET status = 'sent',
         on_chain_tx_hash = p_tx_hash,
         broadcast_at = NOW(),
         sent_at = COALESCE(sent_at, NOW()),
         broadcast_claimed_at = NULL,
         broadcast_claimed_by = NULL,
         broadcast_claim_expires_at = NULL
   WHERE id = p_withdrawal_id;

  PERFORM _enqueue_notification(
    v_req.user_id, 'push', 'withdrawal_sent',
    jsonb_build_object(
      'withdrawal_id', p_withdrawal_id,
      'tx_hash', p_tx_hash,
      'amount', v_req.amount,
      'currency', v_req.currency
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'withdrawal_id', p_withdrawal_id, 'tx_hash', p_tx_hash);
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_mark_withdrawal_broadcast(UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_mark_withdrawal_broadcast(UUID, TEXT, TEXT, TEXT)
  TO service_role;

-- Close Phase 0 baseline drift: single legacy definer missing header search_path.
ALTER FUNCTION rpc_unlock_wallet(currency, TEXT, TEXT, TEXT, UUID)
  SET search_path = public, pg_temp;
