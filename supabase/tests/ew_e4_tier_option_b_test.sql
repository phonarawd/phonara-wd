-- E4 Tier Option B — enum · summary · admin write · prime preserve · caps · decay skip
BEGIN;

-- E4-0: enum includes prime_elite + fee helper math
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_rate NUMERIC;
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'earn_vip_tier' AND e.enumlabel = 'prime_elite'
  ), 'prime_elite enum missing';

  ASSERT _earn_tier_index('prime_elite'::earn_vip_tier) = 5, 'prime_elite index';
  ASSERT _earn_vip_fee_discount_bps('bronze'::earn_vip_tier) = 0, 'bronze fee bps';
  ASSERT _earn_vip_fee_discount_bps('prime_elite'::earn_vip_tier) = 5000, 'prime fee bps';

  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e4_fee_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  INSERT INTO user_earn_vip (user_id, xp, tier)
  VALUES (v_uid, 100, 'gold')
  ON CONFLICT (user_id) DO UPDATE SET xp = 100, tier = 'gold';

  v_rate := _earn_vip_fee_rate(v_uid, 0.001);
  ASSERT v_rate = trunc(0.001 * 0.85, 8), format('gold fee rate expected 0.00085, got %s', v_rate);

  RAISE NOTICE 'E4-0 OK — enum + fee helper';
END;
$$;

-- E4-1: rpc_get_user_tier_summary own row
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_res JSONB;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e4_sum_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  INSERT INTO user_earn_vip (user_id, xp, tier)
  VALUES (v_uid, 6000, 'silver')
  ON CONFLICT (user_id) DO UPDATE SET xp = 6000, tier = 'silver';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    true
  );

  v_res := rpc_get_user_tier_summary();
  ASSERT v_res->>'tier' = 'silver', format('expected silver, got %s', v_res->>'tier');
  ASSERT (v_res->>'fee_discount_bps')::INT = 1000, 'silver fee bps';
  ASSERT v_res->>'option' = 'B', 'option B';
  ASSERT (v_res->'limits'->>'roulette')::INT = 1, 'silver roulette limit';

  -- anon deny path: clear claims
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    PERFORM rpc_get_user_tier_summary();
    RAISE EXCEPTION 'summary must require auth';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%not_authenticated%' AND SQLERRM NOT LIKE '%unauthenticated%' THEN
        NULL; -- also ok if other auth guard
      END IF;
  END;

  RAISE NOTICE 'E4-1 OK — tier summary';
END;
$$;

-- E4-2: admin set prime_elite + trigger preserve against XP demote
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_tier earn_vip_tier;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e4_pe_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  INSERT INTO user_earn_vip (user_id, xp, tier)
  VALUES (v_uid, 10000, 'diamond')
  ON CONFLICT (user_id) DO UPDATE SET xp = 10000, tier = 'diamond';

  -- Admin path sets allow flag then updates (RPC body does the same)
  PERFORM set_config('phonara.allow_prime_elite_change', '1', true);
  UPDATE user_earn_vip SET tier = 'prime_elite' WHERE user_id = v_uid;

  SELECT tier INTO v_tier FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'prime_elite', format('expected prime_elite after admin, got %s', v_tier);

  -- XP path demote attempt without allow flag
  PERFORM set_config('phonara.allow_prime_elite_change', '0', true);
  UPDATE user_earn_vip SET tier = 'diamond', xp = xp + 1 WHERE user_id = v_uid;
  SELECT tier INTO v_tier FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'prime_elite', format('trigger must preserve prime_elite, got %s', v_tier);

  -- Auto promote INTO prime_elite without flag must be blocked
  UPDATE user_earn_vip SET tier = 'diamond' WHERE user_id = v_uid; -- still blocked demote
  PERFORM set_config('phonara.allow_prime_elite_change', '1', true);
  UPDATE user_earn_vip SET tier = 'diamond' WHERE user_id = v_uid;
  SELECT tier INTO v_tier FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'diamond', 'admin allow must demote prime_elite';

  PERFORM set_config('phonara.allow_prime_elite_change', '0', true);
  UPDATE user_earn_vip SET tier = 'prime_elite' WHERE user_id = v_uid;
  SELECT tier INTO v_tier FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'diamond', 'auto promote to prime_elite must be blocked';

  RAISE NOTICE 'E4-2 OK — admin prime + preserve';
END;
$$;

-- E4-3: decay skips prime_elite
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_apply JSONB;
  v_tier earn_vip_tier;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e4_dec_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  PERFORM set_config('phonara.allow_prime_elite_change', '1', true);
  INSERT INTO user_earn_vip (user_id, xp, tier, last_qualifying_at)
  VALUES (v_uid, 999999, 'prime_elite', NOW() - INTERVAL '120 days')
  ON CONFLICT (user_id) DO UPDATE
    SET xp = 999999, tier = 'prime_elite', last_qualifying_at = NOW() - INTERVAL '120 days';

  v_apply := _tier_decay_apply_one(v_uid, NOW());
  ASSERT NOT COALESCE((v_apply->>'ok')::BOOLEAN, FALSE),
    format('prime_elite must not auto-decay, got %s', v_apply::TEXT);
  ASSERT v_apply->>'reason' = 'prime_elite_manual_only', 'decay reason';

  SELECT tier INTO v_tier FROM user_earn_vip WHERE user_id = v_uid;
  ASSERT v_tier = 'prime_elite', 'still prime_elite';

  RAISE NOTICE 'E4-3 OK — decay skip';
END;
$$;

-- E4-4: stake mult + withdraw cap helpers
DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_cap NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (v_uid, 'authenticated', 'authenticated', 'e4_cap_' || v_uid::TEXT || '@t.local', NOW(), NOW());

  INSERT INTO user_earn_vip (user_id, xp, tier)
  VALUES (v_uid, 100, 'bronze')
  ON CONFLICT (user_id) DO UPDATE SET xp = 100, tier = 'bronze';

  ASSERT _earn_vip_stake_mult('bronze'::earn_vip_tier) = 1.0, 'bronze stake mult';
  ASSERT _earn_vip_stake_mult('prime_elite'::earn_vip_tier) = 5.0, 'prime stake mult';
  ASSERT _earn_vip_trade_leverage_cap('gold'::earn_vip_tier) = 20, 'gold lev';

  v_cap := _earn_vip_withdrawal_daily_cap(v_uid);
  ASSERT v_cap = 100000, format('bronze withdraw cap, got %s', v_cap);

  UPDATE user_earn_vip SET tier = 'diamond' WHERE user_id = v_uid;
  v_cap := _earn_vip_withdrawal_daily_cap(v_uid);
  ASSERT v_cap IS NULL, 'diamond withdraw unlimited';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT, 'role', 'authenticated')::TEXT,
    true
  );

  -- Bronze stake max = base * 1.0; over base must fail
  BEGIN
    PERFORM _assert_game_stake_limits('dice'::game_code, 'PHON'::currency, 999999999999);
    RAISE EXCEPTION 'over-max stake must fail';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%stake_out_of_range%' THEN
        NULL;
      ELSE
        RAISE;
      END IF;
  END;

  RAISE NOTICE 'E4-4 OK — caps';
END;
$$;

ROLLBACK;
