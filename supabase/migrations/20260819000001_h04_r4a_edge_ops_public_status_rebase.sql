-- H-04 / EXT-01 / C-02 follow-up — Platform audit R4-a (audit-r4-market-ops)
-- 1) edge_ops_events status: separate ok/partial/error outcomes (false-green fix)
-- 2) rpc_get_public_platform_status — sanitized public lane health (no secrets/metrics)
-- 3) rpc_admin_rebase_resume_market — per-symbol Admin+AAL2 rebase+resume (no bulk)

SET search_path = public, pg_temp;

-- ─── 1) edge_ops_events status enum expansion ────────────────────────────────

ALTER TABLE public.edge_ops_events
  DROP CONSTRAINT IF EXISTS edge_ops_events_status_check;

ALTER TABLE public.edge_ops_events
  ADD CONSTRAINT edge_ops_events_status_check
  CHECK (
    status IN (
      'ok',
      'error',
      'partial',
      'circuit_open',
      'rpc_failed',
      'rejected',
      'missing_config'
    )
  );

CREATE OR REPLACE FUNCTION rpc_service_record_edge_ops_event(
  p_request_id TEXT,
  p_function_name TEXT,
  p_event_key TEXT,
  p_status TEXT,
  p_duration_ms INT DEFAULT NULL,
  p_duration_bucket TEXT DEFAULT NULL,
  p_batch_count INT DEFAULT NULL,
  p_skipped_count INT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'service_role_only';
  END IF;

  IF p_status NOT IN (
    'ok',
    'error',
    'partial',
    'circuit_open',
    'rpc_failed',
    'rejected',
    'missing_config'
  ) THEN
    RAISE EXCEPTION 'invalid_edge_ops_status';
  END IF;

  INSERT INTO edge_ops_events (
    request_id, function_name, event_key, status,
    duration_ms, duration_bucket, batch_count, skipped_count,
    error_code, metadata
  ) VALUES (
    p_request_id,
    p_function_name,
    p_event_key,
    p_status,
    p_duration_ms,
    p_duration_bucket,
    p_batch_count,
    p_skipped_count,
    p_error_code,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'id', v_id,
    'requestId', p_request_id,
    'eventKey', p_event_key,
    'status', p_status
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_record_edge_ops_event(TEXT, TEXT, TEXT, TEXT, INT, TEXT, INT, INT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_record_edge_ops_event(TEXT, TEXT, TEXT, TEXT, INT, TEXT, INT, INT, TEXT, JSONB)
  TO service_role;

-- ─── 2) Public platform status (sanitized — lane + reason category only) ─────

CREATE OR REPLACE FUNCTION rpc_get_public_platform_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_halt TEXT;
  v_lanes JSONB := '[]'::JSONB;
  v_overall TEXT := 'operational';
  v_lane_status TEXT;
  v_reason TEXT;
  v_checked TIMESTAMPTZ;
  v_halted_markets INT := 0;
  v_total_markets INT := 0;
  v_price_feed_bad INT := 0;
  v_crypto_bad INT := 0;
  v_crypto_missing INT := 0;
  v_odds_newest TIMESTAMPTZ;
  v_withdrawal TEXT;
BEGIN
  SELECT value INTO v_halt FROM app_config WHERE key = 'system_halt';
  SELECT value INTO v_withdrawal FROM app_config WHERE key = 'feature_withdrawal_enabled';

  -- earn
  IF COALESCE(v_halt, 'false') = 'true' THEN
    v_lane_status := 'outage';
    v_reason := 'system_halt';
  ELSE
    v_lane_status := 'operational';
    v_reason := 'none';
  END IF;
  v_lanes := v_lanes || jsonb_build_object(
    'id', 'earn',
    'status', v_lane_status,
    'reasonCategory', v_reason,
    'checkedAt', v_now
  );
  IF v_lane_status = 'outage' THEN v_overall := 'outage';
  ELSIF v_lane_status = 'degraded' AND v_overall = 'operational' THEN v_overall := 'degraded';
  END IF;

  -- wallet
  SELECT COUNT(*)::INT INTO v_crypto_bad
    FROM provider_health
   WHERE domain = 'crypto_deposit'
     AND status IN ('unavailable', 'degraded');
  SELECT COUNT(*)::INT INTO v_crypto_missing
    FROM provider_health
   WHERE domain = 'crypto_deposit'
     AND status = 'missing_config';

  IF COALESCE(v_halt, 'false') = 'true' THEN
    v_lane_status := 'outage';
    v_reason := 'system_halt';
  ELSIF v_crypto_bad > 0 THEN
    v_lane_status := 'degraded';
    v_reason := 'provider_unavailable';
  ELSIF v_crypto_missing > 0 THEN
    v_lane_status := 'degraded';
    v_reason := 'provider_degraded';
  ELSIF COALESCE(v_withdrawal, 'true') = 'false' THEN
    v_lane_status := 'degraded';
    v_reason := 'feature_disabled';
  ELSE
    v_lane_status := 'operational';
    v_reason := 'none';
  END IF;
  v_lanes := v_lanes || jsonb_build_object(
    'id', 'wallet',
    'status', v_lane_status,
    'reasonCategory', v_reason,
    'checkedAt', v_now
  );
  IF v_lane_status = 'outage' THEN v_overall := 'outage';
  ELSIF v_lane_status = 'degraded' AND v_overall <> 'outage' THEN v_overall := 'degraded';
  END IF;

  -- trade
  SELECT
    COUNT(*) FILTER (WHERE is_halted)::INT,
    COUNT(*)::INT
  INTO v_halted_markets, v_total_markets
  FROM market_circuit_breakers;

  SELECT COUNT(*)::INT INTO v_price_feed_bad
    FROM provider_health
   WHERE domain = 'price_feed'
     AND status IN ('unavailable', 'degraded', 'missing_config');

  IF COALESCE(v_halt, 'false') = 'true' THEN
    v_lane_status := 'outage';
    v_reason := 'system_halt';
  ELSIF v_total_markets > 0 AND v_halted_markets = v_total_markets THEN
    v_lane_status := 'outage';
    v_reason := 'market_halt';
  ELSIF v_halted_markets > 0 OR v_price_feed_bad > 0 THEN
    v_lane_status := 'degraded';
    v_reason := CASE WHEN v_halted_markets > 0 THEN 'market_halt' ELSE 'provider_degraded' END;
  ELSE
    v_lane_status := 'operational';
    v_reason := 'none';
  END IF;
  v_lanes := v_lanes || jsonb_build_object(
    'id', 'trade',
    'status', v_lane_status,
    'reasonCategory', v_reason,
    'checkedAt', v_now
  );
  IF v_lane_status = 'outage' THEN v_overall := 'outage';
  ELSIF v_lane_status = 'degraded' AND v_overall <> 'outage' THEN v_overall := 'degraded';
  END IF;

  -- sports
  SELECT MAX(captured_at) INTO v_odds_newest FROM sports_odds_snapshots;
  v_checked := COALESCE(v_odds_newest, v_now);

  IF COALESCE(v_halt, 'false') = 'true' THEN
    v_lane_status := 'outage';
    v_reason := 'system_halt';
  ELSIF v_odds_newest IS NULL OR v_odds_newest < v_now - INTERVAL '24 hours' THEN
    v_lane_status := 'degraded';
    v_reason := 'data_stale';
  ELSE
    v_lane_status := 'operational';
    v_reason := 'none';
  END IF;
  v_lanes := v_lanes || jsonb_build_object(
    'id', 'sports',
    'status', v_lane_status,
    'reasonCategory', v_reason,
    'checkedAt', v_checked
  );
  IF v_lane_status = 'outage' THEN v_overall := 'outage';
  ELSIF v_lane_status = 'degraded' AND v_overall <> 'outage' THEN v_overall := 'degraded';
  END IF;

  -- casino
  IF COALESCE(v_halt, 'false') = 'true' THEN
    v_lane_status := 'outage';
    v_reason := 'system_halt';
  ELSE
    v_lane_status := 'operational';
    v_reason := 'none';
  END IF;
  v_lanes := v_lanes || jsonb_build_object(
    'id', 'casino',
    'status', v_lane_status,
    'reasonCategory', v_reason,
    'checkedAt', v_now
  );
  IF v_lane_status = 'outage' THEN v_overall := 'outage';
  ELSIF v_lane_status = 'degraded' AND v_overall <> 'outage' THEN v_overall := 'degraded';
  END IF;

  RETURN jsonb_build_object(
    'checkedAt', v_now,
    'overall', v_overall,
    'lanes', v_lanes
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_public_platform_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_get_public_platform_status() TO anon, authenticated, service_role;

-- ─── 3) Symbol-level rebase + resume (Admin AAL2 · fresh quorum · no bulk) ────

CREATE OR REPLACE FUNCTION rpc_admin_rebase_resume_market(
  p_symbol TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_before JSONB;
  v_after JSONB;
  v_median NUMERIC;
  v_median_text TEXT;
  v_old_price TEXT;
  v_staleness_s INT;
  v_outlier_pct NUMERIC;
  v_min_sources INT;
  v_effective INT := 0;
  v_halted BOOLEAN;
BEGIN
  IF v_actor IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  PERFORM _assert_admin_aal2();

  IF p_symbol IS NULL OR length(btrim(p_symbol)) = 0 THEN
    RAISE EXCEPTION 'invalid_symbol';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  -- Explicit single-symbol only — reject wildcard / CSV bulk attempts.
  IF position(',' IN p_symbol) > 0 OR position('*' IN p_symbol) > 0 OR position('%' IN p_symbol) > 0 THEN
    RAISE EXCEPTION 'bulk_resume_forbidden';
  END IF;

  SELECT is_halted INTO v_halted
    FROM market_circuit_breakers
   WHERE symbol = p_symbol
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'market_not_found';
  END IF;
  IF NOT COALESCE(v_halted, FALSE) THEN
    RAISE EXCEPTION 'market_not_halted';
  END IF;

  v_before := _snapshot_trade_market_state(p_symbol);
  SELECT price INTO v_old_price FROM oracle_prices WHERE symbol = p_symbol;

  v_median := _compute_oracle_median(p_symbol);
  IF v_median IS NULL OR v_median <= 0 THEN
    RAISE EXCEPTION 'insufficient_sources';
  END IF;
  v_median_text := _fmt6(v_median);

  SELECT value::INT INTO v_staleness_s FROM app_config WHERE key = 'oracle_staleness_seconds';
  SELECT value::NUMERIC INTO v_outlier_pct FROM app_config WHERE key = 'oracle_outlier_pct';
  SELECT COALESCE(
           (SELECT value::INT FROM app_config WHERE key = 'oracle_min_sources:' || p_symbol),
           (SELECT value::INT FROM app_config WHERE key = 'oracle_min_sources'),
           2
         )
    INTO v_min_sources;
  v_staleness_s := COALESCE(v_staleness_s, 120);
  v_outlier_pct := COALESCE(v_outlier_pct, 5);
  v_min_sources := GREATEST(COALESCE(v_min_sources, 2), 2);

  SELECT COUNT(*)::INT INTO v_effective
    FROM oracle_source_prices
   WHERE symbol = p_symbol
     AND submitted_at > NOW() - (v_staleness_s || ' seconds')::INTERVAL
     AND (
       v_outlier_pct <= 0
       OR ABS(price::NUMERIC / v_median - 1) * 100 <= v_outlier_pct
     );

  IF v_effective < v_min_sources THEN
    RAISE EXCEPTION 'quorum_not_met'
      USING HINT = format('effective=%s min=%s', v_effective, v_min_sources);
  END IF;

  -- Admin rebase may write settlement while halted (source snapshots already preserved).
  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES (p_symbol, v_median_text, NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

  INSERT INTO price_ticks (symbol, price) VALUES (p_symbol, v_median_text);

  INSERT INTO price_change_audit (
    symbol, price_before, price_after, change_pct, source, actor_id, reason, circuit_breaker_triggered
  ) VALUES (
    p_symbol,
    v_old_price,
    v_median_text,
    CASE
      WHEN v_old_price IS NOT NULL AND v_old_price::NUMERIC > 0
        THEN abs((v_median / v_old_price::NUMERIC - 1) * 100)
      ELSE 0
    END,
    'admin_rebase',
    v_actor,
    btrim(p_reason),
    FALSE
  );

  UPDATE market_circuit_breakers SET
    is_halted = FALSE,
    halt_reason = NULL,
    resumed_at = NOW(),
    updated_at = NOW()
  WHERE symbol = p_symbol;

  UPDATE futures_markets SET is_active = TRUE WHERE symbol = p_symbol;
  UPDATE spot_markets SET is_active = TRUE WHERE symbol = p_symbol;

  v_after := _snapshot_trade_market_state(p_symbol);

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (
    v_actor,
    'trade_market_rebase_resume',
    'market_circuit_breakers',
    jsonb_build_object(
      'symbol', p_symbol,
      'reason', btrim(p_reason),
      'median', v_median_text,
      'effectiveSources', v_effective,
      'minSources', v_min_sources,
      'before', v_before,
      'after', v_after
    )
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'symbol', p_symbol,
    'resumed', TRUE,
    'rebased', TRUE,
    'median', v_median_text,
    'effectiveSources', v_effective,
    'before', v_before,
    'after', v_after
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_rebase_resume_market(TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_rebase_resume_market(TEXT, TEXT)
  TO authenticated, service_role;
