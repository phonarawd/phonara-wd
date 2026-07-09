-- ============================================================
-- AML / malicious-user defense (free · self-hosted · no vendor)
-- ============================================================
-- Duplicate identity · velocity · cooling periods · structuring signals
-- User-readable status via rpc_get_compliance_status
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO app_config (key, value, description) VALUES
  ('aml_min_account_age_hours', '48', 'Min hours after signup before first withdrawal.'),
  ('aml_kyc_approval_cooldown_hours', '24', 'Min hours after KYC approval before withdrawal.'),
  ('aml_max_withdrawals_per_24h', '5', 'Max withdrawal requests per rolling 24h per user.'),
  ('aml_rapid_credit_hours', '6', 'Block withdrawal if first PHON credit was within this many hours.'),
  ('aml_structuring_threshold_pct', '90', 'Flag structuring when single withdraw > this % of daily cap.'),
  ('aml_structuring_min_count_7d', '3', 'Structuring signal when N large withdrawals in 7 days.')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS aml_identity_fingerprints (
  fingerprint_hash  TEXT PRIMARY KEY,
  user_id             UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  country             TEXT NOT NULL,
  document_last4      TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aml_fp_user_idx ON aml_identity_fingerprints (user_id);

CREATE TABLE IF NOT EXISTS aml_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'info'
    CONSTRAINT aml_events_severity_chk CHECK (severity IN ('info', 'warn', 'block')),
  detail      JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aml_events_user_created_idx
  ON aml_events (user_id, created_at DESC);

ALTER TABLE aml_identity_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aml_identity_fingerprints: admin rw" ON aml_identity_fingerprints;
CREATE POLICY "aml_identity_fingerprints: admin rw" ON aml_identity_fingerprints
  FOR ALL USING (_is_admin());

DROP POLICY IF EXISTS "aml_events: own read" ON aml_events;
CREATE POLICY "aml_events: own read" ON aml_events
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "aml_events: admin rw" ON aml_events;
CREATE POLICY "aml_events: admin rw" ON aml_events
  FOR ALL USING (_is_admin());

GRANT SELECT ON aml_events TO authenticated;

-- ─── Helpers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _aml_identity_fingerprint_hash(
  p_legal_name TEXT,
  p_document_last4 TEXT,
  p_country TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT encode(
    extensions.digest(
      lower(regexp_replace(btrim(COALESCE(p_legal_name, '')), '\s+', '', 'g'))
        || ':' || upper(btrim(COALESCE(p_document_last4, '')))
        || ':' || upper(btrim(COALESCE(p_country, ''))),
      'sha256'
    ),
    'hex'
  );
$$;

REVOKE ALL ON FUNCTION _aml_identity_fingerprint_hash(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _aml_log_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'info',
  p_detail JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO aml_events (user_id, event_type, severity, detail)
  VALUES (p_user_id, p_event_type, COALESCE(p_severity, 'info'), COALESCE(p_detail, '{}'::JSONB));
END;
$$;

REVOKE ALL ON FUNCTION _aml_log_event(UUID, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _aml_assert_identity_not_duplicate(
  p_user_id UUID,
  p_legal_name TEXT,
  p_document_last4 TEXT,
  p_country TEXT
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hash TEXT := _aml_identity_fingerprint_hash(p_legal_name, p_document_last4, p_country);
  v_other UUID;
BEGIN
  SELECT user_id INTO v_other
    FROM aml_identity_fingerprints
   WHERE fingerprint_hash = v_hash
     AND user_id <> p_user_id
   LIMIT 1;

  IF FOUND THEN
    PERFORM _aml_log_event(p_user_id, 'duplicate_identity_blocked', 'block',
      jsonb_build_object('fingerprint_hash', v_hash, 'linked_user', v_other));
    RAISE EXCEPTION 'aml_duplicate_identity';
  END IF;

  SELECT user_id INTO v_other
    FROM kyc_submissions
   WHERE user_id <> p_user_id
     AND status = 'approved'
     AND upper(document_last4) = upper(btrim(p_document_last4))
     AND upper(country) = upper(btrim(p_country))
   LIMIT 1;

  IF FOUND THEN
    PERFORM _aml_log_event(p_user_id, 'duplicate_document_blocked', 'block',
      jsonb_build_object('linked_user', v_other));
    RAISE EXCEPTION 'aml_duplicate_identity';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _aml_assert_identity_not_duplicate(UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _aml_register_identity_fingerprint(
  p_user_id UUID,
  p_legal_name TEXT,
  p_document_last4 TEXT,
  p_country TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hash TEXT := _aml_identity_fingerprint_hash(p_legal_name, p_document_last4, p_country);
BEGIN
  INSERT INTO aml_identity_fingerprints (fingerprint_hash, user_id, country, document_last4)
  VALUES (v_hash, p_user_id, upper(p_country), upper(p_document_last4))
  ON CONFLICT (fingerprint_hash) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM aml_identity_fingerprints WHERE user_id = p_user_id) THEN
    PERFORM _aml_log_event(p_user_id, 'identity_fingerprint_conflict', 'block',
      jsonb_build_object('fingerprint_hash', v_hash));
    RAISE EXCEPTION 'aml_duplicate_identity';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _aml_register_identity_fingerprint(UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _aml_first_phon_credit_at(p_user_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT MIN(created_at)
    FROM wallet_ledger
   WHERE user_id = p_user_id
     AND currency = 'PHON'
     AND direction = 'credit';
$$;

REVOKE ALL ON FUNCTION _aml_first_phon_credit_at(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _aml_assert_withdrawal_defense(
  p_user_id UUID,
  p_amount TEXT,
  p_currency currency
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_created       TIMESTAMPTZ;
  v_min_age_h     INT := COALESCE(_app_config_numeric('aml_min_account_age_hours', 48)::INT, 48);
  v_kyc_cool_h    INT := COALESCE(_app_config_numeric('aml_kyc_approval_cooldown_hours', 24)::INT, 24);
  v_max_wd_24h    INT := COALESCE(_app_config_numeric('aml_max_withdrawals_per_24h', 5)::INT, 5);
  v_rapid_h       INT := COALESCE(_app_config_numeric('aml_rapid_credit_hours', 6)::INT, 6);
  v_struct_pct    NUMERIC := COALESCE(_app_config_numeric('aml_structuring_threshold_pct', 90), 90);
  v_struct_cnt    INT := COALESCE(_app_config_numeric('aml_structuring_min_count_7d', 3)::INT, 3);
  v_kyc_reviewed  TIMESTAMPTZ;
  v_wd_count      INT;
  v_first_credit  TIMESTAMPTZ;
  v_amount        NUMERIC;
  v_daily_cap     NUMERIC;
  v_large_cnt     INT;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT created_at INTO v_created FROM profiles WHERE id = p_user_id;
  IF v_created IS NOT NULL AND v_created > NOW() - (v_min_age_h || ' hours')::INTERVAL THEN
    PERFORM _aml_log_event(p_user_id, 'withdraw_blocked_account_age', 'block',
      jsonb_build_object('min_hours', v_min_age_h));
    RAISE EXCEPTION 'aml_account_too_young';
  END IF;

  SELECT reviewed_at INTO v_kyc_reviewed
    FROM kyc_submissions
   WHERE user_id = p_user_id AND status = 'approved'
   ORDER BY reviewed_at DESC NULLS LAST
   LIMIT 1;

  IF v_kyc_reviewed IS NOT NULL
     AND v_kyc_reviewed > NOW() - (v_kyc_cool_h || ' hours')::INTERVAL THEN
    PERFORM _aml_log_event(p_user_id, 'withdraw_blocked_kyc_cooldown', 'block',
      jsonb_build_object('cooldown_hours', v_kyc_cool_h, 'approved_at', v_kyc_reviewed));
    RAISE EXCEPTION 'aml_kyc_cooldown';
  END IF;

  SELECT COUNT(*)::INT INTO v_wd_count
    FROM withdrawal_requests
   WHERE user_id = p_user_id
     AND status NOT IN ('rejected', 'cancelled')
     AND created_at >= NOW() - INTERVAL '24 hours';

  IF v_wd_count >= v_max_wd_24h THEN
    PERFORM _aml_log_event(p_user_id, 'withdraw_blocked_velocity', 'block',
      jsonb_build_object('count_24h', v_wd_count, 'max', v_max_wd_24h));
    RAISE EXCEPTION 'aml_withdrawal_velocity';
  END IF;

  v_first_credit := _aml_first_phon_credit_at(p_user_id);
  IF v_first_credit IS NOT NULL
     AND v_first_credit > NOW() - (v_rapid_h || ' hours')::INTERVAL THEN
    PERFORM _aml_log_event(p_user_id, 'withdraw_blocked_rapid_credit', 'block',
      jsonb_build_object('first_credit_at', v_first_credit, 'window_hours', v_rapid_h));
    RAISE EXCEPTION 'aml_rapid_withdraw_after_credit';
  END IF;

  v_amount := p_amount::NUMERIC;
  SELECT NULLIF(btrim(value), '')::NUMERIC INTO v_daily_cap
    FROM app_config WHERE key = 'withdrawal_daily_cap_per_user';

  IF v_daily_cap IS NOT NULL AND v_daily_cap > 0
     AND v_amount >= (v_daily_cap * v_struct_pct / 100) THEN
    SELECT COUNT(*)::INT INTO v_large_cnt
      FROM withdrawal_requests
     WHERE user_id = p_user_id
       AND currency = p_currency
       AND status NOT IN ('rejected', 'cancelled')
       AND created_at >= NOW() - INTERVAL '7 days'
       AND amount::NUMERIC >= (v_daily_cap * v_struct_pct / 100);

    IF v_large_cnt + 1 >= v_struct_cnt THEN
      INSERT INTO risk_flags (user_id, flag_type, details)
      SELECT p_user_id, 'aml_structuring_review',
        jsonb_build_object('count_7d', v_large_cnt + 1, 'threshold_pct', v_struct_pct)
       WHERE NOT EXISTS (
         SELECT 1 FROM risk_flags
          WHERE user_id = p_user_id AND flag_type = 'aml_structuring_review' AND status = 'active'
       );

      IF NOT EXISTS (
        SELECT 1 FROM str_cases
         WHERE user_id = p_user_id AND case_type = 'aml_structuring' AND status IN ('open', 'reviewing')
      ) THEN
        INSERT INTO str_cases (user_id, case_type, trigger_ref, details)
        VALUES (p_user_id, 'aml_structuring', 'withdrawal_request',
          jsonb_build_object('amount', p_amount, 'currency', p_currency));
      END IF;

      PERFORM _aml_log_event(p_user_id, 'withdraw_blocked_structuring', 'block',
        jsonb_build_object('large_count_7d', v_large_cnt + 1));
      RAISE EXCEPTION 'aml_structuring_blocked';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _aml_assert_withdrawal_defense(UUID, TEXT, currency)
  FROM PUBLIC, anon, authenticated;

-- ─── User-readable compliance status ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_get_compliance_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid             UUID := auth.uid();
  v_tier            kyc_tier;
  v_kyc_status      TEXT;
  v_sanctions       TEXT;
  v_frozen          BOOLEAN;
  v_created         TIMESTAMPTZ;
  v_kyc_reviewed    TIMESTAMPTZ;
  v_min_age_h       INT := COALESCE(_app_config_numeric('aml_min_account_age_hours', 48)::INT, 48);
  v_kyc_cool_h      INT := COALESCE(_app_config_numeric('aml_kyc_approval_cooldown_hours', 24)::INT, 24);
  v_account_ok      BOOLEAN;
  v_kyc_submit_ok   BOOLEAN;
  v_kyc_review_ok   BOOLEAN;
  v_sanctions_ok    BOOLEAN;
  v_withdraw_ready  BOOLEAN := FALSE;
  v_blocks          JSONB := '[]'::JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT kyc_tier, COALESCE(activity_frozen, FALSE), created_at
    INTO v_tier, v_frozen, v_created
    FROM profiles WHERE id = v_uid;

  SELECT status INTO v_kyc_status
    FROM kyc_submissions
   WHERE user_id = v_uid
   ORDER BY created_at DESC
   LIMIT 1;

  SELECT status INTO v_sanctions
    FROM sanctions_screenings
   WHERE user_id = v_uid
   ORDER BY screened_at DESC
   LIMIT 1;

  SELECT reviewed_at INTO v_kyc_reviewed
    FROM kyc_submissions
   WHERE user_id = v_uid AND status = 'approved'
   ORDER BY reviewed_at DESC NULLS LAST
   LIMIT 1;

  v_account_ok := v_created IS NOT NULL AND v_created <= NOW() - (v_min_age_h || ' hours')::INTERVAL;
  v_kyc_submit_ok := v_kyc_status IN ('submitted', 'reviewing', 'approved');
  v_kyc_review_ok := v_tier = 'id_verified'::kyc_tier;
  v_sanctions_ok := v_sanctions = 'clear';

  IF NOT v_account_ok AND v_created IS NOT NULL THEN
    v_blocks := v_blocks || jsonb_build_array(jsonb_build_object(
      'code', 'aml_account_too_young',
      'until', to_jsonb(v_created + (v_min_age_h || ' hours')::INTERVAL)
    ));
  END IF;

  IF v_kyc_review_ok AND v_kyc_reviewed IS NOT NULL
     AND v_kyc_reviewed > NOW() - (v_kyc_cool_h || ' hours')::INTERVAL THEN
    v_blocks := v_blocks || jsonb_build_array(jsonb_build_object(
      'code', 'aml_kyc_cooldown',
      'until', to_jsonb(v_kyc_reviewed + (v_kyc_cool_h || ' hours')::INTERVAL)
    ));
  END IF;

  IF v_frozen THEN
    v_blocks := v_blocks || jsonb_build_array(jsonb_build_object('code', 'account_activity_frozen'));
  ELSIF v_sanctions = 'pending' THEN
    v_blocks := v_blocks || jsonb_build_array(jsonb_build_object('code', 'sanctions_pending'));
  ELSIF v_sanctions = 'hit' THEN
    v_blocks := v_blocks || jsonb_build_array(jsonb_build_object('code', 'sanctions_blocked'));
  END IF;

  v_withdraw_ready := v_kyc_review_ok AND v_sanctions_ok AND NOT v_frozen
    AND v_account_ok
    AND (v_kyc_reviewed IS NULL OR v_kyc_reviewed <= NOW() - (v_kyc_cool_h || ' hours')::INTERVAL);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'kyc_tier', v_tier,
    'kyc_status', v_kyc_status,
    'sanctions_status', v_sanctions,
    'activity_frozen', v_frozen,
    'withdrawal_ready', v_withdraw_ready,
    'steps', jsonb_build_object(
      'account', v_account_ok OR v_tier = 'id_verified',
      'kyc_submit', v_kyc_submit_ok,
      'kyc_review', v_kyc_review_ok,
      'sanctions', v_sanctions_ok,
      'withdraw', v_withdraw_ready
    ),
    'blocks', v_blocks
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_compliance_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_get_compliance_status() TO authenticated;

-- ─── Patch KYC submit ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_submit_kyc(
  p_payload JSONB,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_submission kyc_submissions%ROWTYPE;
  v_legal_name TEXT := btrim(COALESCE(p_payload->>'legal_name', ''));
  v_document_type TEXT := btrim(COALESCE(p_payload->>'document_type', ''));
  v_document_last4 TEXT := upper(btrim(COALESCE(p_payload->>'document_last4', '')));
  v_country TEXT := upper(btrim(COALESCE(p_payload->>'country', '')));
  v_sla_hours NUMERIC := _app_config_numeric('kyc_review_sla_hours', 24);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;
  IF length(v_legal_name) < 2 THEN RAISE EXCEPTION 'invalid_kyc_legal_name'; END IF;
  IF v_document_type NOT IN ('id_card', 'passport', 'driver_license') THEN
    RAISE EXCEPTION 'invalid_kyc_document_type';
  END IF;
  IF v_document_last4 !~ '^[A-Z0-9]{4}$' THEN RAISE EXCEPTION 'invalid_kyc_document_last4'; END IF;
  IF v_country !~ '^[A-Z]{2}$' THEN RAISE EXCEPTION 'invalid_kyc_country'; END IF;

  PERFORM _aml_assert_identity_not_duplicate(v_uid, v_legal_name, v_document_last4, v_country);
  PERFORM _ensure_kyc_sanctions_screening_pending(v_uid, 'kyc_submission');

  SELECT * INTO v_submission
    FROM kyc_submissions
   WHERE user_id = v_uid
     AND status IN ('submitted', 'reviewing', 'approved')
   ORDER BY created_at DESC
   LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'submission_id', v_submission.id,
      'status', v_submission.status,
      'idempotent', TRUE
    );
  END IF;

  INSERT INTO kyc_submissions (
    user_id, legal_name, document_type, document_last4, country, idempotency_key
  )
  VALUES (
    v_uid, v_legal_name, v_document_type, v_document_last4, v_country, btrim(p_idempotency_key)
  )
  RETURNING * INTO v_submission;

  PERFORM _aml_log_event(v_uid, 'kyc_submitted', 'info',
    jsonb_build_object('submission_id', v_submission.id, 'country', v_country));

  INSERT INTO admin_review_queue (
    queue_type, entity_type, entity_id, user_id, reason, sla_due_at, payload
  )
  VALUES (
    'kyc_review',
    'kyc_submission',
    v_submission.id,
    v_uid,
    'kyc_submitted',
    NOW() + make_interval(hours => v_sla_hours::INT),
    jsonb_build_object(
      'legal_name_masked', _mask_kyc_name(v_legal_name),
      'document_type', v_document_type,
      'document_last4_masked', '****',
      'country', v_country
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'submission_id', v_submission.id, 'status', v_submission.status);
END;
$$;

REVOKE ALL ON FUNCTION rpc_submit_kyc(JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_submit_kyc(JSONB, TEXT) TO authenticated;

-- ─── Patch KYC review (fingerprint on approve) ───────────────────────────────
CREATE OR REPLACE FUNCTION rpc_review_kyc_submission(
  p_submission_id UUID,
  p_status TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_submission kyc_submissions%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT _is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;
  IF p_status NOT IN ('reviewing', 'approved', 'rejected') THEN RAISE EXCEPTION 'invalid_kyc_status'; END IF;

  SELECT * INTO v_submission FROM kyc_submissions WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'kyc_submission_not_found'; END IF;

  IF v_submission.status IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object('ok', TRUE, 'submission_id', p_submission_id, 'status', v_submission.status, 'idempotent', TRUE);
  END IF;

  IF p_status = 'approved' THEN
    PERFORM _aml_assert_identity_not_duplicate(
      v_submission.user_id, v_submission.legal_name, v_submission.document_last4, v_submission.country
    );
  END IF;

  UPDATE kyc_submissions
     SET status = p_status,
         reviewed_at = CASE WHEN p_status IN ('approved', 'rejected') THEN NOW() ELSE reviewed_at END,
         reviewed_by = CASE WHEN p_status IN ('approved', 'rejected') THEN v_actor ELSE reviewed_by END,
         rejection_reason = CASE WHEN p_status = 'rejected' THEN btrim(p_reason) ELSE NULL END
   WHERE id = p_submission_id
   RETURNING * INTO v_submission;

  IF p_status = 'approved' THEN
    PERFORM _aml_register_identity_fingerprint(
      v_submission.user_id, v_submission.legal_name, v_submission.document_last4, v_submission.country
    );
    UPDATE profiles
       SET kyc_tier = 'id_verified',
           legal_name = v_submission.legal_name
     WHERE id = v_submission.user_id;
  END IF;

  UPDATE admin_review_queue
     SET status = CASE WHEN p_status = 'reviewing' THEN 'in_review' ELSE 'resolved' END,
         resolved_at = CASE WHEN p_status = 'reviewing' THEN resolved_at ELSE NOW() END,
         resolved_by = CASE WHEN p_status = 'reviewing' THEN resolved_by ELSE v_actor END
   WHERE entity_type = 'kyc_submission'
     AND entity_id = p_submission_id
     AND status IN ('pending', 'in_review');

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    v_actor,
    'kyc_submission_' || p_status,
    'kyc_submission',
    p_submission_id,
    jsonb_build_object(
      'reason', p_reason,
      'user_id', v_submission.user_id,
      'status', p_status
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'submission_id', p_submission_id, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION rpc_review_kyc_submission(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_review_kyc_submission(UUID, TEXT, TEXT) TO authenticated;

-- ─── Patch withdrawal (AML defense) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_request_withdrawal(
  p_currency TEXT,
  p_amount TEXT,
  p_destination JSONB,
  p_idempotency_key TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_ccy     currency;
  v_wallet  wallets%ROWTYPE;
  v_wr_id   UUID;
  v_lock_id UUID;
  v_cap     TEXT;
  v_today   NUMERIC;
  v_amount  NUMERIC;
  v_chain   TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('withdrawal');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);

  BEGIN
    v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_currency';
  END;

  PERFORM _assert_amount_text(p_amount);

  IF v_ccy = 'USDT' THEN
    v_chain := COALESCE(p_destination->>'chain', '');
    IF v_chain NOT IN ('TRC20', 'ERC20') THEN
      RAISE EXCEPTION 'invalid_chain';
    END IF;
    IF COALESCE(length(btrim(p_destination->>'address')), 0) < 10 THEN
      RAISE EXCEPTION 'invalid_destination';
    END IF;
  END IF;

  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  PERFORM _assert_kyc_withdrawal_gate(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);
  PERFORM _aml_assert_withdrawal_defense(v_user_id, p_amount, v_ccy);
  PERFORM _assert_solvency_withdrawal_gate(v_ccy);

  SELECT value INTO v_cap
    FROM app_config
   WHERE key = 'withdrawal_daily_cap_per_user';

  IF v_cap IS NOT NULL AND length(btrim(v_cap)) > 0 THEN
    PERFORM _assert_amount_text(v_cap);
    v_amount := p_amount::NUMERIC;
    SELECT COALESCE(SUM(amount::NUMERIC), 0) INTO v_today
      FROM withdrawal_requests
     WHERE user_id = v_user_id
       AND currency = v_ccy
       AND status NOT IN ('rejected', 'cancelled')
       AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC');
    IF v_today + v_amount > v_cap::NUMERIC THEN
      RAISE EXCEPTION 'ERR_WITHDRAWAL_DAILY_CAP';
    END IF;
  END IF;

  SELECT id INTO v_wr_id FROM withdrawal_requests
   WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', TRUE, 'withdrawal_id', v_wr_id, 'idempotent', TRUE);
  END IF;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_request_withdrawal')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  v_wr_id := gen_random_uuid();
  v_lock_id := rpc_lock_wallet(
    v_ccy, p_amount, 'withdrawal_request_lock',
    'wd_lock:' || v_user_id::TEXT || ':' || p_idempotency_key,
    v_wr_id
  );

  INSERT INTO withdrawal_requests (
    id, user_id, wallet_id, currency, amount, destination, status,
    idempotency_key, client_request_id, ledger_lock_id
  ) VALUES (
    v_wr_id, v_user_id, v_wallet.id, v_ccy, p_amount, COALESCE(p_destination, '{}'::JSONB),
    'pending', p_idempotency_key, p_client_request_id, v_lock_id
  );

  PERFORM _aml_log_event(v_user_id, 'withdrawal_requested', 'info',
    jsonb_build_object('withdrawal_id', v_wr_id, 'amount', p_amount, 'currency', v_ccy));

  RETURN jsonb_build_object('ok', TRUE, 'withdrawal_id', v_wr_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_request_withdrawal(TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;
