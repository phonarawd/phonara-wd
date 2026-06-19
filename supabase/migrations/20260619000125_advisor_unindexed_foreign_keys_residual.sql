-- ============================================================
-- Migration: 20260619000125_advisor_unindexed_foreign_keys_residual
-- ============================================================
-- Residual unindexed_foreign_keys (00124 NOT EXISTS guard skipped these).
-- Explicit btree indexes on FK columns — idempotent.
-- ============================================================

SET search_path = public, pg_temp;

CREATE INDEX IF NOT EXISTS affiliate_tier_snapshots_tier_code_idx
  ON public.affiliate_tier_snapshots (tier_code);

CREATE INDEX IF NOT EXISTS rpc_rate_limit_buckets_rpc_name_idx
  ON public.rpc_rate_limit_buckets (rpc_name);

CREATE INDEX IF NOT EXISTS sports_bet_legs_outcome_id_idx
  ON public.sports_bet_legs (outcome_id);
