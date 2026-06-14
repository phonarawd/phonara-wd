-- ============================================================
-- Casino observability: per-game RTP aggregates, drift alerts, RPC SLO
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE VIEW casino_game_rtp_stats
WITH (security_invoker = true) AS
SELECT
  gb.game,
  gb.currency,
  COUNT(*)::BIGINT AS bet_count,
  SUM(gb.stake::NUMERIC) AS total_stake,
  SUM(gb.payout::NUMERIC) AS total_payout,
  CASE
    WHEN SUM(gb.stake::NUMERIC) > 0
    THEN ROUND(SUM(gb.payout::NUMERIC) / SUM(gb.stake::NUMERIC), 6)
    ELSE 0
  END AS measured_rtp,
  CASE
    WHEN SUM(gb.stake::NUMERIC) > 0
    THEN ROUND(1 - (SUM(gb.payout::NUMERIC) / SUM(gb.stake::NUMERIC)), 6)
    ELSE 0
  END AS measured_house_edge
FROM game_bets gb
WHERE gb.status IN ('won', 'lost')
  AND gb.settled_at >= NOW() - INTERVAL '24 hours'
GROUP BY gb.game, gb.currency;

GRANT SELECT ON casino_game_rtp_stats TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_check_casino_rtp_drift()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row RECORD;
  v_theoretical NUMERIC;
  v_tolerance NUMERIC := 0.05;
  v_min_bets INT := 500;
  v_tripped INT := 0;
  v_alerts INT := 0;
BEGIN
  IF NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_row IN SELECT * FROM casino_game_rtp_stats WHERE bet_count >= v_min_bets LOOP
    v_theoretical := CASE v_row.game::TEXT
      WHEN 'roulette' THEN 36.0 / 37.0
      ELSE NULL
    END;

    IF v_theoretical IS NULL THEN
      CONTINUE;
    END IF;

    IF ABS(v_row.measured_rtp - v_theoretical) > v_tolerance THEN
      v_alerts := v_alerts + 1;
      IF NOT EXISTS (
        SELECT 1 FROM ops_alerts
         WHERE dedupe_key = 'casino_rtp_drift:' || v_row.game::TEXT || ':' || v_row.currency::TEXT
           AND status IN ('open', 'acknowledged')
      ) THEN
        INSERT INTO ops_alerts (
          dedupe_key, source_check_id, severity, status,
          title, detail, payload
        ) VALUES (
          'casino_rtp_drift:' || v_row.game::TEXT || ':' || v_row.currency::TEXT,
          'casino_rtp_drift',
          'high',
          'open',
          'Casino RTP drift detected',
          v_row.game::TEXT || ' ' || v_row.currency::TEXT || ' measured=' || v_row.measured_rtp::TEXT,
          jsonb_build_object(
            'game', v_row.game,
            'currency', v_row.currency,
            'measured_rtp', v_row.measured_rtp,
            'theoretical_rtp', v_theoretical,
            'bet_count', v_row.bet_count
          )
        );
      END IF;

      UPDATE app_config
         SET value = 'false', updated_at = NOW()
       WHERE key = 'feature_game_' || v_row.game::TEXT || '_enabled';

      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
      VALUES (
        auth.uid(),
        'casino_rtp_drift_kill_switch',
        'app_config',
        NULL,
        jsonb_build_object('game', v_row.game, 'currency', v_row.currency, 'measured_rtp', v_row.measured_rtp)
      );

      v_tripped := v_tripped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('alerts_opened', v_alerts, 'kill_switches_tripped', v_tripped);
END;
$$;

REVOKE ALL ON FUNCTION rpc_check_casino_rtp_drift() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_check_casino_rtp_drift() TO authenticated, service_role;

INSERT INTO app_config (key, value, description) VALUES
  ('casino_rpc_place_bet_p95_ms', '120', 'SLO budget p95 latency for rpc_place_game_bet (milliseconds).')
ON CONFLICT (key) DO NOTHING;
