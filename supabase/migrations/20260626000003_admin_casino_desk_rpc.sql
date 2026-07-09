-- Admin Casino Desk — catalog read + per-game status (engine-backed /casino)
-- Display aggregates only · money paths unchanged.

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _admin_casino_theoretical_rtp_pct(p_game game_code)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE p_game::TEXT
    WHEN 'roulette' THEN to_char(ROUND((36.0 / 37.0) * 100, 2), 'FM999990.00')
    WHEN 'blackjack' THEN '99.50'
    WHEN 'mines' THEN '97.00'
    ELSE '99.00'
  END;
$$;

REVOKE ALL ON FUNCTION _admin_casino_theoretical_rtp_pct(game_code) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_list_casino_catalog()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rows JSONB;
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - INTERVAL '24 hours';
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'game_key'), '[]'::JSONB)
  INTO v_rows
  FROM (
    SELECT jsonb_build_object(
      'game_key', g.game::TEXT,
      'enabled', COALESCE(
        (
          SELECT ac.value = 'true'
          FROM app_config ac
          WHERE ac.key = 'feature_game_' || g.game::TEXT || '_enabled'
        ),
        FALSE
      ),
      'status', COALESCE(
        (
          SELECT ac.value
          FROM app_config ac
          WHERE ac.key = 'casino_game_status_' || g.game::TEXT
        ),
        CASE
          WHEN COALESCE(
            (
              SELECT ac.value = 'true'
              FROM app_config ac
              WHERE ac.key = 'feature_game_' || g.game::TEXT || '_enabled'
            ),
            FALSE
          ) THEN 'live'
          ELSE 'disabled'
        END
      ),
      'theoretical_rtp_pct', _admin_casino_theoretical_rtp_pct(g.game),
      'observed_rtp_pct', (
        SELECT CASE
          WHEN SUM(s.total_stake) > 0 THEN
            to_char(ROUND((SUM(s.total_payout) / SUM(s.total_stake)) * 100, 2), 'FM999990.00')
          ELSE NULL
        END
        FROM casino_game_rtp_stats s
        WHERE s.game = g.game
      ),
      'bet_count_24h', COALESCE(
        (
          SELECT SUM(s.bet_count)::TEXT
          FROM casino_game_rtp_stats s
          WHERE s.game = g.game
        ),
        '0'
      ),
      'parity_hold_count', COALESCE(
        (
          SELECT COUNT(*)::TEXT
          FROM game_bets gb
          WHERE gb.game = g.game
            AND gb.parity_hold = TRUE
            AND gb.status = 'pending'
        ),
        '0'
      )
    ) AS row
    FROM unnest(enum_range(NULL::game_code)) AS g(game)
  ) sub;

  RETURN jsonb_build_object(
    'games', v_rows,
    'fetched_at', v_now,
    'window_start', v_window_start
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_set_casino_game_status(
  p_game TEXT,
  p_status TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_game game_code;
  v_status_key TEXT;
  v_feature_key TEXT;
  v_rows INT;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();

  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  IF p_status NOT IN ('live', 'maintenance', 'disabled') THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  BEGIN
    v_game := p_game::game_code;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'invalid_game_code';
  END;

  v_status_key := 'casino_game_status_' || p_game;
  v_feature_key := 'feature_game_' || p_game || '_enabled';

  INSERT INTO app_config (key, value, description)
  VALUES (
    v_status_key,
    p_status,
    'Admin casino desk status · ' || p_game
  )
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = NOW();

  UPDATE app_config
     SET value = CASE WHEN p_status = 'live' THEN 'true' ELSE 'false' END,
         updated_at = NOW()
   WHERE key = v_feature_key;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'invalid_game_code';
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    auth.uid(),
    'admin_casino_game_status',
    'app_config',
    NULL,
    jsonb_build_object(
      'game', p_game,
      'status', p_status,
      'reason', btrim(p_reason)
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'game', p_game, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_casino_catalog() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_admin_set_casino_game_status(TEXT, TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rpc_admin_list_casino_catalog() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_admin_set_casino_game_status(TEXT, TEXT, TEXT) TO authenticated, service_role;
