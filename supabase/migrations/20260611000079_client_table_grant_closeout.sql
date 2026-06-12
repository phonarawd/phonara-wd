-- ============================================================
-- Client table GRANT closeout
-- ============================================================
-- RLS remains the row-level boundary, but client roles should not retain broad
-- base-table write grants. This migration resets anon/authenticated table
-- privileges and re-grants only shipped direct-read surfaces plus the few
-- direct client-owned write surfaces that intentionally use RLS.
-- ============================================================

SET search_path = public, pg_temp;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Public unauthenticated read surfaces. RLS policies still constrain rows.
GRANT SELECT ON
  app_config,
  futures_markets,
  spot_markets,
  oracle_prices,
  price_ticks,
  market_circuit_breakers,
  staking_pools,
  game_seed_reveals,
  rpc_rate_limit_configs,
  v_game_rounds_public
TO anon;

-- Authenticated app/admin direct reads. Writes go through guarded RPCs unless
-- explicitly allowlisted below.
GRANT SELECT ON
  admin_review_queue,
  affiliate_commission_approvals,
  affiliate_commission_daily_aggregates,
  affiliate_elite_overrides,
  affiliate_relationships,
  affiliate_settlement_events,
  affiliate_settlements,
  affiliate_tier_configs,
  affiliate_tier_snapshots,
  app_config,
  audit_logs,
  bank_incoming_transfers,
  daily_claims,
  deposit_reconciliation_jobs,
  exchange_rate_snapshots,
  futures_markets,
  futures_positions,
  game_bets,
  game_seed_reveals,
  krw_deposit_requests,
  kyc_submissions,
  liquidation_run_log,
  market_circuit_breakers,
  market_sources,
  missions,
  ops_alerts,
  oracle_prices,
  oracle_source_prices,
  position_ledger,
  price_change_audit,
  price_ticks,
  profiles,
  push_subscriptions,
  reconciliation_log,
  referrals,
  rg_block_events,
  rg_exclusions,
  rg_loss_tracking,
  rg_user_limits,
  risk_flags,
  rpc_rate_limit_buckets,
  rpc_rate_limit_configs,
  sanctions_screenings,
  spot_markets,
  spot_trades,
  staking_pools,
  staking_positions,
  staking_rewards,
  str_cases,
  system_account_ledger,
  system_accounts,
  treasury_reserves,
  user_consents,
  user_streaks,
  v_game_rounds_public,
  v_user_consent_latest,
  wallet_ledger,
  wallets,
  welcome_bonuses,
  withdrawal_requests
TO authenticated;

GRANT SELECT (
  id,
  user_id,
  spun_date,
  prize_index,
  phon_awarded,
  server_seed_hash,
  ledger_entry_id,
  created_at
) ON roulette_spins TO authenticated;

-- Intentional direct client writes with RLS:
-- - profiles: user may update only mutable own-profile fields.
-- - push_subscriptions: user may manage only own browser push subscription rows.
GRANT UPDATE ON profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;

-- Service role remains the automation/server-side owner surface.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
