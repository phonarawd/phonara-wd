-- Earn hub tier limits — roulette multi-spin + status RPC
BEGIN;

DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_status JSONB;
  v_spin JSONB;
  v_i INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'earn_hub_' || v_uid::TEXT || '@test.local', NOW(), NOW());

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  INSERT INTO user_consents (user_id, doc_type, doc_version, accepted)
  SELECT v_uid, doc_type::consent_doc_type, 'v1', TRUE
  FROM unnest(ARRAY['terms_of_service','privacy_policy','risk_disclosure','age_verification']) AS doc_type
  ON CONFLICT DO NOTHING;

  v_status := rpc_get_earn_hub_status();
  ASSERT (v_status->'roulette'->>'max')::INT = 1, 'bronze roulette max should be 1';
  ASSERT (v_status->'roulette'->>'remaining')::INT = 1, 'bronze roulette remaining should be 1';

  v_spin := rpc_spin_roulette();
  ASSERT (v_spin->>'already_spun')::BOOLEAN = FALSE, 'first spin should succeed';
  ASSERT (v_spin->>'remaining')::INT = 0, 'bronze should have 0 remaining after 1 spin';

  v_spin := rpc_spin_roulette();
  ASSERT COALESCE((v_spin->>'quota_exhausted')::BOOLEAN, FALSE) = TRUE, 'second spin should hit quota';

  INSERT INTO user_earn_vip (user_id, xp, tier) VALUES (v_uid, 30000, 'gold')
  ON CONFLICT (user_id) DO UPDATE SET tier = 'gold', xp = 30000;

  v_status := rpc_get_earn_hub_status();
  ASSERT (v_status->'roulette'->>'max')::INT = 2, 'gold roulette max should be 2';
  ASSERT (v_status->'limits_matrix'->>'current_tier_index')::INT = 2, 'gold tier index';

  RAISE NOTICE 'EARN HUB TIER LIMITS OK';
END;
$$;

ROLLBACK;
