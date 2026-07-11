-- E1 Tier Decay — floor · 1-tier · grace · warning · keep progress
BEGIN;

-- E1-0: bronze floor never decays
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_res JSONB;
  v_tier earn_vip_tier;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e1_floor_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  INSERT INTO user_earn_vip (user_id, xp, tier, last_qualifying_at)
  VALUES (v_uid, 100, 'bronze', NOW() - INTERVAL '120 days')
  ON CONFLICT (user_id) DO UPDATE
    SET xp = 100, tier = 'bronze', last_qualifying_at = NOW() - INTERVAL '120 days';

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_res := rpc_run_tier_decay(50, NOW());
  SELECT tier INTO v_tier FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'bronze', format('bronze must stay floor, got %s', v_tier);
  ASSERT NOT EXISTS (SELECT 1 FROM tier_decay_events WHERE user_id = v_uid),
    'bronze must not create decay events';

  RAISE NOTICE 'E1-0 OK — bronze floor';
END;
$$;

-- E1-1: silver past grace without maintenance → bronze (max 1 tier) + XP clamp
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_res JSONB;
  v_apply JSONB;
  v_tier earn_vip_tier;
  v_xp BIGINT;
  v_evt INT;
  v_notif INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e1_drop_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  INSERT INTO user_earn_vip (user_id, xp, tier, last_qualifying_at, decay_warnings_sent)
  VALUES (v_uid, 20000, 'silver', NOW() - INTERVAL '50 days', '{}')
  ON CONFLICT (user_id) DO UPDATE
    SET xp = 20000,
        tier = 'silver',
        last_qualifying_at = NOW() - INTERVAL '50 days',
        decay_warnings_sent = '{}';

  PERFORM set_config('request.jwt.claims', '{}', true);
  v_apply := _tier_decay_apply_one(v_uid, NOW());
  ASSERT COALESCE((v_apply->>'ok')::BOOLEAN, FALSE),
    format('silver past grace must decay, got %s', v_apply::TEXT);

  SELECT tier, xp INTO v_tier, v_xp FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'bronze', format('expected bronze after 1-tier drop, got %s', v_tier);
  ASSERT v_xp <= 4999, format('XP must clamp to bronze cap, got %s', v_xp);

  SELECT COUNT(*)::INT INTO v_evt FROM tier_decay_events
   WHERE user_id = v_uid AND from_tier = 'silver' AND to_tier = 'bronze';
  ASSERT v_evt = 1, format('expected 1 decay event, got %s', v_evt);

  SELECT COUNT(*)::INT INTO v_notif FROM notification_outbox
   WHERE user_id = v_uid AND event_type = 'tier_decay_warning'
     AND payload->>'phase' = 'decayed';
  ASSERT v_notif >= 1, format('decay must enqueue notification, got %s', v_notif);

  -- Second apply same day must not drop further without new grace expiry
  v_apply := _tier_decay_apply_one(v_uid, NOW());
  ASSERT NOT COALESCE((v_apply->>'ok')::BOOLEAN, FALSE),
    'floor/bronze must not decay again';
  SELECT tier INTO v_tier FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'bronze', 'still bronze after second apply';

  RAISE NOTICE 'E1-1 OK — 1-tier drop + XP clamp';
END;
$$;

-- E1-2: grace active → no decay; maintenance deposit resets grace
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_wallet UUID;
  v_apply JSONB;
  v_tier earn_vip_tier;
  v_prog INT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e1_grace_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  SELECT id INTO v_wallet FROM wallets WHERE user_id = v_uid;

  INSERT INTO user_earn_vip (user_id, xp, tier, last_qualifying_at)
  VALUES (v_uid, 30000, 'gold', NOW() - INTERVAL '10 days')
  ON CONFLICT (user_id) DO UPDATE
    SET xp = 30000, tier = 'gold', last_qualifying_at = NOW() - INTERVAL '10 days';

  v_apply := _tier_decay_apply_one(v_uid, NOW());
  ASSERT (v_apply->>'reason') = 'grace_active',
    format('within grace must skip, got %s', v_apply::TEXT);
  SELECT tier INTO v_tier FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'gold', 'gold must remain during grace';

  -- Qualifying KRW deposit meets gold threshold → keep progress = 1
  INSERT INTO krw_deposit_requests (
    user_id, wallet_id, reference_code, amount_krw, status, credited_at
  ) VALUES (
    v_uid, v_wallet, 'E1KEEP' || substr(v_uid::TEXT, 1, 8),
    '500000.00', 'credited', NOW()
  );

  ASSERT _tier_decay_meets_maintenance(v_uid, 'gold', NOW()),
    'gold KRW deposit must meet maintenance';

  v_prog := _repeatable_progress(v_uid, 'tier_keep_status');
  ASSERT v_prog = 1, format('tier_keep_status progress must be 1, got %s', v_prog);

  RAISE NOTICE 'E1-2 OK — grace + keep progress';
END;
$$;

-- E1-3: warning at ≤30 days remaining enqueues tier_decay_warning once per threshold
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_warn JSONB;
  v_notif INT;
  v_sent INT[];
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e1_warn_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  -- 45-day grace, anchor 20 days ago → ~25 days left → triggers 30-day warn
  INSERT INTO user_earn_vip (user_id, xp, tier, last_qualifying_at, decay_warnings_sent)
  VALUES (v_uid, 12000, 'silver', NOW() - INTERVAL '20 days', '{}')
  ON CONFLICT (user_id) DO UPDATE
    SET xp = 12000,
        tier = 'silver',
        last_qualifying_at = NOW() - INTERVAL '20 days',
        decay_warnings_sent = '{}';

  v_warn := _tier_decay_maybe_warn(v_uid, NOW());
  ASSERT COALESCE((v_warn->>'warned')::INT, 0) >= 1,
    format('expected warning enqueue, got %s', v_warn::TEXT);

  SELECT COUNT(*)::INT INTO v_notif FROM notification_outbox
   WHERE user_id = v_uid
     AND event_type = 'tier_decay_warning'
     AND payload->>'phase' = 'warning';
  ASSERT v_notif >= 1, format('warning outbox missing, got %s', v_notif);

  SELECT decay_warnings_sent INTO v_sent FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT 30 = ANY (v_sent), format('30-day warn must be recorded, got %s', v_sent);

  -- Idempotent: second call should not re-warn same threshold
  v_warn := _tier_decay_maybe_warn(v_uid, NOW());
  ASSERT COALESCE((v_warn->>'warned')::INT, 0) = 0,
    format('duplicate warn must be 0, got %s', v_warn::TEXT);

  RAISE NOTICE 'E1-3 OK — decay warning schedule';
END;
$$;

-- E1-4: diamond uses 60-day grace; authenticated non-admin cannot run sweep
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_apply JSONB;
  v_err TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e1_dia_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  INSERT INTO user_earn_vip (user_id, xp, tier, last_qualifying_at)
  VALUES (v_uid, 600000, 'diamond', NOW() - INTERVAL '50 days')
  ON CONFLICT (user_id) DO UPDATE
    SET xp = 600000, tier = 'diamond', last_qualifying_at = NOW() - INTERVAL '50 days';

  ASSERT _tier_decay_grace_days('diamond') = 60, 'diamond grace must be 60';
  v_apply := _tier_decay_apply_one(v_uid, NOW());
  ASSERT (v_apply->>'reason') = 'grace_active',
    format('diamond at 50d must still be in 60d grace, got %s', v_apply::TEXT);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);
  BEGIN
    PERFORM rpc_run_tier_decay(10, NOW());
    RAISE EXCEPTION 'expected_forbidden';
  EXCEPTION
    WHEN OTHERS THEN
      v_err := SQLERRM;
      IF v_err = 'expected_forbidden' THEN
        RAISE EXCEPTION 'non-admin must be forbidden from rpc_run_tier_decay';
      END IF;
      IF v_err NOT ILIKE '%forbidden%' THEN
        RAISE EXCEPTION 'unexpected error: %', v_err;
      END IF;
  END;

  RAISE NOTICE 'E1-4 OK — diamond grace + auth deny';
END;
$$;

ROLLBACK;
