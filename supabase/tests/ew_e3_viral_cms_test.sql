-- E3 Viral+CMS — leaderboard · CMS targeting/schedule · viral analytics
BEGIN;

-- E3-0: CMS targeting columns exist
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cms_content' AND column_name = 'audience'
  ), 'cms_content.audience missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cms_content' AND column_name = 'min_tier'
  ), 'cms_content.min_tier missing';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cms_content' AND column_name = 'schedule_publish_at'
  ), 'cms_content.schedule_publish_at missing';
  RAISE NOTICE 'E3-0 OK — cms targeting columns';
END;
$$;

-- E3-1: leaderboard ranks by qualified+paid count · masks name · self row
DO $$
DECLARE
  v_a UUID := gen_random_uuid();
  v_b UUID := gen_random_uuid();
  v_c UUID := gen_random_uuid();
  v_d UUID := gen_random_uuid();
  v_e UUID := gen_random_uuid();
  v_res JSONB;
  v_rank1 INT;
  v_count1 INT;
  v_name TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_a, 'authenticated', 'authenticated', 'e3_a_' || v_a::TEXT || '@t.local', NOW(), NOW()),
    (v_b, 'authenticated', 'authenticated', 'e3_b_' || v_b::TEXT || '@t.local', NOW(), NOW()),
    (v_c, 'authenticated', 'authenticated', 'e3_c_' || v_c::TEXT || '@t.local', NOW(), NOW()),
    (v_d, 'authenticated', 'authenticated', 'e3_d_' || v_d::TEXT || '@t.local', NOW(), NOW()),
    (v_e, 'authenticated', 'authenticated', 'e3_e_' || v_e::TEXT || '@t.local', NOW(), NOW());

  UPDATE profiles SET username = 'aliceeee', display_name = 'Alice Top' WHERE id = v_a;
  UPDATE profiles SET username = 'bobbbbbb', display_name = 'Bob Mid' WHERE id = v_b;

  -- A: 2 qualified · B: 1 paid · C: registered only (ignored)
  INSERT INTO referrals (referrer_id, referred_id, state, qualified_at)
  VALUES
    (v_a, v_c, 'qualified', NOW()),
    (v_a, v_d, 'paid', NOW()),
    (v_b, v_e, 'paid', NOW());

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_a::TEXT, 'aal', 'aal1')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_res := rpc_get_affiliate_rank_leaderboard(50, 'all_time');
  ASSERT (v_res->>'ok')::BOOLEAN, 'leaderboard ok';
  ASSERT jsonb_array_length(v_res->'entries') >= 2, 'expected >=2 entries';

  v_rank1 := (v_res->'entries'->0->>'rank')::INT;
  v_count1 := (v_res->'entries'->0->>'qualified_count')::INT;
  v_name := v_res->'entries'->0->>'display_name';
  ASSERT v_rank1 = 1, format('rank1 expected 1 got %s', v_rank1);
  ASSERT v_count1 = 2, format('count1 expected 2 got %s', v_count1);
  ASSERT v_name LIKE '%***%', format('name must be masked: %s', v_name);
  ASSERT (v_res->'self'->>'rank')::INT = 1, 'self rank must be 1';
  ASSERT (v_res->'self'->>'qualified_count')::INT = 2, 'self count must be 2';

  RESET ROLE;
  RAISE NOTICE 'E3-1 OK — leaderboard rank';
END;
$$;

-- E3-2: anon cannot call leaderboard
DO $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM rpc_get_affiliate_rank_leaderboard(10, 'all_time');
    RAISE EXCEPTION 'anon leaderboard must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%UNAUTHORIZED%' AND SQLERRM NOT LIKE '%permission denied%' THEN
        RAISE;
      END IF;
  END;
  RESET ROLE;
  RAISE NOTICE 'E3-2 OK — leaderboard anon deny';
END;
$$;

-- E3-3: CMS upsert targeting + schedule publish
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_res JSONB;
  v_status TEXT;
  v_audience TEXT;
  v_pub JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_admin, 'authenticated', 'authenticated', 'e3_cms_' || v_admin::TEXT || '@t.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM rpc_admin_upsert_cms_content(jsonb_build_object(
      'content_key', 'e3-promo-bad-tier',
      'kind', 'promo',
      'locale', 'ko',
      'status', 'draft',
      'title', 'Bad tier',
      'min_tier', 'gold',
      'max_tier', 'bronze'
    ));
    RAISE EXCEPTION 'invalid tier range must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%cms_tier_range_invalid%' THEN
        RAISE;
      END IF;
  END;

  v_res := rpc_admin_upsert_cms_content(jsonb_build_object(
    'content_key', 'e3-promo-sched',
    'kind', 'promo',
    'locale', 'ko',
    'surface', 'home',
    'status', 'scheduled',
    'title', 'Scheduled promo',
    'headline', 'E3 test',
    'priority', 10,
    'audience', 'authenticated',
    'min_tier', 'bronze',
    'max_tier', 'gold',
    'schedule_publish_at', (NOW() - INTERVAL '1 minute')::TEXT
  ));
  ASSERT (v_res->>'ok')::BOOLEAN, 'cms upsert ok';

  SELECT status::TEXT, audience INTO v_status, v_audience
    FROM cms_content
   WHERE content_key = 'e3-promo-sched' AND kind = 'promo' AND locale = 'ko';
  ASSERT v_status = 'scheduled', format('expected scheduled got %s', v_status);
  ASSERT v_audience = 'authenticated', format('expected authenticated got %s', v_audience);

  -- service path (no jwt) — postgres role in SQL tests
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  v_pub := rpc_run_cms_publish_scheduled(NOW());
  ASSERT (v_pub->>'ok')::BOOLEAN, 'publish scheduled ok';
  ASSERT (v_pub->>'published_count')::INT >= 1, 'must publish at least 1';

  SELECT status::TEXT INTO v_status
    FROM cms_content
   WHERE content_key = 'e3-promo-sched' AND kind = 'promo' AND locale = 'ko';
  ASSERT v_status = 'published', format('expected published got %s', v_status);

  RAISE NOTICE 'E3-3 OK — cms targeting + schedule';
END;
$$;

-- E3-4: viral analytics admin only
DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_user UUID := gen_random_uuid();
  v_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'e3_va_' || v_admin::TEXT || '@t.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'e3_vu_' || v_user::TEXT || '@t.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    TRUE
  );
  SET LOCAL ROLE authenticated;

  v_res := rpc_admin_get_viral_analytics();
  ASSERT (v_res->>'ok')::BOOLEAN, 'analytics ok';
  ASSERT v_res ? 'referrals', 'referrals key';
  ASSERT v_res ? 'viral_missions', 'viral_missions key';
  ASSERT v_res ? 'leaderboard_preview', 'leaderboard_preview key';
  ASSERT (v_res->>'share_events_available')::BOOLEAN = FALSE, 'share events still gap';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user::TEXT, 'aal', 'aal1')::TEXT,
    TRUE
  );
  BEGIN
    PERFORM rpc_admin_get_viral_analytics();
    RAISE EXCEPTION 'user analytics must FORBIDDEN';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%FORBIDDEN%' THEN
        RAISE;
      END IF;
  END;

  RESET ROLE;
  RAISE NOTICE 'E3-4 OK — viral analytics authz';
END;
$$;

ROLLBACK;
