-- M-05 / Platform audit R3-c (audit-r3c-search-path-sweep)
-- Pin function-level search_path on the 8 advisor-flagged earn/tier IMMUTABLE
-- helpers that E4 Option B recreated without proconfig (CREATE OR REPLACE
-- dropped the earlier launch_rc pin from 20260626000010).
--
-- Advisor: function_search_path_mutable WARN × 8 → 0
-- Behaviour: ALTER ... SET search_path only — body · grants · volatility unchanged.

SET search_path = public, pg_temp;

DO $$
DECLARE
  r RECORD;
  v_missing TEXT := '';
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        '_earn_tier_index',
        '_earn_limit_roulette',
        '_earn_limit_referral_payout',
        '_earn_limit_viral_share',
        '_earn_limit_daily_quiz',
        '_earn_referral_multiplier',
        '_tier_decay_previous',
        '_tier_decay_xp_cap'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.sig);
  END LOOP;

  -- Fail migration if any of the 8 targets are absent (signature drift).
  FOR r IN
    SELECT unnest(ARRAY[
      '_earn_tier_index',
      '_earn_limit_roulette',
      '_earn_limit_referral_payout',
      '_earn_limit_viral_share',
      '_earn_limit_daily_quiz',
      '_earn_referral_multiplier',
      '_tier_decay_previous',
      '_tier_decay_xp_cap'
    ]) AS proname
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = r.proname
    ) THEN
      v_missing := v_missing || ' ' || r.proname;
    END IF;
  END LOOP;

  IF v_missing <> '' THEN
    RAISE EXCEPTION 'M-05 R3-c search_path sweep: missing helper(s):%', v_missing;
  END IF;
END;
$$;

-- Preserve internal-only EXECUTE surface (E4 REVOKE must remain).
REVOKE ALL ON FUNCTION public._earn_tier_index(earn_vip_tier)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._earn_limit_roulette(earn_vip_tier)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._earn_limit_referral_payout(earn_vip_tier)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._earn_limit_viral_share(earn_vip_tier)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._earn_limit_daily_quiz(earn_vip_tier)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._earn_referral_multiplier(earn_vip_tier)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._tier_decay_previous(earn_vip_tier)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._tier_decay_xp_cap(earn_vip_tier)
  FROM PUBLIC, anon, authenticated;
