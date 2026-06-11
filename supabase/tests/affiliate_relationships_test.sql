-- ============================================================
-- Affiliate relationships — SQL integration tests
-- ============================================================
-- Referrals remain the one-time welcome/mission reward path. Affiliate
-- relationships are a separate two-level commission graph.
-- ============================================================

-- ── 1. DB constraints reject self, cycles, and depth > 2 ─────────────────────
BEGIN;
DO $$
DECLARE
  v_a UUID := gen_random_uuid();
  v_b UUID := gen_random_uuid();
  v_c UUID := gen_random_uuid();
  v_d UUID := gen_random_uuid();
  v_msg TEXT;
  v_self_blocked BOOLEAN := FALSE;
  v_cycle_blocked BOOLEAN := FALSE;
  v_depth_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_a, 'authenticated', 'authenticated', 'aff_a_' || v_a::TEXT || '@test.local', NOW(), NOW()),
    (v_b, 'authenticated', 'authenticated', 'aff_b_' || v_b::TEXT || '@test.local', NOW(), NOW()),
    (v_c, 'authenticated', 'authenticated', 'aff_c_' || v_c::TEXT || '@test.local', NOW(), NOW()),
    (v_d, 'authenticated', 'authenticated', 'aff_d_' || v_d::TEXT || '@test.local', NOW(), NOW());

  BEGIN
    INSERT INTO affiliate_relationships (child_id, parent_id) VALUES (v_a, v_a);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'affiliate_self_forbidden' THEN v_self_blocked := TRUE; END IF;
  END;
  ASSERT v_self_blocked, format('self affiliate relationship must be rejected, got %s', COALESCE(v_msg, '<none>'));

  INSERT INTO affiliate_relationships (child_id, parent_id) VALUES (v_a, v_b);
  BEGIN
    INSERT INTO affiliate_relationships (child_id, parent_id) VALUES (v_b, v_a);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'affiliate_cycle_forbidden' THEN v_cycle_blocked := TRUE; END IF;
  END;
  ASSERT v_cycle_blocked, format('A->B->A affiliate cycle must be rejected, got %s', COALESCE(v_msg, '<none>'));

  DELETE FROM affiliate_relationships;
  INSERT INTO affiliate_relationships (child_id, parent_id) VALUES (v_d, v_c);
  INSERT INTO affiliate_relationships (child_id, parent_id) VALUES (v_c, v_b);
  BEGIN
    INSERT INTO affiliate_relationships (child_id, parent_id) VALUES (v_b, v_a);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'affiliate_depth_exceeded' THEN v_depth_blocked := TRUE; END IF;
  END;
  ASSERT v_depth_blocked, format('3-level affiliate chain must be rejected, got %s', COALESCE(v_msg, '<none>'));

  RAISE NOTICE 'AFFILIATE DB DEPTH OK — self, cycle, and >2 depth blocked';
END;
$$;
ROLLBACK;

-- ── 2. Registration RPCs create affiliate graph without replacing referrals ──
BEGIN;
DO $$
DECLARE
  v_parent UUID := gen_random_uuid();
  v_child UUID := gen_random_uuid();
  v_result JSONB;
  v_welcome JSONB;
  v_bonus TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_parent, 'authenticated', 'authenticated', 'aff_parent_' || v_parent::TEXT || '@test.local', NOW(), NOW()),
    (v_child, 'authenticated', 'authenticated', 'aff_child_' || v_child::TEXT || '@test.local', NOW(), NOW());
  UPDATE profiles SET username = 'parentaa' WHERE id = v_parent;
  UPDATE profiles SET username = 'childaaa' WHERE id = v_child;

  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_referral_enabled';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_child::TEXT)::TEXT, true);
  v_result := rpc_register_referral('parentaa');
  ASSERT (v_result->>'registered')::BOOLEAN = TRUE, format('referral registration must succeed, got %s', v_result);
  ASSERT EXISTS (
    SELECT 1 FROM referrals WHERE referrer_id = v_parent AND referred_id = v_child
  ), 'existing referrals welcome path row must still be created';
  ASSERT EXISTS (
    SELECT 1 FROM affiliate_relationships WHERE parent_id = v_parent AND child_id = v_child
  ), 'affiliate relationship must be created beside referrals';

  v_welcome := rpc_claim_welcome_bonus();
  ASSERT (v_welcome->>'already_claimed')::BOOLEAN = FALSE, format('welcome bonus must claim, got %s', v_welcome);
  SELECT referral_bonus INTO v_bonus FROM welcome_bonuses WHERE user_id = v_child;
  ASSERT v_bonus = '1000.000000', format('welcome referral bonus path regressed, got %s', COALESCE(v_bonus, '<none>'));
  ASSERT EXISTS (
    SELECT 1 FROM referrals
     WHERE referrer_id = v_parent
       AND referred_id = v_child
       AND rewarded_at IS NOT NULL
  ), 'welcome claim must still reward through referrals table';

  RAISE NOTICE 'AFFILIATE RPC COEXISTENCE OK — referrals and affiliate_relationships coexist';
END;
$$;
ROLLBACK;

-- ── 3. Existing invite_3_friends mission remains referrals-based ──────────────
BEGIN;
DO $$
DECLARE
  v_referrer UUID := gen_random_uuid();
  v_ref1 UUID := gen_random_uuid();
  v_ref2 UUID := gen_random_uuid();
  v_ref3 UUID := gen_random_uuid();
  v_found INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
    (v_referrer, 'authenticated', 'authenticated', 'aff_mission_r_' || v_referrer::TEXT || '@test.local', NOW(), NOW()),
    (v_ref1, 'authenticated', 'authenticated', 'aff_mission_1_' || v_ref1::TEXT || '@test.local', NOW(), NOW()),
    (v_ref2, 'authenticated', 'authenticated', 'aff_mission_2_' || v_ref2::TEXT || '@test.local', NOW(), NOW()),
    (v_ref3, 'authenticated', 'authenticated', 'aff_mission_3_' || v_ref3::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_ref1, v_referrer), (v_ref2, v_referrer), (v_ref3, v_referrer);
  INSERT INTO referrals (referrer_id, referred_id)
  VALUES (v_referrer, v_ref1), (v_referrer, v_ref2), (v_referrer, v_ref3);

  UPDATE referrals SET referrer_phon = '2000.000000', referred_phon = '1000.000000', rewarded_at = NOW()
   WHERE referrer_id = v_referrer AND referred_id IN (v_ref1, v_ref2);
  SELECT COUNT(*) INTO v_found
    FROM missions WHERE user_id = v_referrer AND mission = 'invite_3_friends' AND completed_at IS NOT NULL;
  ASSERT v_found = 0, 'invite_3_friends must not fire before 3 rewarded referrals';

  UPDATE referrals SET referrer_phon = '2000.000000', referred_phon = '1000.000000', rewarded_at = NOW()
   WHERE referrer_id = v_referrer AND referred_id = v_ref3;
  SELECT COUNT(*) INTO v_found
    FROM missions WHERE user_id = v_referrer AND mission = 'invite_3_friends' AND completed_at IS NOT NULL;
  ASSERT v_found = 1, 'invite_3_friends must still fire from referrals.rewarded_at';

  RAISE NOTICE 'AFFILIATE REFERRALS REGRESSION OK — mission remains referrals-based';
END;
$$;
ROLLBACK;
