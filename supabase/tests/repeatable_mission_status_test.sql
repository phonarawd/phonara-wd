-- Repeatable mission status RPC — regression for 22P02 schema bugs in _repeatable_progress
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_status JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'repeatable_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  v_status := rpc_get_repeatable_mission_status('all');

  ASSERT COALESCE((v_status->>'ok')::BOOLEAN, FALSE) = TRUE,
    'rpc_get_repeatable_mission_status must return ok=true';
  ASSERT jsonb_typeof(v_status->'missions') = 'array',
    'missions payload must be a JSON array';
  ASSERT jsonb_array_length(v_status->'missions') = 13,
    'active repeatable missions must be enumerated (dead missions excluded)';

  RAISE NOTICE 'REPEATABLE MISSION STATUS OK — % missions', jsonb_array_length(v_status->'missions');
END;
$$;

ROLLBACK;
