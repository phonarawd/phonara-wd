-- ============================================================
-- GRANT + RLS inventory — drift detection for client roles
-- ============================================================
-- Pins explicit GRANT/REVOKE from migrations 000045, 000053–000055
-- (20260611000054/55). RLS row filters are covered by scope tests;
-- this file guards base table privileges that PostgREST needs before
-- RLS can run. Update this snapshot when any migration changes RLS
-- or table GRANTs on a listed table.
--
-- Runs in one transaction and ROLLS BACK — no residue.
-- ============================================================

BEGIN;

DO $$
DECLARE
  r RECORD;
  v_rls_off TEXT := '';
  v_anon_writes TEXT := '';
  v_auth_writes TEXT := '';
BEGIN
  -- ── Helper: assert privilege state ───────────────────────────────────────
  -- app_config (000053 RLS + 20260611000054 GRANT)
  ASSERT has_table_privilege('anon', 'public.app_config', 'SELECT'),
    'anon must SELECT app_config (public is_public rows)';

  ASSERT has_table_privilege('authenticated', 'public.app_config', 'SELECT'),
    'authenticated must SELECT app_config';

  -- profiles / wallets (20260611000055)
  ASSERT NOT has_table_privilege('anon', 'public.profiles', 'SELECT'),
    'anon must NOT SELECT profiles';
  ASSERT NOT has_table_privilege('anon', 'public.wallets', 'SELECT'),
    'anon must NOT SELECT wallets';

  ASSERT has_table_privilege('authenticated', 'public.profiles', 'SELECT'),
    'authenticated must SELECT profiles';
  ASSERT has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
    'authenticated must UPDATE profiles';
  ASSERT NOT has_table_privilege('authenticated', 'public.profiles', 'INSERT'),
    'authenticated must NOT INSERT profiles';
  ASSERT NOT has_table_privilege('authenticated', 'public.profiles', 'DELETE'),
    'authenticated must NOT DELETE profiles';

  ASSERT has_table_privilege('authenticated', 'public.wallets', 'SELECT'),
    'authenticated must SELECT wallets';
  ASSERT NOT has_table_privilege('authenticated', 'public.wallets', 'INSERT'),
    'authenticated must NOT INSERT wallets';

  ASSERT has_table_privilege('service_role', 'public.profiles', 'INSERT'),
    'service_role must INSERT profiles (E2E/fixtures)';
  ASSERT has_table_privilege('service_role', 'public.wallets', 'INSERT'),
    'service_role must INSERT wallets (E2E/fixtures)';

  -- scope-hardened reads (000053 + 20260611000054)
  ASSERT has_table_privilege('authenticated', 'public.spot_trades', 'SELECT'),
    'authenticated must SELECT spot_trades (own-row RLS)';
  ASSERT has_table_privilege('authenticated', 'public.price_change_audit', 'SELECT'),
    'authenticated must SELECT price_change_audit (admin RLS)';
  ASSERT has_table_privilege('authenticated', 'public.market_sources', 'SELECT'),
    'authenticated must SELECT market_sources (admin RLS)';
  ASSERT NOT has_table_privilege('anon', 'public.affiliate_relationships', 'SELECT'),
    'anon must NOT SELECT affiliate_relationships';
  ASSERT has_table_privilege('authenticated', 'public.affiliate_relationships', 'SELECT'),
    'authenticated must SELECT affiliate_relationships (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_relationships', 'INSERT'),
    'authenticated must NOT INSERT affiliate_relationships directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_relationships', 'UPDATE'),
    'authenticated must NOT UPDATE affiliate_relationships directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_relationships', 'DELETE'),
    'authenticated must NOT DELETE affiliate_relationships directly';
  ASSERT NOT has_table_privilege('anon', 'public.affiliate_tier_configs', 'SELECT'),
    'anon must NOT SELECT affiliate_tier_configs';
  ASSERT has_table_privilege('authenticated', 'public.affiliate_tier_configs', 'SELECT'),
    'authenticated must SELECT affiliate_tier_configs';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_tier_configs', 'INSERT'),
    'authenticated must NOT INSERT affiliate_tier_configs directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_elite_overrides', 'UPDATE'),
    'authenticated must NOT UPDATE affiliate_elite_overrides directly';
  ASSERT has_table_privilege('authenticated', 'public.affiliate_tier_snapshots', 'SELECT'),
    'authenticated must SELECT affiliate_tier_snapshots (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_tier_snapshots', 'INSERT'),
    'authenticated must NOT INSERT affiliate_tier_snapshots directly';
  ASSERT has_table_privilege('authenticated', 'public.affiliate_commission_daily_aggregates', 'SELECT'),
    'authenticated must SELECT affiliate_commission_daily_aggregates (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_commission_daily_aggregates', 'INSERT'),
    'authenticated must NOT INSERT affiliate_commission_daily_aggregates directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_commission_daily_aggregates', 'UPDATE'),
    'authenticated must NOT UPDATE affiliate_commission_daily_aggregates directly';
  ASSERT has_table_privilege('authenticated', 'public.affiliate_settlements', 'SELECT'),
    'authenticated must SELECT affiliate_settlements (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_settlements', 'INSERT'),
    'authenticated must NOT INSERT affiliate_settlements directly';
  ASSERT has_table_privilege('authenticated', 'public.affiliate_settlement_events', 'SELECT'),
    'authenticated must SELECT affiliate_settlement_events (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_settlement_events', 'UPDATE'),
    'authenticated must NOT UPDATE affiliate_settlement_events directly';
  ASSERT has_table_privilege('authenticated', 'public.affiliate_commission_approvals', 'SELECT'),
    'authenticated must SELECT affiliate_commission_approvals (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_commission_approvals', 'INSERT'),
    'authenticated must NOT INSERT affiliate_commission_approvals directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.affiliate_commission_approvals', 'UPDATE'),
    'authenticated must NOT UPDATE affiliate_commission_approvals directly';

  -- system account belt (000045)
  ASSERT NOT has_table_privilege('anon', 'public.system_accounts', 'INSERT'),
    'anon must NOT INSERT system_accounts';
  ASSERT NOT has_table_privilege('anon', 'public.system_accounts', 'UPDATE'),
    'anon must NOT UPDATE system_accounts';
  ASSERT NOT has_table_privilege('anon', 'public.system_accounts', 'DELETE'),
    'anon must NOT DELETE system_accounts';
  ASSERT NOT has_table_privilege('authenticated', 'public.system_account_ledger', 'INSERT'),
    'authenticated must NOT INSERT system_account_ledger';
  ASSERT NOT has_table_privilege('authenticated', 'public.system_account_ledger', 'UPDATE'),
    'authenticated must NOT UPDATE system_account_ledger';
  ASSERT NOT has_table_privilege('authenticated', 'public.system_account_ledger', 'DELETE'),
    'authenticated must NOT DELETE system_account_ledger';

  -- Launch closeout: client roles must not keep broad table-write grants just
  -- because RLS policies would usually filter them. Direct writes are allowed
  -- only for explicitly shipped client-owned surfaces.
  FOR r IN
    SELECT c.oid, c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND (
        has_table_privilege('anon', c.oid, 'INSERT')
        OR has_table_privilege('anon', c.oid, 'UPDATE')
        OR has_table_privilege('anon', c.oid, 'DELETE')
        OR has_table_privilege('anon', c.oid, 'TRUNCATE')
      )
    ORDER BY c.relname
  LOOP
    v_anon_writes := v_anon_writes || ' ' || r.tbl;
  END LOOP;

  ASSERT v_anon_writes = '',
    format('anon must not have direct table write grants:%s', v_anon_writes);

  FOR r IN
    SELECT c.oid, c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT IN ('profiles', 'push_subscriptions')
      AND (
        has_table_privilege('authenticated', c.oid, 'INSERT')
        OR has_table_privilege('authenticated', c.oid, 'UPDATE')
        OR has_table_privilege('authenticated', c.oid, 'DELETE')
        OR has_table_privilege('authenticated', c.oid, 'TRUNCATE')
      )
    ORDER BY c.relname
  LOOP
    v_auth_writes := v_auth_writes || ' ' || r.tbl;
  END LOOP;

  ASSERT v_auth_writes = '',
    format('authenticated direct table writes must be allowlisted only:%s', v_auth_writes);

  ASSERT has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
    'authenticated may UPDATE own profile through RLS';
  ASSERT NOT has_table_privilege('authenticated', 'public.profiles', 'INSERT'),
    'authenticated must not INSERT profiles';
  ASSERT has_table_privilege('authenticated', 'public.push_subscriptions', 'INSERT')
     AND has_table_privilege('authenticated', 'public.push_subscriptions', 'UPDATE')
     AND has_table_privilege('authenticated', 'public.push_subscriptions', 'DELETE'),
    'authenticated may manage own push_subscriptions through RLS';

  ASSERT has_table_privilege('authenticated', 'public.crypto_deposit_addresses', 'SELECT'),
    'authenticated may SELECT own crypto_deposit_addresses';
  ASSERT NOT has_table_privilege('authenticated', 'public.crypto_deposit_addresses', 'INSERT'),
    'authenticated must not INSERT crypto_deposit_addresses';
  ASSERT has_table_privilege('authenticated', 'public.crypto_deposit_requests', 'SELECT'),
    'authenticated may SELECT own crypto_deposit_requests';
  ASSERT NOT has_table_privilege('authenticated', 'public.crypto_deposit_requests', 'INSERT'),
    'authenticated must not INSERT crypto_deposit_requests';
  ASSERT has_table_privilege('authenticated', 'public.viral_mission_claims', 'SELECT'),
    'authenticated may SELECT own viral_mission_claims';
  ASSERT NOT has_table_privilege('authenticated', 'public.viral_mission_claims', 'INSERT'),
    'authenticated must not INSERT viral_mission_claims';

  -- casino client bet reads (20260620000137)
  ASSERT NOT has_table_privilege('authenticated', 'public.game_bets', 'SELECT'),
    'authenticated must NOT SELECT game_bets directly (use v_game_bets_client)';
  ASSERT has_table_privilege('authenticated', 'public.v_game_bets_client', 'SELECT'),
    'authenticated must SELECT v_game_bets_client';

  -- sportsbook (Wave-S1–S7 · 20260616000099–105)
  ASSERT NOT has_table_privilege('anon', 'public.sports_fixtures', 'SELECT'),
    'anon must NOT SELECT sports_fixtures directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_fixtures', 'SELECT'),
    'authenticated must NOT SELECT sports_fixtures directly';
  ASSERT NOT has_table_privilege('anon', 'public.sports_markets', 'SELECT'),
    'anon must NOT SELECT sports_markets directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_markets', 'SELECT'),
    'authenticated must NOT SELECT sports_markets directly';
  ASSERT NOT has_table_privilege('anon', 'public.sports_outcomes', 'SELECT'),
    'anon must NOT SELECT sports_outcomes directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_outcomes', 'SELECT'),
    'authenticated must NOT SELECT sports_outcomes directly';
  ASSERT NOT has_table_privilege('anon', 'public.sports_odds_snapshots', 'SELECT'),
    'anon must NOT SELECT sports_odds_snapshots directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_odds_snapshots', 'SELECT'),
    'authenticated must NOT SELECT sports_odds_snapshots directly';
  ASSERT has_table_privilege('authenticated', 'public.sports_bets', 'SELECT'),
    'authenticated must SELECT own sports_bets (RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_bets', 'INSERT'),
    'authenticated must NOT INSERT sports_bets directly';
  ASSERT has_table_privilege('authenticated', 'public.sports_bet_legs', 'SELECT'),
    'authenticated must SELECT own sports_bet_legs (RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_bet_legs', 'INSERT'),
    'authenticated must NOT INSERT sports_bet_legs directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_ingest_cursors', 'SELECT'),
    'authenticated must NOT SELECT sports_ingest_cursors';
  ASSERT has_table_privilege('service_role', 'public.sports_ingest_cursors', 'SELECT'),
    'service_role must SELECT sports_ingest_cursors';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_ingest_health', 'SELECT'),
    'authenticated must NOT SELECT sports_ingest_health';
  ASSERT has_table_privilege('service_role', 'public.sports_ingest_health', 'SELECT'),
    'service_role must SELECT sports_ingest_health';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_record_sports_ingest_health(jsonb)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_record_sports_ingest_health';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_sync_sports_ingest_ops_alerts(bigint, bigint, bigint)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_sync_sports_ingest_ops_alerts';
  ASSERT has_table_privilege('authenticated', 'public.sports_fixture_events', 'SELECT'),
    'authenticated may SELECT sports_fixture_events (admin RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_fixture_events', 'INSERT'),
    'authenticated must NOT INSERT sports_fixture_events directly';

  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_ingest_sports_c1(jsonb)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_ingest_sports_c1';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_ingest_sports_c1_batch(jsonb)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_ingest_sports_c1_batch';
  ASSERT has_function_privilege('authenticated', 'public.rpc_place_sports_bet(jsonb, text, text, text, text, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_place_sports_bet';
  ASSERT has_function_privilege('authenticated', 'public.rpc_place_limit_order(text, text, text, text, text, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_place_limit_order';
  ASSERT has_function_privilege('authenticated', 'public.rpc_place_stop_order(text, text, text, text, text, text, text, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_place_stop_order';
  ASSERT has_function_privilege('authenticated', 'public.rpc_cancel_order(uuid)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_cancel_order';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_run_open_order_fills()', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_run_open_order_fills';
  ASSERT has_function_privilege('authenticated', 'public.rpc_set_margin_mode(text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_set_margin_mode';
  ASSERT has_function_privilege('authenticated', 'public.rpc_adjust_isolated_margin(uuid, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_adjust_isolated_margin';
  ASSERT has_function_privilege('authenticated', 'public.rpc_partial_close_futures(uuid, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_partial_close_futures';
  ASSERT has_table_privilege('authenticated', 'public.margin_accounts', 'SELECT'),
    'authenticated must SELECT margin_accounts (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.margin_accounts', 'INSERT'),
    'authenticated must NOT INSERT margin_accounts directly';
  ASSERT has_table_privilege('authenticated', 'public.trading_open_orders', 'SELECT'),
    'authenticated must SELECT trading_open_orders (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.trading_open_orders', 'INSERT'),
    'authenticated must NOT INSERT trading_open_orders directly';
  ASSERT has_table_privilege('authenticated', 'public.trading_order_fills', 'SELECT'),
    'authenticated must SELECT trading_order_fills (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.trading_order_fills', 'INSERT'),
    'authenticated must NOT INSERT trading_order_fills directly';
  ASSERT has_function_privilege('anon', 'public.rpc_list_sports_fixtures(date, text, text)', 'EXECUTE'),
    'anon must EXECUTE rpc_list_sports_fixtures';

  -- ── RLS enabled on inventory tables ──────────────────────────────────────
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname IN (
        'app_config', 'profiles', 'wallets', 'spot_trades',
        'price_change_audit', 'market_sources', 'affiliate_relationships',
        'affiliate_tier_configs', 'affiliate_elite_overrides', 'affiliate_tier_snapshots',
        'affiliate_commission_daily_aggregates',
        'affiliate_settlements', 'affiliate_settlement_events',
        'affiliate_commission_approvals',
        'system_accounts', 'system_account_ledger',
        'crypto_deposit_addresses', 'crypto_deposit_requests',
        'on_chain_incoming_transfers', 'viral_mission_claims',
        'sports_fixtures', 'sports_markets', 'sports_outcomes', 'sports_odds_snapshots',
        'sports_bets', 'sports_bet_legs', 'sports_ingest_cursors', 'sports_fixture_events',
        'sports_ingest_health', 'sports_user_risk_profiles', 'sports_risk_events',
        'sports_device_signals', 'sports_market_type_registry', 'sports_live_ttl_by_sport',
        'trading_open_orders', 'trading_order_fills', 'margin_accounts'
      )
      AND NOT c.relrowsecurity
  LOOP
    v_rls_off := v_rls_off || ' ' || r.tbl;
  END LOOP;

  ASSERT v_rls_off = '',
    format('RLS must be enabled on inventory tables:%s', v_rls_off);

  RAISE NOTICE 'GRANTS RLS INVENTORY OK — pinned role/table privileges match migrations 000045/053–055, affiliate approvals, and sportsbook S1–S7';
END;
$$;

ROLLBACK;
