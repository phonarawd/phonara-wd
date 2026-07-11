-- ============================================================
-- Migration: ew_e9_app_install_enum
-- E9 — ADD viral_mission_code = app_install (commit before use)
-- Plan: ew-e9-identity-wave · ADR-019
-- ============================================================

SET search_path = public, pg_temp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'viral_mission_code'
       AND e.enumlabel = 'app_install'
  ) THEN
    ALTER TYPE viral_mission_code ADD VALUE 'app_install';
  END IF;
END;
$$;
