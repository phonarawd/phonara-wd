-- Admin Users + trade exposure RPCs — AAL2 guard (check:guard-coverage strict)

CREATE OR REPLACE FUNCTION rpc_admin_list_users(
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_search TEXT := NULLIF(btrim(p_search), '');
  v_limit INT := GREATEST(1, LEAST(COALESCE(p_limit, 100), 200));
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  PERFORM _assert_admin_aal2();

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', p.id,
    'display_name', COALESCE(NULLIF(p.display_name, ''), NULLIF(p.username, ''), LEFT(p.id::TEXT, 8)),
    'email_masked', LEFT(p.id::TEXT, 8) || '…',
    'kyc_tier', p.kyc_tier::TEXT,
    'status', CASE
      WHEN p.is_banned THEN 'banned'
      WHEN COALESCE(p.activity_frozen, FALSE) THEN 'suspended'
      ELSE 'active'
    END,
    'mfa_enabled', FALSE,
    'last_session_at', p.updated_at,
    'balance_cash', COALESCE(w.phon_available, '0'),
    'balance_bonus', '0',
    'balance_locked', COALESCE(w.phon_locked, '0'),
    'active_sessions', 0,
    'risk_flag_count', COALESCE(rf.cnt, 0)
  )
  FROM profiles p
  LEFT JOIN wallets w ON w.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS cnt
    FROM risk_flags rf
    WHERE rf.user_id = p.id AND rf.status = 'active'
  ) rf ON TRUE
  WHERE p.role = 'user'
    AND (
      v_search IS NULL
      OR p.id::TEXT ILIKE '%' || v_search || '%'
      OR COALESCE(p.display_name, '') ILIKE '%' || v_search || '%'
      OR COALESCE(p.username, '') ILIKE '%' || v_search || '%'
    )
  ORDER BY p.updated_at DESC
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_set_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reason TEXT := NULLIF(btrim(p_reason), '');
  v_action TEXT := lower(btrim(COALESCE(p_action, '')));
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  PERFORM _assert_admin_aal2();
  IF v_reason IS NULL OR length(v_reason) < 4 THEN
    RAISE EXCEPTION 'reason_too_short';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_user';
  END IF;

  IF v_action = 'suspend' THEN
    UPDATE profiles SET activity_frozen = TRUE, updated_at = now() WHERE id = p_user_id;
  ELSIF v_action = 'unsuspend' THEN
    UPDATE profiles SET activity_frozen = FALSE, updated_at = now() WHERE id = p_user_id;
  ELSIF v_action = 'ban' THEN
    UPDATE profiles SET is_banned = TRUE, activity_frozen = TRUE, ban_reason = v_reason, updated_at = now()
    WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    auth.uid(),
    'admin.users.' || v_action,
    'user',
    p_user_id,
    jsonb_build_object('action', v_action, 'reason', v_reason)
  );

  RETURN jsonb_build_object('ok', TRUE, 'user_id', p_user_id, 'action', v_action);
END;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_trade_exposure_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_open INT;
  v_notional_usdt NUMERIC;
  v_notional_phon NUMERIC;
  v_max_market TEXT;
  v_max_notional NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  PERFORM _assert_admin_aal2();

  SELECT COUNT(*)::INT,
         COALESCE(SUM(notional::NUMERIC) FILTER (WHERE margin_currency = 'USDT'), 0),
         COALESCE(SUM(notional::NUMERIC) FILTER (WHERE margin_currency = 'PHON'), 0)
  INTO v_open, v_notional_usdt, v_notional_phon
  FROM futures_positions
  WHERE status = 'open';

  SELECT market, notional::NUMERIC
  INTO v_max_market, v_max_notional
  FROM futures_positions
  WHERE status = 'open'
  ORDER BY notional::NUMERIC DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'open_positions', COALESCE(v_open, 0),
    'notional_usdt', COALESCE(v_notional_usdt, 0)::TEXT,
    'notional_phon', COALESCE(v_notional_phon, 0)::TEXT,
    'max_market', COALESCE(v_max_market, '—'),
    'max_notional', COALESCE(v_max_notional, 0)::TEXT
  );
END;
$$;
