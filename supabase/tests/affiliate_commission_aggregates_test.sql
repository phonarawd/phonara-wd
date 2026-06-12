-- ============================================================
-- Affiliate commission daily aggregates — SQL integration tests
-- ============================================================
-- Aggregates must be derived from rg_affiliate_commission_base(...) so RG
-- exclusion happens inside the base function before materialization.
-- ============================================================

-- ── 1. Affiliate graph source and daily game/trading aggregates ──────────────
BEGIN;
DO $$
DECLARE
  v_day DATE := CURRENT_DATE;
  v_affiliate UUID := gen_random_uuid();
  v_child UUID := gen_random_uuid();
  v_result JSONB;
  v_game NUMERIC;
  v_trading NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_affiliate, 'authenticated', 'authenticated', 'agg_affiliate_' || v_affiliate::TEXT || '@test.local', NOW(), NOW()),
    (v_child, 'authenticated', 'authenticated', 'agg_child_' || v_child::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_child, v_affiliate);

  PERFORM _credit_system_account('game_house_usdt', '12.000000', 'game_house_settle', v_child, 'agg-game', gen_random_uuid());
  PERFORM _credit_system_account('house_fee_usdt', '3.000000', 'futures_open_fee', v_child, 'agg-trading', gen_random_uuid());

  v_result := rpc_refresh_affiliate_commission_daily_aggregates(v_day, v_day);
  ASSERT (v_result->>'aggregate_days')::INT = 1, format('one-day refresh expected, got %s', v_result);

  SELECT COALESCE(SUM(gross_revenue::NUMERIC), 0) INTO v_game
    FROM affiliate_commission_daily_aggregates
   WHERE aggregate_date = v_day
     AND affiliate_id = v_affiliate
     AND referred_id = v_child
     AND domain = 'game'
     AND currency = 'USDT';

  SELECT COALESCE(SUM(gross_revenue::NUMERIC), 0) INTO v_trading
    FROM affiliate_commission_daily_aggregates
   WHERE aggregate_date = v_day
     AND affiliate_id = v_affiliate
     AND referred_id = v_child
     AND domain = 'trading'
     AND currency = 'USDT';

  ASSERT v_game = 12, format('game_house_* GGR must aggregate from affiliate_relationships, got %s', v_game);
  ASSERT v_trading = 3, format('house_fee_* trading fees must aggregate, got %s', v_trading);

  RAISE NOTICE 'AFFILIATE COMMISSION AGGREGATE OK — affiliate graph game/trading daily rows materialized';
END;
$$;
ROLLBACK;

-- ── 2. RG-blocked activity does not survive materialization ──────────────────
BEGIN;
DO $$
DECLARE
  v_day DATE := CURRENT_DATE;
  v_affiliate UUID := gen_random_uuid();
  v_child UUID := gen_random_uuid();
  v_blocked NUMERIC;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_affiliate, 'authenticated', 'authenticated', 'agg_rg_affiliate_' || v_affiliate::TEXT || '@test.local', NOW(), NOW()),
    (v_child, 'authenticated', 'authenticated', 'agg_rg_child_' || v_child::TEXT || '@test.local', NOW(), NOW());

  INSERT INTO affiliate_relationships (child_id, parent_id)
  VALUES (v_child, v_affiliate);

  PERFORM _credit_system_account('house_fee_usdt', '25.000000', 'spot_buy_fee', v_child, 'agg-rg', gen_random_uuid());

  INSERT INTO rg_block_events (
    user_id, event_type, domain, currency, month_start,
    effective_start_at, effective_end_at, reason
  ) VALUES (
    v_child, 'loss_limit_reached', 'trading', 'USDT', date_trunc('month', NOW())::DATE,
    NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour',
    'aggregate exclusion fixture'
  );

  PERFORM rpc_refresh_affiliate_commission_daily_aggregates(v_day, v_day);

  SELECT COALESCE(SUM(gross_revenue::NUMERIC), 0) INTO v_blocked
    FROM affiliate_commission_daily_aggregates
   WHERE aggregate_date = v_day
     AND affiliate_id = v_affiliate
     AND referred_id = v_child;

  ASSERT v_blocked = 0,
    format('RG-blocked-period GGR/fees must not survive daily aggregate materialization, got %s', v_blocked);

  RAISE NOTICE 'AFFILIATE COMMISSION RG EXCLUSION OK — blocked-period revenue omitted from daily aggregate';
END;
$$;
ROLLBACK;
