-- Gift card fee market matrix — admin-managed payout/fee snapshot source (Wallet Rails A-1R).
SET search_path = public, pg_temp;

INSERT INTO app_config (key, value, description) VALUES
  ('giftcard_fee_market_stale_days', '30', 'Block gift card deposits when fee market last_checked_at is older than this many days.')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS giftcard_fee_market (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind               giftcard_kind NOT NULL UNIQUE,
  provider_name      TEXT NOT NULL,
  giftcard_type      TEXT NOT NULL,
  payout_rate_bps    INT NOT NULL CHECK (payout_rate_bps >= 0 AND payout_rate_bps <= 10000),
  percent_fee_bps    INT NOT NULL CHECK (percent_fee_bps >= 0 AND percent_fee_bps <= 10000),
  fixed_fee_krw      TEXT NOT NULL DEFAULT '0',
  min_face_value_krw TEXT NOT NULL DEFAULT '5000',
  max_face_value_krw TEXT NOT NULL DEFAULT '500000',
  sla_minutes        INT NOT NULL DEFAULT 30 CHECK (sla_minutes > 0),
  evidence_url       TEXT,
  last_checked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gfm_enabled_checked_idx
  ON giftcard_fee_market (enabled, last_checked_at DESC);

ALTER TABLE giftcard_fee_market ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "giftcard_fee_market: admin read" ON giftcard_fee_market;
DROP POLICY IF EXISTS "giftcard_fee_market: admin write" ON giftcard_fee_market;
CREATE POLICY "giftcard_fee_market: admin select" ON giftcard_fee_market
  FOR SELECT USING (_is_admin());
CREATE POLICY "giftcard_fee_market: admin insert" ON giftcard_fee_market
  FOR INSERT WITH CHECK (_is_admin());
CREATE POLICY "giftcard_fee_market: admin update" ON giftcard_fee_market
  FOR UPDATE USING (_is_admin()) WITH CHECK (_is_admin());
CREATE POLICY "giftcard_fee_market: admin delete" ON giftcard_fee_market
  FOR DELETE USING (_is_admin());

REVOKE ALL ON giftcard_fee_market FROM PUBLIC, anon, authenticated;
GRANT SELECT ON giftcard_fee_market TO authenticated;
GRANT ALL ON giftcard_fee_market TO service_role;

ALTER TABLE giftcard_deposit_requests
  ADD COLUMN IF NOT EXISTS fee_market_id UUID REFERENCES giftcard_fee_market(id),
  ADD COLUMN IF NOT EXISTS fixed_fee_krw TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS payout_rate_bps INT;

-- Seed matrix — representative Korean buyback market (operator refreshes via admin).
INSERT INTO giftcard_fee_market (
  kind, provider_name, giftcard_type,
  payout_rate_bps, percent_fee_bps, fixed_fee_krw,
  min_face_value_krw, max_face_value_krw, sla_minutes,
  evidence_url, last_checked_at, enabled
) VALUES
  (
    'culture', '컬쳐랜드', '문화상품권·컬쳐캐쉬',
    9000, 1000, '0',
    '5000', '500000', 30,
    'https://www.cultureland.co.kr', NOW(), TRUE
  ),
  (
    'happy', '해피머니', '해피머니상품권',
    8800, 1200, '0',
    '5000', '500000', 45,
    'https://www.happymoney.co.kr', NOW(), TRUE
  ),
  (
    'book', '북앤라이프', '도서상품권·북캐시',
    8700, 1300, '0',
    '5000', '300000', 60,
    'https://www.booknlife.com', NOW(), TRUE
  ),
  (
    'department', '백화점상품권', '신세계·롯데·현대 백화점',
    8500, 1500, '0',
    '10000', '500000', 60,
    'https://www.shinsegae.com', NOW(), TRUE
  ),
  (
    'mobile', '기프티콘', '모바일·기프티콘·편의점',
    8200, 1800, '500',
    '5000', '200000', 90,
    'https://www.gifticon.com', NOW(), TRUE
  ),
  (
    'game', '게임·앱스토어', '구글플레이·앱스토어·게임캐시',
    8000, 2000, '1000',
    '5000', '300000', 120,
    'https://play.google.com/intl/ko_kr/about/giftcards/', NOW(), TRUE
  )
ON CONFLICT (kind) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  giftcard_type = EXCLUDED.giftcard_type,
  payout_rate_bps = EXCLUDED.payout_rate_bps,
  percent_fee_bps = EXCLUDED.percent_fee_bps,
  fixed_fee_krw = EXCLUDED.fixed_fee_krw,
  min_face_value_krw = EXCLUDED.min_face_value_krw,
  max_face_value_krw = EXCLUDED.max_face_value_krw,
  sla_minutes = EXCLUDED.sla_minutes,
  evidence_url = EXCLUDED.evidence_url,
  last_checked_at = EXCLUDED.last_checked_at,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();

CREATE OR REPLACE FUNCTION _giftcard_fee_market_stale_days()
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(NULLIF(value, '')::INT, 30)
    FROM app_config
   WHERE key = 'giftcard_fee_market_stale_days';
$$;

REVOKE ALL ON FUNCTION _giftcard_fee_market_stale_days() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _giftcard_fee_market_is_stale(p_last_checked TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT p_last_checked < NOW() - (_giftcard_fee_market_stale_days() || ' days')::INTERVAL;
$$;

REVOKE ALL ON FUNCTION _giftcard_fee_market_is_stale(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _compute_giftcard_deposit_snapshot(
  p_kind giftcard_kind,
  p_face_value_krw TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_market      giftcard_fee_market%ROWTYPE;
  v_face        NUMERIC;
  v_percent_fee NUMERIC;
  v_fixed_fee   NUMERIC;
  v_total_fee   NUMERIC;
  v_net         NUMERIC;
  v_rate_id     UUID;
  v_phon        TEXT;
  v_captured    TIMESTAMPTZ;
BEGIN
  IF p_face_value_krw IS NULL OR p_face_value_krw !~ '^\d+(\.\d+)?$' OR p_face_value_krw::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT * INTO v_market FROM giftcard_fee_market WHERE kind = p_kind;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_kind';
  END IF;
  IF NOT v_market.enabled THEN
    RAISE EXCEPTION 'giftcard_kind_disabled';
  END IF;
  IF _giftcard_fee_market_is_stale(v_market.last_checked_at) THEN
    RAISE EXCEPTION 'giftcard_fee_stale';
  END IF;

  v_face := p_face_value_krw::NUMERIC;
  IF v_face < v_market.min_face_value_krw::NUMERIC THEN
    RAISE EXCEPTION 'face_value_below_min';
  END IF;
  IF v_face > v_market.max_face_value_krw::NUMERIC THEN
    RAISE EXCEPTION 'face_value_above_max';
  END IF;

  v_fixed_fee := COALESCE(NULLIF(v_market.fixed_fee_krw, '')::NUMERIC, 0);
  v_percent_fee := floor(v_face * v_market.percent_fee_bps / 10000.0);
  v_total_fee := v_percent_fee + v_fixed_fee;
  IF v_total_fee >= v_face THEN
    RAISE EXCEPTION 'fee_exceeds_face_value';
  END IF;
  v_net := v_face - v_total_fee;

  SELECT id,
         _fmt6((v_net / rate::NUMERIC)),
         captured_at
    INTO v_rate_id, v_phon, v_captured
    FROM exchange_rate_snapshots
   WHERE base_currency = 'PHON' AND quote_currency = 'KRW' AND is_active = TRUE AND rate::NUMERIC > 0
   ORDER BY captured_at DESC LIMIT 1;

  IF v_rate_id IS NULL OR v_phon IS NULL OR v_phon::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'phon_krw_rate_unavailable';
  END IF;
  IF v_captured < NOW() - INTERVAL '15 minutes' THEN
    RAISE EXCEPTION 'phon_krw_rate_stale';
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'fee_market_id', v_market.id,
    'kind', v_market.kind::TEXT,
    'provider_name', v_market.provider_name,
    'giftcard_type', v_market.giftcard_type,
    'face_value_krw', _fmt6(v_face),
    'payout_rate_bps', v_market.payout_rate_bps,
    'percent_fee_bps', v_market.percent_fee_bps,
    'fixed_fee_krw', _fmt6(v_fixed_fee),
    'total_fee_krw', _fmt6(v_total_fee),
    'net_krw', _fmt6(v_net),
    'expected_phon', v_phon,
    'rate_snapshot_id', v_rate_id,
    'sla_minutes', v_market.sla_minutes,
    'evidence_url', v_market.evidence_url,
    'last_checked_at', v_market.last_checked_at
  );
END;
$$;

REVOKE ALL ON FUNCTION _compute_giftcard_deposit_snapshot(giftcard_kind, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_list_giftcard_fee_market()
RETURNS SETOF JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'kind', m.kind::TEXT,
    'provider_name', m.provider_name,
    'giftcard_type', m.giftcard_type,
    'payout_rate_bps', m.payout_rate_bps,
    'percent_fee_bps', m.percent_fee_bps,
    'fixed_fee_krw', m.fixed_fee_krw,
    'min_face_value_krw', m.min_face_value_krw,
    'max_face_value_krw', m.max_face_value_krw,
    'sla_minutes', m.sla_minutes,
    'last_checked_at', m.last_checked_at
  )
  FROM giftcard_fee_market m
  WHERE m.enabled = TRUE
    AND NOT _giftcard_fee_market_is_stale(m.last_checked_at)
  ORDER BY m.kind::TEXT;
$$;

REVOKE ALL ON FUNCTION rpc_list_giftcard_fee_market() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_list_giftcard_fee_market() TO authenticated;

CREATE OR REPLACE FUNCTION rpc_preview_giftcard_deposit(
  p_kind TEXT,
  p_face_value_krw TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_kind giftcard_kind;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  BEGIN
    v_kind := p_kind::giftcard_kind;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_kind';
  END;

  RETURN _compute_giftcard_deposit_snapshot(v_kind, p_face_value_krw);
END;
$$;

REVOKE ALL ON FUNCTION rpc_preview_giftcard_deposit(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_preview_giftcard_deposit(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_create_giftcard_deposit_request(
  p_kind TEXT,
  p_pin TEXT,
  p_face_value_krw TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id   UUID := auth.uid();
  v_kind      giftcard_kind;
  v_wallet    wallets%ROWTYPE;
  v_snapshot  JSONB;
  v_dep_id    UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('deposit');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);

  IF p_pin IS NULL OR length(btrim(p_pin)) < 4 THEN
    RAISE EXCEPTION 'invalid_pin';
  END IF;

  BEGIN
    v_kind := p_kind::giftcard_kind;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_kind';
  END;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_create_giftcard_deposit_request')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN RAISE EXCEPTION 'duplicate_request'; END IF;
  END IF;

  v_snapshot := _compute_giftcard_deposit_snapshot(v_kind, p_face_value_krw);

  SELECT id INTO v_wallet FROM wallets WHERE user_id = v_user_id;

  INSERT INTO giftcard_deposit_requests (
    user_id, wallet_id, kind, pin_last4, face_value_krw,
    fee_rate_bps, fixed_fee_krw, payout_rate_bps, fee_market_id,
    net_krw, expected_phon, rate_snapshot_id
  ) VALUES (
    v_user_id, v_wallet.id, v_kind, right(btrim(p_pin), 4),
    v_snapshot->>'face_value_krw',
    (v_snapshot->>'percent_fee_bps')::INT,
    v_snapshot->>'fixed_fee_krw',
    (v_snapshot->>'payout_rate_bps')::INT,
    (v_snapshot->>'fee_market_id')::UUID,
    v_snapshot->>'net_krw',
    v_snapshot->>'expected_phon',
    (v_snapshot->>'rate_snapshot_id')::UUID
  ) RETURNING id INTO v_dep_id;

  RETURN v_snapshot || jsonb_build_object('deposit_id', v_dep_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_giftcard_deposit_request(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_giftcard_deposit_request(TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_list_giftcard_fee_market()
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', m.id,
    'kind', m.kind::TEXT,
    'provider_name', m.provider_name,
    'giftcard_type', m.giftcard_type,
    'payout_rate_bps', m.payout_rate_bps,
    'percent_fee_bps', m.percent_fee_bps,
    'fixed_fee_krw', m.fixed_fee_krw,
    'min_face_value_krw', m.min_face_value_krw,
    'max_face_value_krw', m.max_face_value_krw,
    'sla_minutes', m.sla_minutes,
    'evidence_url', m.evidence_url,
    'last_checked_at', m.last_checked_at,
    'enabled', m.enabled,
    'is_stale', _giftcard_fee_market_is_stale(m.last_checked_at),
    'updated_at', m.updated_at
  )
  FROM giftcard_fee_market m
  ORDER BY m.kind::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_giftcard_fee_market() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_list_giftcard_fee_market() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_upsert_giftcard_fee_market(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_kind giftcard_kind;
  v_id   UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();

  BEGIN
    v_kind := (p_payload->>'kind')::giftcard_kind;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_kind';
  END;

  IF NULLIF(btrim(p_payload->>'provider_name'), '') IS NULL THEN
    RAISE EXCEPTION 'invalid_provider_name';
  END IF;
  IF NULLIF(btrim(p_payload->>'giftcard_type'), '') IS NULL THEN
    RAISE EXCEPTION 'invalid_giftcard_type';
  END IF;

  INSERT INTO giftcard_fee_market (
    kind, provider_name, giftcard_type,
    payout_rate_bps, percent_fee_bps, fixed_fee_krw,
    min_face_value_krw, max_face_value_krw, sla_minutes,
    evidence_url, last_checked_at, enabled
  ) VALUES (
    v_kind,
    p_payload->>'provider_name',
    p_payload->>'giftcard_type',
    COALESCE((p_payload->>'payout_rate_bps')::INT, 0),
    COALESCE((p_payload->>'percent_fee_bps')::INT, 0),
    COALESCE(NULLIF(p_payload->>'fixed_fee_krw', ''), '0'),
    COALESCE(NULLIF(p_payload->>'min_face_value_krw', ''), '5000'),
    COALESCE(NULLIF(p_payload->>'max_face_value_krw', ''), '500000'),
    COALESCE((p_payload->>'sla_minutes')::INT, 30),
    NULLIF(p_payload->>'evidence_url', ''),
    COALESCE(NULLIF(p_payload->>'last_checked_at', '')::TIMESTAMPTZ, NOW()),
    COALESCE((p_payload->>'enabled')::BOOLEAN, TRUE)
  )
  ON CONFLICT (kind) DO UPDATE SET
    provider_name = EXCLUDED.provider_name,
    giftcard_type = EXCLUDED.giftcard_type,
    payout_rate_bps = EXCLUDED.payout_rate_bps,
    percent_fee_bps = EXCLUDED.percent_fee_bps,
    fixed_fee_krw = EXCLUDED.fixed_fee_krw,
    min_face_value_krw = EXCLUDED.min_face_value_krw,
    max_face_value_krw = EXCLUDED.max_face_value_krw,
    sla_minutes = EXCLUDED.sla_minutes,
    evidence_url = EXCLUDED.evidence_url,
    last_checked_at = EXCLUDED.last_checked_at,
    enabled = EXCLUDED.enabled,
    updated_at = NOW()
  RETURNING id INTO v_id;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'giftcard_fee_market_upsert', 'giftcard_fee_market', v_id, p_payload);

  RETURN jsonb_build_object('ok', TRUE, 'id', v_id, 'kind', v_kind::TEXT);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_upsert_giftcard_fee_market(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_upsert_giftcard_fee_market(JSONB) TO authenticated, service_role;
