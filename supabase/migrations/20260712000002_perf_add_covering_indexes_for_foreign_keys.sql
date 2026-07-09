-- Archived from remote migration 20260630065909 (name parity for local db reset)
-- Source: Supabase Management API (read-only audit closeout)

-- Add covering indexes for unindexed foreign keys (perf advisor lint 0001).
-- Pure additive change: improves join/delete performance, no behavior change.
CREATE INDEX IF NOT EXISTS idx_admin_role_grants_updated_by ON public.admin_role_grants (updated_by);
CREATE INDEX IF NOT EXISTS idx_bonus_wagering_requirements_source_ledger_id ON public.bonus_wagering_requirements (source_ledger_id);
CREATE INDEX IF NOT EXISTS idx_bonus_wagering_requirements_wallet_id ON public.bonus_wagering_requirements (wallet_id);
CREATE INDEX IF NOT EXISTS idx_cms_content_created_by ON public.cms_content (created_by);
CREATE INDEX IF NOT EXISTS idx_cms_content_updated_by ON public.cms_content (updated_by);
CREATE INDEX IF NOT EXISTS idx_funding_payments_market ON public.funding_payments (market);
CREATE INDEX IF NOT EXISTS idx_giftcard_deposit_requests_fee_market_id ON public.giftcard_deposit_requests (fee_market_id);
CREATE INDEX IF NOT EXISTS idx_giftcard_deposit_requests_rate_snapshot_id ON public.giftcard_deposit_requests (rate_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_giftcard_deposit_requests_reviewed_by ON public.giftcard_deposit_requests (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_giftcard_deposit_requests_wallet_id ON public.giftcard_deposit_requests (wallet_id);
CREATE INDEX IF NOT EXISTS idx_golden_earth_taps_ledger_entry_id ON public.golden_earth_taps (ledger_entry_id);
CREATE INDEX IF NOT EXISTS idx_mfa_tier_policy_updated_by ON public.mfa_tier_policy (updated_by);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_user_id ON public.notification_outbox (user_id);
CREATE INDEX IF NOT EXISTS idx_repeatable_mission_claims_ledger_entry_id ON public.repeatable_mission_claims (ledger_entry_id);
CREATE INDEX IF NOT EXISTS idx_sports_score_quorum_events_resolved_by ON public.sports_score_quorum_events (resolved_by);
