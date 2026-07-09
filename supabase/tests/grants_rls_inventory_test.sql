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

  -- bonus_wagering_requirements (20260701000001 AT at-token-track)
  ASSERT NOT has_table_privilege('anon', 'public.bonus_wagering_requirements', 'SELECT'),
    'anon must NOT SELECT bonus_wagering_requirements';
  ASSERT has_table_privilege('authenticated', 'public.bonus_wagering_requirements', 'SELECT'),
    'authenticated must SELECT own bonus_wagering_requirements (RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.bonus_wagering_requirements', 'INSERT'),
    'authenticated must NOT INSERT bonus_wagering_requirements directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.bonus_wagering_requirements', 'UPDATE'),
    'authenticated must NOT UPDATE bonus_wagering_requirements directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.bonus_wagering_requirements', 'DELETE'),
    'authenticated must NOT DELETE bonus_wagering_requirements directly';
  ASSERT has_table_privilege('service_role', 'public.bonus_wagering_requirements', 'INSERT'),
    'service_role must INSERT bonus_wagering_requirements (engine writes)';

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
  ASSERT has_table_privilege('authenticated', 'public.giftcard_fee_market', 'SELECT'),
    'authenticated may SELECT giftcard_fee_market via admin RLS';
  ASSERT NOT has_table_privilege('authenticated', 'public.giftcard_fee_market', 'INSERT'),
    'authenticated must not INSERT giftcard_fee_market directly';
  ASSERT has_table_privilege('authenticated', 'public.viral_mission_claims', 'SELECT'),
    'authenticated may SELECT own viral_mission_claims';
  ASSERT NOT has_table_privilege('authenticated', 'public.viral_mission_claims', 'INSERT'),
    'authenticated must not INSERT viral_mission_claims';
  ASSERT has_table_privilege('authenticated', 'public.withdrawal_address_whitelist', 'SELECT'),
    'authenticated may SELECT own withdrawal_address_whitelist rows';
  ASSERT NOT has_table_privilege('authenticated', 'public.withdrawal_address_whitelist', 'INSERT'),
    'authenticated must not INSERT withdrawal_address_whitelist directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.withdrawal_address_whitelist', 'DELETE'),
    'authenticated must not DELETE withdrawal_address_whitelist directly';

  -- casino client bet reads (20260620000137)
  ASSERT NOT has_table_privilege('authenticated', 'public.game_bets', 'SELECT'),
    'authenticated must NOT SELECT game_bets directly (use v_game_bets_client)';
  ASSERT has_table_privilege('authenticated', 'public.v_game_bets_client', 'SELECT'),
    'authenticated must SELECT v_game_bets_client';

  -- admin access desk (20260630000002)
  ASSERT has_table_privilege('authenticated', 'public.admin_role_grants', 'SELECT'),
    'authenticated admin may SELECT admin_role_grants via RLS';
  ASSERT NOT has_table_privilege('authenticated', 'public.admin_role_grants', 'INSERT'),
    'authenticated must not INSERT admin_role_grants directly';
  ASSERT has_table_privilege('authenticated', 'public.mfa_tier_policy', 'SELECT'),
    'authenticated admin may SELECT mfa_tier_policy via RLS';
  ASSERT NOT has_table_privilege('authenticated', 'public.mfa_tier_policy', 'INSERT'),
    'authenticated must not INSERT mfa_tier_policy directly';

  -- sportsbook (Wave-S1–S7 · 20260616000099–105 · realtime read 20260706000001)
  ASSERT has_table_privilege('anon', 'public.sports_fixtures', 'SELECT'),
    'anon may SELECT sports_fixtures for realtime display';
  ASSERT has_table_privilege('authenticated', 'public.sports_fixtures', 'SELECT'),
    'authenticated may SELECT sports_fixtures for realtime display';
  ASSERT NOT has_table_privilege('anon', 'public.sports_fixtures', 'INSERT'),
    'anon must NOT INSERT sports_fixtures directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_fixtures', 'INSERT'),
    'authenticated must NOT INSERT sports_fixtures directly';
  ASSERT has_table_privilege('anon', 'public.sports_markets', 'SELECT'),
    'anon may SELECT sports_markets for realtime display';
  ASSERT has_table_privilege('authenticated', 'public.sports_markets', 'SELECT'),
    'authenticated may SELECT sports_markets for realtime display';
  ASSERT NOT has_table_privilege('anon', 'public.sports_markets', 'INSERT'),
    'anon must NOT INSERT sports_markets directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_markets', 'INSERT'),
    'authenticated must NOT INSERT sports_markets directly';
  ASSERT NOT has_table_privilege('anon', 'public.sports_outcomes', 'SELECT'),
    'anon must NOT SELECT sports_outcomes directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_outcomes', 'SELECT'),
    'authenticated must NOT SELECT sports_outcomes directly';
  ASSERT has_table_privilege('anon', 'public.sports_odds_snapshots', 'SELECT'),
    'anon may SELECT sports_odds_snapshots for realtime display';
  ASSERT has_table_privilege('authenticated', 'public.sports_odds_snapshots', 'SELECT'),
    'authenticated may SELECT sports_odds_snapshots for realtime display';
  ASSERT NOT has_table_privilege('anon', 'public.sports_odds_snapshots', 'INSERT'),
    'anon must NOT INSERT sports_odds_snapshots directly';
  ASSERT NOT has_table_privilege('authenticated', 'public.sports_odds_snapshots', 'INSERT'),
    'authenticated must NOT INSERT sports_odds_snapshots directly';
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
  ASSERT has_function_privilege('authenticated', 'public.rpc_place_limit_order(text, text, text, text, text, text, text, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_place_limit_order';
  ASSERT has_function_privilege('authenticated', 'public.rpc_set_trailing_stop(uuid, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_set_trailing_stop';
  ASSERT has_function_privilege('authenticated', 'public.rpc_clear_trailing_stop(uuid)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_clear_trailing_stop';
  ASSERT has_function_privilege('authenticated', 'public.rpc_place_stop_order(text, text, text, text, text, text, text, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_place_stop_order';
  ASSERT has_function_privilege('authenticated', 'public.rpc_cancel_order(uuid)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_cancel_order';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_run_open_order_fills()', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_run_open_order_fills';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_run_phon_internal_oracle()', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_run_phon_internal_oracle';
  ASSERT has_function_privilege('service_role', 'public.rpc_run_phon_internal_oracle()', 'EXECUTE'),
    'service_role must EXECUTE rpc_run_phon_internal_oracle';
  ASSERT NOT has_function_privilege('anon', 'public._mirror_phon_usdt_perp_mark(text,text,text)', 'EXECUTE'),
    'anon must NOT EXECUTE _mirror_phon_usdt_perp_mark';
  ASSERT has_function_privilege('authenticated', 'public.rpc_set_margin_mode(text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_set_margin_mode';
  ASSERT has_function_privilege('authenticated', 'public.rpc_adjust_isolated_margin(uuid, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_adjust_isolated_margin';
  ASSERT has_function_privilege('authenticated', 'public.rpc_partial_close_futures(uuid, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_partial_close_futures';
  ASSERT has_function_privilege('authenticated', 'public.rpc_update_futures_position_sltp(uuid, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_update_futures_position_sltp';
  ASSERT NOT has_function_privilege('authenticated', 'public._apply_funding_for_market(text, text, timestamp with time zone)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _apply_funding_for_market';
  ASSERT NOT has_function_privilege('authenticated', 'public._compute_funding_payment(text, text, position_side)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _compute_funding_payment';
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
  ASSERT has_table_privilege('authenticated', 'public.spot_open_orders', 'SELECT'),
    'authenticated must SELECT spot_open_orders (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.spot_open_orders', 'INSERT'),
    'authenticated must NOT INSERT spot_open_orders directly';
  ASSERT has_table_privilege('authenticated', 'public.spot_order_fills', 'SELECT'),
    'authenticated must SELECT spot_order_fills (own-row RLS)';
  ASSERT NOT has_table_privilege('authenticated', 'public.spot_order_fills', 'INSERT'),
    'authenticated must NOT INSERT spot_order_fills directly';
  ASSERT has_function_privilege('authenticated', 'public.rpc_place_spot_limit_order(text, text, text, text, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_place_spot_limit_order';
  ASSERT has_function_privilege('authenticated', 'public.rpc_place_spot_stop_order(text, text, text, text, text, text, text, text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_place_spot_stop_order';
  ASSERT has_function_privilege('authenticated', 'public.rpc_cancel_spot_order(uuid)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_cancel_spot_order';
  ASSERT has_function_privilege('anon', 'public.rpc_list_sports_fixtures(date, text, text)', 'EXECUTE'),
    'anon must EXECUTE rpc_list_sports_fixtures';
  ASSERT has_function_privilege('anon', 'public.rpc_get_fixture_markets(uuid)', 'EXECUTE'),
    'anon must EXECUTE rpc_get_fixture_markets';
  ASSERT has_function_privilege('anon', 'public.rpc_get_live_fixture_state(uuid)', 'EXECUTE'),
    'anon must EXECUTE rpc_get_live_fixture_state (SECURITY INVOKER)';
  ASSERT has_function_privilege('anon', 'public.rpc_list_sports_market_types()', 'EXECUTE'),
    'anon must EXECUTE rpc_list_sports_market_types (SECURITY INVOKER)';
  ASSERT has_function_privilege('anon', 'public.rpc_list_cms_content(text, text, text)', 'EXECUTE'),
    'anon must EXECUTE rpc_list_cms_content (SECURITY INVOKER)';
  ASSERT has_function_privilege('anon', 'public.rpc_get_golden_earth_status()', 'EXECUTE'),
    'anon must EXECUTE rpc_get_golden_earth_status';
  ASSERT has_function_privilege('anon', 'public.rpc_get_synthetic_book(text, int)', 'EXECUTE'),
    'anon must EXECUTE rpc_get_synthetic_book';

  -- ── RLS enabled on every public heap table ───────────────────────────────
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  LOOP
    v_rls_off := v_rls_off || ' ' || r.tbl;
  END LOOP;

  ASSERT v_rls_off = '',
    format('RLS must be enabled on all public tables:%s', v_rls_off);

  -- p0-edge-contracts: PG webhook replay table (service-only)
  ASSERT to_regclass('public.pg_webhook_replay') IS NOT NULL,
    'pg_webhook_replay must exist';
  ASSERT NOT has_table_privilege('anon', 'public.pg_webhook_replay', 'SELECT'),
    'anon must NOT SELECT pg_webhook_replay';
  ASSERT NOT has_table_privilege('authenticated', 'public.pg_webhook_replay', 'SELECT'),
    'authenticated must NOT SELECT pg_webhook_replay';
  ASSERT has_table_privilege('service_role', 'public.pg_webhook_replay', 'SELECT'),
    'service_role must SELECT pg_webhook_replay';

  -- P0 edge service RPCs (20260713000001 + db_security_inventory)
  ASSERT NOT has_function_privilege('anon', 'public.rpc_service_claim_notification_dispatch_batch(text, integer, integer)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_service_claim_notification_dispatch_batch';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_complete_notification_dispatch(uuid, text, text, text, boolean)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_complete_notification_dispatch';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_register_pg_webhook_replay(text, bigint, text, text, text, text)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_register_pg_webhook_replay';

  -- Launch E3 ops-notify outbox (20260721000001)
  ASSERT to_regclass('public.ops_notify_outbox') IS NOT NULL,
    'ops_notify_outbox must exist';
  ASSERT NOT has_table_privilege('anon', 'public.ops_notify_outbox', 'SELECT'),
    'anon must NOT SELECT ops_notify_outbox';
  ASSERT has_table_privilege('authenticated', 'public.ops_notify_outbox', 'SELECT'),
    'authenticated must SELECT ops_notify_outbox (admin RLS)';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_service_claim_ops_notify_batch(text, integer, integer)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_service_claim_ops_notify_batch';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_complete_ops_notify(uuid, text, text, text, boolean)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_complete_ops_notify';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_claim_ops_notify_batch(text, integer, integer)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_claim_ops_notify_batch';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_enqueue_ops_telegram_digest(integer)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_enqueue_ops_telegram_digest';

  -- Phase 2.5 admin ops visibility (20260714000001)
  ASSERT to_regclass('public.ops_alert_thresholds') IS NOT NULL,
    'ops_alert_thresholds must exist';
  ASSERT to_regclass('public.ops_alert_threshold_history') IS NOT NULL,
    'ops_alert_threshold_history must exist';
  ASSERT NOT has_table_privilege('anon', 'public.ops_alert_thresholds', 'SELECT'),
    'anon must NOT SELECT ops_alert_thresholds';
  ASSERT has_table_privilege('authenticated', 'public.ops_alert_thresholds', 'SELECT'),
    'authenticated must SELECT ops_alert_thresholds (admin RLS)';
  ASSERT NOT has_table_privilege('anon', 'public.ops_alert_threshold_history', 'SELECT'),
    'anon must NOT SELECT ops_alert_threshold_history';
  ASSERT has_function_privilege('authenticated', 'public.rpc_admin_get_ops_dashboard()', 'EXECUTE'),
    'authenticated must EXECUTE rpc_admin_get_ops_dashboard (admin guard inside)';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_admin_get_ops_dashboard()', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_admin_get_ops_dashboard';

  -- Phase 6 edge observability (20260715000001)
  ASSERT to_regclass('public.provider_health') IS NOT NULL,
    'provider_health must exist';
  ASSERT to_regclass('public.edge_ops_events') IS NOT NULL,
    'edge_ops_events must exist';
  ASSERT NOT has_table_privilege('anon', 'public.provider_health', 'SELECT'),
    'anon must NOT SELECT provider_health';
  ASSERT has_table_privilege('authenticated', 'public.provider_health', 'SELECT'),
    'authenticated must SELECT provider_health (admin RLS)';
  ASSERT NOT has_table_privilege('anon', 'public.edge_ops_events', 'SELECT'),
    'anon must NOT SELECT edge_ops_events';
  ASSERT has_table_privilege('authenticated', 'public.edge_ops_events', 'SELECT'),
    'authenticated must SELECT edge_ops_events (admin RLS)';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_upsert_provider_health(text, text, text, text, text, text, jsonb)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_upsert_provider_health';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_upsert_provider_health(text, text, text, text, text, text, jsonb)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_upsert_provider_health';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_record_edge_ops_event(text, text, text, text, integer, text, integer, integer, text, jsonb)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_record_edge_ops_event';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_record_edge_ops_event(text, text, text, text, integer, text, integer, integer, text, jsonb)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_record_edge_ops_event';

  -- Internal helper authenticated revoke (20260714000002)
  ASSERT NOT has_function_privilege('authenticated', 'public._fmt6(numeric)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _fmt6';
  ASSERT NOT has_function_privilege('authenticated', 'public._sports_odds_exact_match(text, text)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _sports_odds_exact_match';
  ASSERT NOT has_function_privilege('authenticated', 'public._guard_funding_rates_nonzero()', 'EXECUTE'),
    'authenticated must NOT EXECUTE _guard_funding_rates_nonzero';

  -- Post-Apex P1/P2 (20260716000001_engine_post_apex_p1_p2_hardening)
  ASSERT to_regclass('public.circuit_breaker_state') IS NOT NULL,
    'circuit_breaker_state must exist';
  ASSERT to_regclass('public.notification_provider_capabilities') IS NOT NULL,
    'notification_provider_capabilities must exist';
  ASSERT NOT has_table_privilege('anon', 'public.circuit_breaker_state', 'SELECT'),
    'anon must NOT SELECT circuit_breaker_state';
  ASSERT has_table_privilege('authenticated', 'public.circuit_breaker_state', 'SELECT'),
    'authenticated must SELECT circuit_breaker_state (admin RLS)';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_service_assess_circuit_breaker(text, text, text)', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_service_assess_circuit_breaker';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_assess_circuit_breaker(text, text, text)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_assess_circuit_breaker';
  ASSERT has_function_privilege('service_role', 'public.rpc_service_record_circuit_breaker_outcome(text, text, text, boolean, text, text)', 'EXECUTE'),
    'service_role must EXECUTE rpc_service_record_circuit_breaker_outcome';

  -- Trade Desk P3-B — entry RPC + cron worker GRANT pins (Launch RC §4E advisory · S0 residual)
  ASSERT NOT has_function_privilege('anon', 'public.rpc_open_futures_position(text,text,text,text,text,text,text,text)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_open_futures_position';
  ASSERT has_function_privilege('authenticated', 'public.rpc_open_futures_position(text,text,text,text,text,text,text,text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_open_futures_position';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_close_futures_position(uuid)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_close_futures_position';
  ASSERT has_function_privilege('authenticated', 'public.rpc_close_futures_position(uuid)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_close_futures_position';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_spot_market_buy(text,text,text,text)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_spot_market_buy (4-arg canonical)';
  ASSERT has_function_privilege('authenticated', 'public.rpc_spot_market_buy(text,text,text,text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_spot_market_buy (4-arg canonical)';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_spot_market_buy(text,text)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_spot_market_buy (legacy wrapper)';
  ASSERT has_function_privilege('authenticated', 'public.rpc_spot_market_buy(text,text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_spot_market_buy (legacy wrapper)';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_spot_market_sell(text,text,text,text)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_spot_market_sell (4-arg canonical)';
  ASSERT has_function_privilege('authenticated', 'public.rpc_spot_market_sell(text,text,text,text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_spot_market_sell (4-arg canonical)';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_spot_market_sell(text,text)', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_spot_market_sell (legacy wrapper)';
  ASSERT has_function_privilege('authenticated', 'public.rpc_spot_market_sell(text,text)', 'EXECUTE'),
    'authenticated must EXECUTE rpc_spot_market_sell (legacy wrapper)';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_run_spot_order_fills()', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_run_spot_order_fills (cron/service only)';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_run_spot_order_fills()', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_run_spot_order_fills';
  ASSERT has_function_privilege('service_role', 'public.rpc_run_spot_order_fills()', 'EXECUTE'),
    'service_role must EXECUTE rpc_run_spot_order_fills';
  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_run_funding_accrual()', 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_run_funding_accrual (cron/service only)';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_run_funding_accrual()', 'EXECUTE'),
    'anon must NOT EXECUTE rpc_run_funding_accrual';
  ASSERT has_function_privilege('service_role', 'public.rpc_run_funding_accrual()', 'EXECUTE'),
    'service_role must EXECUTE rpc_run_funding_accrual';
  ASSERT NOT has_function_privilege('authenticated', 'public._fill_house_spot_order(uuid)', 'EXECUTE'),
    'authenticated must NOT EXECUTE _fill_house_spot_order (T1 settlement internal)';

  RAISE NOTICE 'GRANTS RLS INVENTORY OK — pinned role/table privileges match migrations 000045/053–055, affiliate approvals, sportsbook S1–S7, P0 edge contracts, and Trade Desk P3-B entry/cron pins';
END;
$$;

ROLLBACK;
