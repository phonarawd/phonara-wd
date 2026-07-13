-- E2 Mission Catalog — list · upsert · forbid ad/survey · claim gate
BEGIN;

-- E2-0: catalog seed present (11 allowlist rows)
DO $$
DECLARE
  v_cnt INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_cnt FROM mission_catalog;
  ASSERT v_cnt >= 11, format('expected >=11 catalog rows, got %s', v_cnt);
  ASSERT EXISTS (
    SELECT 1 FROM mission_catalog WHERE catalog_key = 'viral:share_referral_link'
  ), 'share_referral_link must be seeded';
  ASSERT EXISTS (
    SELECT 1 FROM mission_catalog WHERE catalog_key = 'earn:referral_qualified_reward_phon'
  ), 'earn limit key must be seeded';
  RAISE NOTICE 'E2-0 OK — seed';
END;
$$;

-- E2-1: admin list returns values; user cannot list
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_cnt INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'e2_admin_' || v_admin::TEXT || '@t.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'e2_user_' || v_user::TEXT || '@t.local', NOW(), NOW());

  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  SELECT COUNT(*)::INT INTO v_cnt FROM rpc_admin_list_mission_catalog();
  ASSERT v_cnt >= 11, format('admin list must return catalog, got %s', v_cnt);

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'aal', 'aal1')::TEXT,
    TRUE
  );
  BEGIN
    SELECT COUNT(*)::INT INTO v_cnt FROM rpc_admin_list_mission_catalog();
    RAISE EXCEPTION 'user list must FORBIDDEN';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%FORBIDDEN%' THEN
        RAISE;
      END IF;
  END;

  RAISE NOTICE 'E2-1 OK — list authz';
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
END;
$$;

-- E2-2: upsert reward + exposure · audit · reason required
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_res JSONB;
  v_val TEXT;
  v_exp TEXT;
  v_audit INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_admin, 'authenticated', 'authenticated', 'e2_up_' || v_admin::TEXT || '@t.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_admin_upsert_mission_catalog(jsonb_build_object(
      'catalog_key', 'viral:share_referral_link',
      'value', '42',
      'reason', 'x'
    ));
    RAISE EXCEPTION 'short reason must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%mission_catalog_reason_required%' THEN
        RAISE;
      END IF;
  END;

  v_res := rpc_admin_upsert_mission_catalog(jsonb_build_object(
    'catalog_key', 'viral:share_referral_link',
    'value', '42',
    'quota_value', '7',
    'exposure', 'hidden',
    'reason', 'closed beta tune share reward'
  ));
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('upsert must ok, got %s', v_res);

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);

  SELECT value INTO v_val FROM app_config WHERE key = 'viral_share_referral_link_reward_phon';
  ASSERT v_val = '42', format('reward must update to 42, got %s', v_val);
  SELECT value INTO v_val FROM app_config WHERE key = 'viral_share_referral_link_max_per_day';
  ASSERT v_val = '7', format('quota must update to 7, got %s', v_val);
  SELECT exposure INTO v_exp FROM mission_catalog WHERE catalog_key = 'viral:share_referral_link';
  ASSERT v_exp = 'hidden', format('exposure must be hidden, got %s', v_exp);

  SELECT COUNT(*)::INT INTO v_audit FROM audit_logs
   WHERE action = 'mission_catalog_upsert'
     AND actor_id = v_admin;
  ASSERT v_audit >= 1, format('expected audit row, got %s', v_audit);

  RAISE NOTICE 'E2-2 OK — upsert + audit';
END;
$$;

-- E2-3: forbid ad/survey catalog keys
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_admin, 'authenticated', 'authenticated', 'e2_forbid_' || v_admin::TEXT || '@t.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_admin_upsert_mission_catalog(jsonb_build_object(
      'catalog_key', 'viral:ad_watch_mission',
      'value', '1',
      'reason', 'try inject ad mission'
    ));
    RAISE EXCEPTION 'ad mission must be forbidden';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%mission_catalog_forbidden%'
         AND SQLERRM NOT LIKE '%mission_catalog_unknown_key%' THEN
        RAISE;
      END IF;
  END;

  BEGIN
    PERFORM rpc_admin_upsert_mission_catalog(jsonb_build_object(
      'catalog_key', 'viral:survey_mission',
      'value', '1',
      'reason', 'try inject survey'
    ));
    RAISE EXCEPTION 'survey mission must be forbidden';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%mission_catalog_forbidden%'
         AND SQLERRM NOT LIKE '%mission_catalog_unknown_key%' THEN
        RAISE;
      END IF;
  END;

  RAISE NOTICE 'E2-3 OK — ad/survey forbidden';
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
END;
$$;

-- E2-4: hidden / disabled catalog blocks claim helper
DO $$
BEGIN
  UPDATE mission_catalog
     SET exposure = 'hidden', enabled = TRUE
   WHERE catalog_key = 'viral:share_referral_link';

  BEGIN
    PERFORM _assert_mission_catalog_claimable('share_referral_link'::viral_mission_code);
    RAISE EXCEPTION 'hidden must raise mission_hidden';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%mission_hidden%' THEN
        RAISE;
      END IF;
  END;

  UPDATE mission_catalog
     SET exposure = 'live', enabled = FALSE
   WHERE catalog_key = 'viral:invite_friend_signup';

  BEGIN
    PERFORM _assert_mission_catalog_claimable('invite_friend_signup'::viral_mission_code);
    RAISE EXCEPTION 'disabled must raise mission_disabled';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%mission_disabled%' THEN
        RAISE;
      END IF;
  END;

  RAISE NOTICE 'E2-4 OK — hidden/disabled claim gate';
END;
$$;

ROLLBACK;
