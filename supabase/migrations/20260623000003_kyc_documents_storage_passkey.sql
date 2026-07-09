-- ============================================================
-- KYC document storage (private bucket) + photo paths on submissions
-- ============================================================

SET search_path = public, pg_temp, storage;

INSERT INTO app_config (key, value, description) VALUES
  ('kyc_documents_required', 'true', 'Require id-front, id-back, selfie storage paths on KYC submit.')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE kyc_submissions
  ADD COLUMN IF NOT EXISTS document_front_path TEXT,
  ADD COLUMN IF NOT EXISTS document_back_path TEXT,
  ADD COLUMN IF NOT EXISTS selfie_path TEXT,
  ADD COLUMN IF NOT EXISTS documents_uploaded_at TIMESTAMPTZ;

ALTER TABLE kyc_submissions
  DROP CONSTRAINT IF EXISTS kyc_submissions_front_path_chk;
ALTER TABLE kyc_submissions
  ADD CONSTRAINT kyc_submissions_front_path_chk
  CHECK (document_front_path IS NULL OR document_front_path ~ '^[0-9a-f-]{36}/id-front\.(jpg|jpeg|png|webp)$');

ALTER TABLE kyc_submissions
  DROP CONSTRAINT IF EXISTS kyc_submissions_back_path_chk;
ALTER TABLE kyc_submissions
  ADD CONSTRAINT kyc_submissions_back_path_chk
  CHECK (document_back_path IS NULL OR document_back_path ~ '^[0-9a-f-]{36}/id-back\.(jpg|jpeg|png|webp)$');

ALTER TABLE kyc_submissions
  DROP CONSTRAINT IF EXISTS kyc_submissions_selfie_path_chk;
ALTER TABLE kyc_submissions
  ADD CONSTRAINT kyc_submissions_selfie_path_chk
  CHECK (selfie_path IS NULL OR selfie_path ~ '^[0-9a-f-]{36}/selfie\.(jpg|jpeg|png|webp)$');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "kyc_documents_insert_own" ON storage.objects;
CREATE POLICY "kyc_documents_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND name ~ ('^' || auth.uid()::TEXT || '/(id-front|id-back|selfie)\.(jpg|jpeg|png|webp)$')
  );

DROP POLICY IF EXISTS "kyc_documents_update_own" ON storage.objects;
CREATE POLICY "kyc_documents_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "kyc_documents_select_own" ON storage.objects;
CREATE POLICY "kyc_documents_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR _is_admin()
    )
  );

CREATE OR REPLACE FUNCTION _assert_kyc_document_paths_owned(
  p_user_id UUID,
  p_front TEXT,
  p_back TEXT,
  p_selfie TEXT
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp, storage
AS $$
DECLARE
  v_uid TEXT := p_user_id::TEXT;
  v_found INT;
BEGIN
  IF p_front IS NULL OR p_back IS NULL OR p_selfie IS NULL THEN
    RAISE EXCEPTION 'kyc_documents_missing';
  END IF;

  IF p_front !~ ('^' || v_uid || '/id-front\.(jpg|jpeg|png|webp)$')
     OR p_back !~ ('^' || v_uid || '/id-back\.(jpg|jpeg|png|webp)$')
     OR p_selfie !~ ('^' || v_uid || '/selfie\.(jpg|jpeg|png|webp)$') THEN
    RAISE EXCEPTION 'kyc_document_path_invalid';
  END IF;

  SELECT COUNT(*)::INT INTO v_found
    FROM storage.objects
   WHERE bucket_id = 'kyc-documents'
     AND name IN (p_front, p_back, p_selfie)
     AND (storage.foldername(name))[1] = v_uid;

  IF v_found <> 3 THEN
    RAISE EXCEPTION 'kyc_documents_not_uploaded';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_kyc_document_paths_owned(UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_submit_kyc(
  p_payload JSONB,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp, storage
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_submission kyc_submissions%ROWTYPE;
  v_legal_name TEXT := btrim(COALESCE(p_payload->>'legal_name', ''));
  v_document_type TEXT := btrim(COALESCE(p_payload->>'document_type', ''));
  v_document_last4 TEXT := upper(btrim(COALESCE(p_payload->>'document_last4', '')));
  v_country TEXT := upper(btrim(COALESCE(p_payload->>'country', '')));
  v_front TEXT := btrim(COALESCE(p_payload->>'document_front_path', ''));
  v_back TEXT := btrim(COALESCE(p_payload->>'document_back_path', ''));
  v_selfie TEXT := btrim(COALESCE(p_payload->>'selfie_path', ''));
  v_docs_required BOOLEAN := COALESCE(_app_config_numeric('kyc_documents_required', 1), 1) >= 1;
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

  IF v_docs_required THEN
    PERFORM _assert_kyc_document_paths_owned(v_uid, v_front, v_back, v_selfie);
  END IF;

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
    user_id, legal_name, document_type, document_last4, country, idempotency_key,
    document_front_path, document_back_path, selfie_path, documents_uploaded_at
  )
  VALUES (
    v_uid, v_legal_name, v_document_type, v_document_last4, v_country, btrim(p_idempotency_key),
    NULLIF(v_front, ''), NULLIF(v_back, ''), NULLIF(v_selfie, ''),
    CASE WHEN v_docs_required THEN NOW() ELSE NULL END
  )
  RETURNING * INTO v_submission;

  PERFORM _aml_log_event(v_uid, 'kyc_submitted', 'info',
    jsonb_build_object(
      'submission_id', v_submission.id,
      'country', v_country,
      'has_documents', v_docs_required
    ));

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
      'country', v_country,
      'has_documents', v_docs_required,
      'document_front_path', v_submission.document_front_path,
      'document_back_path', v_submission.document_back_path,
      'selfie_path', v_submission.selfie_path
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'submission_id', v_submission.id, 'status', v_submission.status);
END;
$$;

REVOKE ALL ON FUNCTION rpc_submit_kyc(JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_submit_kyc(JSONB, TEXT) TO authenticated;
