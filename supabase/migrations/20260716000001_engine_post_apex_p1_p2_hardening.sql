-- Engine Post-Apex P1/P2: circuit_breaker_state DB authority, notification provider
-- capabilities contract, set_updated_at search_path hygiene.
-- Requires ops_alert_thresholds (20260714000001_p1b_admin_ops_visibility).

-- ─── set_updated_at search_path (advisor hygiene) ───────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── circuit_breaker_state (DB authority — Edge may cache, not own) ─────────
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  provider TEXT NOT NULL,
  domain TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT 'closed'
    CHECK (state IN ('closed', 'open', 'half_open')),
  consecutive_failures INT NOT NULL DEFAULT 0,
  failure_threshold INT NOT NULL DEFAULT 3,
  open_until TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, domain, channel)
);

CREATE INDEX IF NOT EXISTS circuit_breaker_state_domain_idx
  ON circuit_breaker_state (domain, state, updated_at DESC);

ALTER TABLE circuit_breaker_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "circuit_breaker_state: admin read" ON circuit_breaker_state;
CREATE POLICY "circuit_breaker_state: admin read"
  ON circuit_breaker_state FOR SELECT
  USING (_is_admin());

REVOKE ALL ON TABLE circuit_breaker_state FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE circuit_breaker_state TO authenticated;
GRANT ALL ON TABLE circuit_breaker_state TO service_role;

-- ─── notification_provider_capabilities (SQL inventory contract) ────────────
CREATE TABLE IF NOT EXISTS notification_provider_capabilities (
  channel TEXT PRIMARY KEY,
  endpoint_env_key TEXT NOT NULL,
  hmac_secret_env_key TEXT,
  supports_idempotency_key BOOLEAN NOT NULL DEFAULT TRUE,
  supports_hmac BOOLEAN NOT NULL DEFAULT FALSE,
  retry_safe BOOLEAN NOT NULL DEFAULT TRUE,
  max_payload_size INT,
  timeout_ms INT NOT NULL DEFAULT 30000,
  crash_safe_window_ms INT NOT NULL DEFAULT 300000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_provider_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_provider_capabilities: admin read" ON notification_provider_capabilities;
CREATE POLICY "notification_provider_capabilities: admin read"
  ON notification_provider_capabilities FOR SELECT
  USING (_is_admin());

REVOKE ALL ON TABLE notification_provider_capabilities FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE notification_provider_capabilities TO authenticated;
GRANT ALL ON TABLE notification_provider_capabilities TO service_role;

INSERT INTO notification_provider_capabilities (
  channel, endpoint_env_key, hmac_secret_env_key,
  supports_idempotency_key, supports_hmac, retry_safe,
  max_payload_size, timeout_ms, crash_safe_window_ms
) VALUES
  ('email', 'EMAIL_DISPATCH_URL', 'EMAIL_DISPATCH_HMAC_SECRET', TRUE, TRUE, TRUE, 65536, 30000, 300000),
  ('web_push', 'WEB_PUSH_DISPATCH_URL', 'WEB_PUSH_DISPATCH_HMAC_SECRET', TRUE, TRUE, TRUE, 65536, 30000, 300000),
  ('push', 'WEB_PUSH_DISPATCH_URL', 'WEB_PUSH_DISPATCH_HMAC_SECRET', TRUE, TRUE, TRUE, 65536, 30000, 300000),
  ('in_app', '', NULL, TRUE, FALSE, TRUE, NULL, 5000, 60000)
ON CONFLICT (channel) DO NOTHING;

-- ─── Internal: resolve failure threshold from ops_alert_thresholds ───────────
CREATE OR REPLACE FUNCTION _circuit_breaker_failure_threshold(p_domain TEXT)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (
      SELECT t.threshold_value::INT
      FROM ops_alert_thresholds t
      WHERE t.domain = p_domain
        AND t.threshold_key = CASE p_domain
          WHEN 'price_feed' THEN 'ops.price_feed.provider_failure_threshold'
          WHEN 'notification' THEN 'ops.notification.failure_warn_threshold'
          ELSE 'ops.price_feed.provider_failure_threshold'
        END
        AND t.is_active
        AND t.effective_from <= NOW()
      ORDER BY t.effective_from DESC
      LIMIT 1
    ),
    3
  );
$$;

REVOKE ALL ON FUNCTION _circuit_breaker_failure_threshold(TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _circuit_breaker_cooldown_seconds(p_domain TEXT)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (
      SELECT t.window_seconds
      FROM ops_alert_thresholds t
      WHERE t.domain = p_domain
        AND t.threshold_key = CASE p_domain
          WHEN 'price_feed' THEN 'ops.price_feed.provider_failure_threshold'
          WHEN 'notification' THEN 'ops.notification.failure_warn_threshold'
          ELSE 'ops.price_feed.provider_failure_threshold'
        END
        AND t.is_active
        AND t.effective_from <= NOW()
      ORDER BY t.effective_from DESC
      LIMIT 1
    ),
    1800
  );
$$;

REVOKE ALL ON FUNCTION _circuit_breaker_cooldown_seconds(TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── rpc_service_assess_circuit_breaker ─────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_service_assess_circuit_breaker(
  p_provider TEXT,
  p_domain TEXT,
  p_channel TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row circuit_breaker_state%ROWTYPE;
  v_channel TEXT := COALESCE(p_channel, '');
BEGIN
  IF p_provider IS NULL OR btrim(p_provider) = '' OR p_domain IS NULL OR btrim(p_domain) = '' THEN
    RAISE EXCEPTION 'invalid_circuit_breaker_key';
  END IF;

  INSERT INTO circuit_breaker_state (provider, domain, channel, failure_threshold)
  VALUES (
    lower(btrim(p_provider)),
    lower(btrim(p_domain)),
    v_channel,
    _circuit_breaker_failure_threshold(lower(btrim(p_domain)))
  )
  ON CONFLICT (provider, domain, channel) DO NOTHING;

  SELECT * INTO v_row
  FROM circuit_breaker_state
  WHERE provider = lower(btrim(p_provider))
    AND domain = lower(btrim(p_domain))
    AND channel = v_channel
  FOR UPDATE;

  IF v_row.state = 'open' AND v_row.open_until IS NOT NULL AND v_row.open_until > NOW() THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'state', 'open',
      'reason', 'circuit_open',
      'open_until', v_row.open_until,
      'consecutive_failures', v_row.consecutive_failures
    );
  END IF;

  IF v_row.state = 'open' AND (v_row.open_until IS NULL OR v_row.open_until <= NOW()) THEN
    UPDATE circuit_breaker_state
    SET state = 'half_open', updated_at = NOW()
    WHERE provider = v_row.provider AND domain = v_row.domain AND channel = v_row.channel;
    RETURN jsonb_build_object('allowed', TRUE, 'state', 'half_open', 'reason', 'probe');
  END IF;

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'state', v_row.state,
    'consecutive_failures', v_row.consecutive_failures
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_assess_circuit_breaker(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_assess_circuit_breaker(TEXT, TEXT, TEXT)
  TO service_role;

-- ─── rpc_service_record_circuit_breaker_outcome ─────────────────────────────
CREATE OR REPLACE FUNCTION rpc_service_record_circuit_breaker_outcome(
  p_provider TEXT,
  p_domain TEXT,
  p_channel TEXT,
  p_success BOOLEAN,
  p_error_code TEXT DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row circuit_breaker_state%ROWTYPE;
  v_channel TEXT := COALESCE(p_channel, '');
  v_threshold INT;
  v_cooldown INT;
BEGIN
  PERFORM rpc_service_assess_circuit_breaker(p_provider, p_domain, v_channel);

  SELECT * INTO v_row
  FROM circuit_breaker_state
  WHERE provider = lower(btrim(p_provider))
    AND domain = lower(btrim(p_domain))
    AND channel = v_channel
  FOR UPDATE;

  v_threshold := _circuit_breaker_failure_threshold(v_row.domain);
  v_cooldown := _circuit_breaker_cooldown_seconds(v_row.domain);

  IF p_success THEN
    UPDATE circuit_breaker_state
    SET state = 'closed',
        consecutive_failures = 0,
        open_until = NULL,
        last_success_at = NOW(),
        last_error_code = NULL,
        failure_threshold = v_threshold,
        updated_at = NOW()
    WHERE provider = v_row.provider AND domain = v_row.domain AND channel = v_row.channel;

    RETURN jsonb_build_object('state', 'closed', 'consecutive_failures', 0, 'opened', FALSE);
  END IF;

  UPDATE circuit_breaker_state
  SET consecutive_failures = consecutive_failures + 1,
      last_failure_at = NOW(),
      last_error_code = NULLIF(btrim(p_error_code), ''),
      failure_threshold = v_threshold,
      updated_at = NOW()
  WHERE provider = v_row.provider AND domain = v_row.domain AND channel = v_row.channel
  RETURNING * INTO v_row;

  IF v_row.consecutive_failures >= v_threshold THEN
    UPDATE circuit_breaker_state
    SET state = 'open',
        open_until = NOW() + make_interval(secs => v_cooldown),
        updated_at = NOW()
    WHERE provider = v_row.provider AND domain = v_row.domain AND channel = v_row.channel
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
      'state', 'open',
      'consecutive_failures', v_row.consecutive_failures,
      'opened', TRUE,
      'open_until', v_row.open_until
    );
  END IF;

  RETURN jsonb_build_object(
    'state', v_row.state,
    'consecutive_failures', v_row.consecutive_failures,
    'opened', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_record_circuit_breaker_outcome(TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_record_circuit_breaker_outcome(TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT)
  TO service_role;
