-- Fix _repeatable_progress: bet_status enum + wallet_ledger column names
-- 22P02: invalid input value for enum bet_status: "settled"
--       column wallet_ledger.entry_type does not exist (use reason_code)

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _repeatable_progress(
  p_user_id UUID,
  p_mission repeatable_mission_code
)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_week_start TIMESTAMPTZ := date_trunc('week', NOW() AT TIME ZONE 'UTC');
BEGIN
  CASE p_mission
    WHEN 'weekly_play5' THEN
      RETURN (
        SELECT COUNT(*)::INT
          FROM game_bets
         WHERE user_id = p_user_id
           AND settled_at >= v_week_start
           AND status IN ('won', 'lost')
      );
    WHEN 'weekly_win3' THEN
      RETURN (
        SELECT COUNT(*)::INT
          FROM game_bets
         WHERE user_id = p_user_id
           AND settled_at >= v_week_start
           AND status = 'won'
      );
    WHEN 'weekly_deposit_once' THEN
      RETURN (
        SELECT CASE WHEN EXISTS (
          SELECT 1
            FROM wallet_ledger wl
           WHERE wl.user_id = p_user_id
             AND wl.direction = 'credit'
             AND wl.reason_code IN ('krw_deposit_credit', 'crypto_deposit_credit')
             AND wl.created_at >= v_week_start
        ) THEN 1 ELSE 0 END
      );
    WHEN 'weekly_spin_daily' THEN
      RETURN (
        SELECT COUNT(DISTINCT spun_date)::INT
          FROM roulette_spins
         WHERE user_id = p_user_id
           AND spun_date >= v_week_start::DATE
      );
    WHEN 'weekly_login_all' THEN
      RETURN (
        SELECT COUNT(DISTINCT claimed_date)::INT
          FROM daily_claims
         WHERE user_id = p_user_id
           AND claimed_date >= v_week_start::DATE
      );
    WHEN 'daily_today_spin' THEN
      RETURN (
        SELECT CASE WHEN EXISTS (
          SELECT 1
            FROM roulette_spins
           WHERE user_id = p_user_id
             AND spun_date = CURRENT_DATE
        ) THEN 1 ELSE 0 END
      );
    WHEN 'tier_fomo_streak' THEN
      RETURN COALESCE((SELECT current_streak FROM user_streaks WHERE user_id = p_user_id), 0);
    ELSE
      RETURN 0;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION _repeatable_progress(UUID, repeatable_mission_code) FROM PUBLIC, anon, authenticated;
