-- ============================================================
-- Launch RC Wave 3.5 — reward single-source · trading pin · notifications
-- ============================================================

SET search_path = public, pg_temp;

-- ─── HD2: Reward amounts — app_config single source ───────────────────────────
INSERT INTO app_config (key, value, description) VALUES
  ('reward_welcome_phon', '5000', 'Welcome bonus PHON amount'),
  ('reward_attendance_cycle', '[1000,1000,1000,1500,2000,2500,5000]', 'Attendance cycle day 1-7 PHON rewards'),
  ('reward_mission_weekly_play5', '2000', 'Repeatable mission reward PHON'),
  ('reward_mission_daily_today_spin', '200', 'Daily spin mission reward PHON')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION _attendance_reward_for_day(p_cycle_day INT)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cycle JSONB;
  v_day INT;
  v_val NUMERIC;
BEGIN
  SELECT value::JSONB INTO v_cycle FROM app_config WHERE key = 'reward_attendance_cycle';
  v_day := LEAST(GREATEST(p_cycle_day, 1), 7);
  IF v_cycle IS NOT NULL AND jsonb_typeof(v_cycle) = 'array' AND jsonb_array_length(v_cycle) >= v_day THEN
    v_val := (v_cycle->>(v_day - 1))::NUMERIC;
    IF v_val IS NOT NULL AND v_val > 0 THEN RETURN v_val; END IF;
  END IF;
  RETURN CASE v_day
    WHEN 1 THEN 1000 WHEN 2 THEN 1000 WHEN 3 THEN 1000
    WHEN 4 THEN 1500 WHEN 5 THEN 2000 WHEN 6 THEN 2500
    WHEN 7 THEN 5000 ELSE 1000 END;
END;
$$;

REVOKE ALL ON FUNCTION _attendance_reward_for_day(INT) FROM PUBLIC, anon, authenticated;

-- ─── M3: Notification producers on money events ─────────────────────────────
CREATE OR REPLACE FUNCTION _credit_krw_deposit_internal(
  p_deposit_id UUID,
  p_transfer_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep       krw_deposit_requests%ROWTYPE;
  v_ledger_id UUID;
  v_idem      TEXT;
  v_phon      TEXT;
  v_rate_id   UUID;
BEGIN
  SELECT * INTO v_dep FROM krw_deposit_requests WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;

  IF v_dep.status = 'credited' THEN
    SELECT id INTO v_ledger_id FROM wallet_ledger
     WHERE related_entity_id = p_deposit_id AND reason_code = 'krw_deposit_credit'
     LIMIT 1;
    RETURN v_ledger_id;
  END IF;

  PERFORM _assert_account_activity_live(v_dep.user_id);

  v_idem := 'krw_dep:' || p_transfer_id;

  SELECT id INTO v_ledger_id FROM wallet_ledger WHERE idempotency_key = v_idem;
  IF FOUND THEN
    UPDATE krw_deposit_requests
       SET status = 'credited', credited_at = COALESCE(credited_at, NOW()), matched_at = COALESCE(matched_at, NOW())
     WHERE id = p_deposit_id;
    RETURN v_ledger_id;
  END IF;

  v_phon := COALESCE(v_dep.expected_phon, '0.000000');
  v_rate_id := v_dep.rate_snapshot_id;

  v_ledger_id := _credit_wallet_internal(
    v_dep.user_id, 'PHON', v_phon, 'krw_deposit_credit', v_idem
  );

  PERFORM _debit_system_account(
    'deposit_conversion_phon', v_phon, 'krw_deposit_credit',
    v_dep.user_id, p_transfer_id, v_ledger_id
  );

  UPDATE krw_deposit_requests
     SET status = 'credited', credited_at = NOW(), matched_at = COALESCE(matched_at, NOW())
   WHERE id = p_deposit_id;

  PERFORM _enqueue_notification(
    v_dep.user_id, 'push', 'deposit_credited',
    jsonb_build_object('deposit_id', p_deposit_id, 'amount_phon', v_phon, 'currency', 'PHON')
  );

  RETURN v_ledger_id;
END;
$$;

REVOKE ALL ON FUNCTION _credit_krw_deposit_internal(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── HD1: Trading RPC search_path canonical pin (no regexp_replace patches) ───
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'rpc_open_futures_position', 'rpc_close_futures_position', 'rpc_run_liquidations',
        '_settle_futures_position', '_liquidate_futures_position', 'rpc_update_oracle_price',
        'rpc_liquidate_position'
      )
  LOOP
    EXECUTE 'ALTER FUNCTION ' || r.sig::TEXT || ' SET search_path = public, pg_temp';
  END LOOP;
END;
$$;

-- ─── HD2 client feed: reward config RPC ───────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_get_reward_config()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'welcome_phon', COALESCE((SELECT value FROM app_config WHERE key = 'reward_welcome_phon'), '5000'),
    'attendance_cycle', COALESCE(
      (SELECT value::JSONB FROM app_config WHERE key = 'reward_attendance_cycle'),
      '[1000,1000,1000,1500,2000,2500,5000]'::JSONB
    )
  );
$$;

REVOKE ALL ON FUNCTION rpc_get_reward_config() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_reward_config() TO authenticated, service_role;

INSERT INTO app_config (key, value, description) VALUES
  ('dr_cron_health_check_enabled', 'true', 'Enable DR cron health probe'),
  ('load_smoke_concurrency', '20', 'H6 load smoke default concurrency'),
  ('load_smoke_iterations', '50', 'H6 load smoke default iterations')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION rpc_get_dr_health_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_open_alerts INT;
  v_pending_notif INT;
  v_pending_withdraw INT;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    PERFORM _assert_admin_aal2();
  END IF;

  SELECT COUNT(*)::INT INTO v_open_alerts FROM ops_alerts WHERE status IN ('open', 'acknowledged');
  SELECT COUNT(*)::INT INTO v_pending_notif FROM notification_outbox WHERE status IN ('pending', 'failed');
  SELECT COUNT(*)::INT INTO v_pending_withdraw
    FROM withdrawal_requests WHERE status = 'approved' AND on_chain_tx_hash IS NULL;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'open_ops_alerts', v_open_alerts,
    'pending_notifications', v_pending_notif,
    'pending_crypto_broadcasts', v_pending_withdraw,
    'checked_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_dr_health_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_dr_health_summary() TO authenticated, service_role;
