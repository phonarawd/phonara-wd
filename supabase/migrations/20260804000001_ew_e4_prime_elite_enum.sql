-- ============================================================
-- Migration: ew_e4_prime_elite_enum
-- E4 Option B — ADD VALUE prime_elite (must commit before use · PG 55P04)
-- Plan: ew-e4-tier-option-b-wave (#246) · ADR-013
-- Body: 20260804000002_ew_e4_tier_option_b.sql
-- ============================================================

SET search_path = public, pg_temp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'earn_vip_tier'
       AND e.enumlabel = 'prime_elite'
  ) THEN
    ALTER TYPE earn_vip_tier ADD VALUE 'prime_elite';
  END IF;
END;
$$;
