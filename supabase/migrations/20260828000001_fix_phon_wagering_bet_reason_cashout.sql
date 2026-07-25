-- ============================================================
-- Migration: 20260828000001_fix_phon_wagering_bet_reason_cashout
-- Fix: sports partial-cashout debit must NOT count as wagering progress
-- ============================================================
-- Bug (SYSTEM_AUDIT_2026-07-13/02_DATABASE.md):
--   `_is_phon_wagering_bet_reason` used `LIKE 'sports_%'`, so
--   `sports_stake_cashout` (partial cashout stake debit) was treated as a
--   new bet → `_apply_wagering_progress` over-reduced wagering_remaining.
--
-- Also:
--   - Broad `LIKE 'game_%'` double-counted settle after lock (`game_stake_lock`
--     already applies progress; `game_stake_settle` must not).
--   - Dead `LIKE 'gbet_%'` branch removed — ledger reason_codes use `game_*`;
--     `gbet_*` is idempotency-key prefix only.
--
-- Fix: allowlist only NEW stake-commitment reasons.
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _is_phon_wagering_bet_reason(p_reason_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- Count wagering only on new stake commitment (lock / open / trade spend).
  -- Settlement, unlock, refund, and cashout debits are excluded — stake was
  -- already counted at lock time; cashout is not a new bet.
  SELECT p_reason_code IN (
    'game_stake_lock',
    'sports_stake_lock',
    'futures_open_fee',
    'futures_margin_lock',
    'spot_buy',
    'spot_sell',
    'staking_stake'
  );
$$;

REVOKE ALL ON FUNCTION _is_phon_wagering_bet_reason(TEXT) FROM PUBLIC, anon, authenticated;
