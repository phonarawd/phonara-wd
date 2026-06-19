-- ============================================================
-- Migration: 20260619000124_advisor_unindexed_foreign_keys
-- ============================================================
-- Performance-advisor cleanup (unindexed_foreign_keys):
-- Add btree indexes on FK columns flagged by Supabase advisor.
-- CREATE INDEX IF NOT EXISTS — idempotent, no data change.
-- ============================================================

SET search_path = public, pg_temp;

DO $$
DECLARE
  r RECORD;
  v_idx_name TEXT;
BEGIN
  FOR r IN
    SELECT
      c.conname,
      t.relname AS table_name,
      a.attname AS column_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE n.nspname = 'public'
      AND c.contype = 'f'
      AND c.conname IN (
        'admin_review_queue_resolved_by_fkey',
        'admin_review_queue_user_id_fkey',
        'affiliate_commission_approvals_approved_by_fkey',
        'affiliate_elite_overrides_updated_by_fkey',
        'affiliate_settlements_tier_code_fkey',
        'affiliate_tier_snapshots_computed_tier_code_fkey',
        'affiliate_tier_snapshots_tier_code_fkey',
        'crypto_deposit_requests_wallet_id_fkey',
        'daily_claims_ledger_entry_id_fkey',
        'deposit_reconciliation_jobs_operator_id_fkey',
        'exchange_rate_snapshots_created_by_fkey',
        'futures_positions_first_breach_tick_id_fkey',
        'game_bets_payout_ledger_id_fkey',
        'game_bets_stake_lock_id_fkey',
        'krw_deposit_requests_rate_snapshot_id_fkey',
        'krw_deposit_requests_wallet_id_fkey',
        'kyc_submissions_reviewed_by_fkey',
        'missions_ledger_entry_id_fkey',
        'ops_alerts_acknowledged_by_fkey',
        'ops_alerts_resolved_by_fkey',
        'price_change_audit_actor_id_fkey',
        'referrals_referred_ledger_id_fkey',
        'referrals_referrer_ledger_id_fkey',
        'rg_exclusions_release_requested_by_fkey',
        'rg_exclusions_released_by_fkey',
        'risk_flags_cleared_by_fkey',
        'roulette_spins_ledger_entry_id_fkey',
        'rpc_rate_limit_buckets_rpc_name_fkey',
        'sports_bet_legs_outcome_id_fkey',
        'sports_bets_cashout_ledger_id_fkey',
        'sports_bets_payout_ledger_id_fkey',
        'sports_bets_stake_lock_id_fkey',
        'sports_device_signals_bet_id_fkey',
        'sports_user_risk_profiles_updated_by_fkey',
        'staking_positions_pool_id_fkey',
        'staking_rewards_ledger_entry_id_fkey',
        'str_cases_user_id_fkey',
        'system_account_ledger_related_user_id_fkey',
        'treasury_reserves_updated_by_fkey',
        'viral_mission_claims_ledger_entry_id_fkey',
        'welcome_bonuses_ledger_entry_id_fkey',
        'withdrawal_requests_approved_by_fkey',
        'withdrawal_requests_ledger_approve_debit_id_fkey',
        'withdrawal_requests_ledger_debit_id_fkey',
        'withdrawal_requests_ledger_lock_id_fkey',
        'withdrawal_requests_ledger_reject_unlock_id_fkey',
        'withdrawal_requests_rejected_by_fkey',
        'withdrawal_requests_sent_by_fkey',
        'withdrawal_requests_wallet_id_fkey'
      )
      AND NOT EXISTS (
        SELECT 1
          FROM pg_index i
         WHERE i.indrelid = c.conrelid
           AND i.indisvalid
           AND c.conkey[1] = ANY (i.indkey::smallint[])
      )
  LOOP
    v_idx_name := left(replace(r.conname, '_fkey', '_idx'), 63);
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
      v_idx_name,
      r.table_name,
      r.column_name
    );
  END LOOP;
END;
$$;
