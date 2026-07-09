-- WorldNo1 Phase 1+2 — HD crypto addresses, giftcard, manual adjust, CMS, legal, notifications, USDT/KRW feed
SET search_path = public, pg_temp;

-- ─── System accounts ─────────────────────────────────────────────────────────
INSERT INTO system_accounts (code, currency, description) VALUES
  ('giftcard_fee_phon', 'PHON', 'Gift card discount fee counter-leg (Σ=0).'),
  ('manual_adjustment_phon', 'PHON', 'Admin manual balance adjustment counter-leg.'),
  ('manual_adjustment_usdt', 'USDT', 'Admin manual USDT adjustment counter-leg.'),
  ('manual_adjustment_krw', 'KRW', 'Admin manual KRW adjustment counter-leg.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app_config (key, value, description) VALUES
  ('crypto_derivation_index', '0', 'Next BIP44 derivation index for custody addresses.'),
  ('crypto_watcher_last_block_trc20', '0', 'Last scanned TRON block for deposit watcher.'),
  ('giftcard_fee_rate_bps', '500', 'Default gift card market discount in basis points (5%).'),
  ('geo_block_enabled', 'false', 'When true, blocked country codes deny client RPCs.'),
  ('geo_blocked_countries', '[]', 'JSON array of ISO 3166-1 alpha-2 country codes to block.'),
  ('feature_account_deletion_enabled', 'true', 'User-initiated account deletion RPC.')
ON CONFLICT (key) DO NOTHING;

-- ─── Crypto HD derivation metadata ───────────────────────────────────────────
ALTER TABLE crypto_deposit_addresses
  ADD COLUMN IF NOT EXISTS derivation_index INT,
  ADD COLUMN IF NOT EXISTS address_source TEXT NOT NULL DEFAULT 'legacy_random';

CREATE UNIQUE INDEX IF NOT EXISTS cda_derivation_chain_idx
  ON crypto_deposit_addresses (chain, derivation_index)
  WHERE derivation_index IS NOT NULL;

-- Deterministic placeholder until edge assigns real HD address (unique per user+chain)
CREATE OR REPLACE FUNCTION _reserve_crypto_derivation_index(p_chain crypto_chain)
RETURNS INT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_idx INT;
BEGIN
  UPDATE app_config
     SET value = (COALESCE(NULLIF(btrim(value), ''), '0')::INT + 1)::TEXT,
         updated_at = NOW()
   WHERE key = 'crypto_derivation_index'
   RETURNING value::INT INTO v_idx;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'crypto_derivation_index_missing';
  END IF;
  RETURN v_idx;
END;
$$;

REVOKE ALL ON FUNCTION _reserve_crypto_derivation_index(crypto_chain) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_service_set_crypto_address(
  p_user_id UUID,
  p_chain TEXT,
  p_address TEXT,
  p_derivation_index INT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_chain crypto_chain;
  v_row   crypto_deposit_addresses%ROWTYPE;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  BEGIN
    v_chain := p_chain::crypto_chain;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_chain';
  END;

  IF p_address IS NULL OR length(btrim(p_address)) < 10 THEN
    RAISE EXCEPTION 'invalid_address';
  END IF;

  SELECT * INTO v_row
    FROM crypto_deposit_addresses
   WHERE user_id = p_user_id AND asset = 'USDT' AND chain = v_chain
   FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO crypto_deposit_addresses (user_id, asset, chain, address, derivation_index, address_source)
    VALUES (p_user_id, 'USDT', v_chain, p_address, p_derivation_index, 'hd_xpub')
    RETURNING * INTO v_row;
  ELSE
    UPDATE crypto_deposit_addresses
       SET address = p_address,
           derivation_index = p_derivation_index,
           address_source = 'hd_xpub'
     WHERE id = v_row.id
     RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'address_id', v_row.id, 'address', v_row.address);
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_set_crypto_address(UUID, TEXT, TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_set_crypto_address(UUID, TEXT, TEXT, INT) TO service_role;

-- Reserve slot; edge derives real address via xpub
CREATE OR REPLACE FUNCTION rpc_get_crypto_deposit_address(
  p_asset TEXT DEFAULT 'USDT',
  p_chain TEXT DEFAULT 'TRC20'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_asset   crypto_asset;
  v_chain   crypto_chain;
  v_row     crypto_deposit_addresses%ROWTYPE;
  v_idx     INT;
  v_pending TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_feature_enabled('deposit');
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_sanctions_screening(v_user_id);

  BEGIN
    v_asset := p_asset::crypto_asset;
    v_chain := p_chain::crypto_chain;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_asset_or_chain';
  END;

  SELECT * INTO v_row
    FROM crypto_deposit_addresses
   WHERE user_id = v_user_id AND asset = v_asset AND chain = v_chain;

  IF NOT FOUND THEN
    v_idx := _reserve_crypto_derivation_index(v_chain);
    v_pending := CASE v_chain
      WHEN 'TRC20' THEN 'T_PENDING_' || lpad(v_idx::TEXT, 8, '0')
      WHEN 'ERC20' THEN '0xPENDING' || lpad(to_hex(v_idx), 8, '0')
    END;
    INSERT INTO crypto_deposit_addresses (user_id, asset, chain, address, derivation_index, address_source)
    VALUES (v_user_id, v_asset, v_chain, v_pending, v_idx, 'pending_hd')
    RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'address', v_row.address,
    'asset', v_row.asset,
    'chain', v_row.chain,
    'address_id', v_row.id,
    'derivation_index', v_row.derivation_index,
    'needs_derivation', v_row.address_source = 'pending_hd'
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_crypto_deposit_address(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_crypto_deposit_address(TEXT, TEXT) TO authenticated;

-- ─── USDT/KRW live rate ingest (service_role) ────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_service_ingest_usdt_krw_rate(p_rate TEXT, p_source TEXT DEFAULT 'upbit')
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rate NUMERIC;
  v_id   UUID;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_rate !~ '^\d+(\.\d+)?$' OR p_rate::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_rate';
  END IF;

  v_rate := p_rate::NUMERIC;

  UPDATE exchange_rate_snapshots
     SET is_active = FALSE
   WHERE base_currency = 'USDT'
     AND quote_currency = 'KRW'
     AND is_active = TRUE;

  INSERT INTO exchange_rate_snapshots (base_currency, quote_currency, rate, source, is_active)
  VALUES ('USDT', 'KRW', _fmt6(v_rate), COALESCE(NULLIF(btrim(p_source), ''), 'external_feed'), TRUE)
  RETURNING id INTO v_id;

  PERFORM _refresh_phon_krw_exchange_rate();

  RETURN jsonb_build_object('ok', TRUE, 'snapshot_id', v_id, 'rate', _fmt6(v_rate));
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_ingest_usdt_krw_rate(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_ingest_usdt_krw_rate(TEXT, TEXT) TO service_role;

-- ─── Gift card deposits ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE giftcard_kind AS ENUM ('culture', 'book', 'happy');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS giftcard_deposit_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  wallet_id          UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  kind               giftcard_kind NOT NULL,
  pin_last4          TEXT NOT NULL,
  face_value_krw     TEXT NOT NULL,
  fee_rate_bps       INT NOT NULL,
  net_krw            TEXT NOT NULL,
  expected_phon      TEXT NOT NULL,
  rate_snapshot_id   UUID REFERENCES exchange_rate_snapshots(id),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected', 'credited')),
  admin_note         TEXT,
  reviewed_by        UUID REFERENCES profiles(id),
  reviewed_at        TIMESTAMPTZ,
  credited_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gdr_user_status_idx ON giftcard_deposit_requests (user_id, status);
CREATE INDEX IF NOT EXISTS gdr_status_created_idx ON giftcard_deposit_requests (status, created_at DESC);

ALTER TABLE giftcard_deposit_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "giftcard_deposits: own read" ON giftcard_deposit_requests;
DROP POLICY IF EXISTS "giftcard_deposits: admin read" ON giftcard_deposit_requests;
CREATE POLICY "giftcard_deposits: read" ON giftcard_deposit_requests
  FOR SELECT USING (auth.uid() = user_id OR _is_admin());
DROP POLICY IF EXISTS "giftcard_deposits: admin update" ON giftcard_deposit_requests;
CREATE POLICY "giftcard_deposits: admin update" ON giftcard_deposit_requests
  FOR UPDATE USING (_is_admin());

REVOKE ALL ON giftcard_deposit_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON giftcard_deposit_requests TO authenticated;
GRANT ALL ON giftcard_deposit_requests TO service_role;

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
  v_fee_bps   INT;
  v_face      NUMERIC;
  v_fee       NUMERIC;
  v_net       NUMERIC;
  v_rate_id   UUID;
  v_phon      TEXT;
  v_captured  TIMESTAMPTZ;
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
  IF p_face_value_krw !~ '^\d+(\.\d+)?$' OR p_face_value_krw::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
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

  SELECT COALESCE(NULLIF(value, '')::INT, 500) INTO v_fee_bps
    FROM app_config WHERE key = 'giftcard_fee_rate_bps';

  v_face := p_face_value_krw::NUMERIC;
  v_fee := floor(v_face * v_fee_bps / 10000.0);
  v_net := v_face - v_fee;

  SELECT id INTO v_wallet FROM wallets WHERE user_id = v_user_id;

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

  INSERT INTO giftcard_deposit_requests (
    user_id, wallet_id, kind, pin_last4, face_value_krw, fee_rate_bps,
    net_krw, expected_phon, rate_snapshot_id
  ) VALUES (
    v_user_id, v_wallet.id, v_kind, right(btrim(p_pin), 4),
    _fmt6(v_face), v_fee_bps, _fmt6(v_net), v_phon, v_rate_id
  ) RETURNING id INTO v_dep_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'deposit_id', v_dep_id,
    'face_value_krw', _fmt6(v_face),
    'fee_rate_bps', v_fee_bps,
    'net_krw', _fmt6(v_net),
    'expected_phon', v_phon
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_giftcard_deposit_request(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_giftcard_deposit_request(TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION _credit_giftcard_deposit_internal(p_deposit_id UUID, p_idem_suffix TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep       giftcard_deposit_requests%ROWTYPE;
  v_ledger_id UUID;
  v_fee_phon  TEXT;
  v_idem      TEXT;
  v_face_phon TEXT;
BEGIN
  SELECT * INTO v_dep FROM giftcard_deposit_requests WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;
  IF v_dep.status = 'credited' THEN
    SELECT id INTO v_ledger_id FROM wallet_ledger
     WHERE idempotency_key = 'giftcard_dep:' || p_deposit_id::TEXT || ':' || p_idem_suffix LIMIT 1;
    RETURN v_ledger_id;
  END IF;

  v_idem := 'giftcard_dep:' || p_deposit_id::TEXT || ':' || p_idem_suffix;

  v_face_phon := _fmt6((v_dep.face_value_krw::NUMERIC / (
    SELECT rate::NUMERIC FROM exchange_rate_snapshots WHERE id = v_dep.rate_snapshot_id
  )));
  v_fee_phon := _fmt6(v_face_phon::NUMERIC - v_dep.expected_phon::NUMERIC);

  v_ledger_id := _credit_wallet_internal(
    v_dep.user_id, 'PHON', v_dep.expected_phon, 'giftcard_deposit_credit', v_idem
  );

  IF v_fee_phon::NUMERIC > 0 THEN
    PERFORM _credit_system_account(
      'giftcard_fee_phon', v_fee_phon, 'giftcard_fee',
      v_dep.user_id, p_idem_suffix, v_ledger_id
    );
  END IF;

  PERFORM _debit_system_account(
    'deposit_conversion_phon', v_face_phon, 'giftcard_deposit_credit',
    v_dep.user_id, p_idem_suffix, v_ledger_id
  );

  UPDATE giftcard_deposit_requests
     SET status = 'credited', credited_at = NOW(), updated_at = NOW()
   WHERE id = p_deposit_id;

  RETURN v_ledger_id;
END;
$$;

REVOKE ALL ON FUNCTION _credit_giftcard_deposit_internal(UUID, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_approve_giftcard_deposit(
  p_deposit_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ledger UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN RAISE EXCEPTION 'reason_too_short'; END IF;

  UPDATE giftcard_deposit_requests
     SET status = 'approved', admin_note = p_reason, reviewed_by = auth.uid(), reviewed_at = NOW()
   WHERE id = p_deposit_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_deposit_status'; END IF;

  v_ledger := _credit_giftcard_deposit_internal(p_deposit_id, 'approve');

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'giftcard_deposit_approved', 'giftcard_deposit_requests', p_deposit_id,
          jsonb_build_object('reason', p_reason, 'ledger_id', v_ledger));

  RETURN jsonb_build_object('ok', TRUE, 'ledger_id', v_ledger);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_approve_giftcard_deposit(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_approve_giftcard_deposit(UUID, TEXT) TO authenticated, service_role;

-- ─── Admin manual wallet adjustment (Σ=0) ────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_admin_manual_wallet_adjust(
  p_user_id UUID,
  p_currency TEXT,
  p_amount TEXT,
  p_direction TEXT,
  p_reason TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ccy       currency;
  v_amt       TEXT;
  v_dir       TEXT := lower(btrim(COALESCE(p_direction, '')));
  v_reason    TEXT := NULLIF(btrim(p_reason), '');
  v_ledger_id UUID;
  v_sys_code  TEXT;
  v_idem      TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF v_reason IS NULL OR length(v_reason) < 8 THEN RAISE EXCEPTION 'reason_too_short'; END IF;
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'invalid_user'; END IF;
  IF p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF v_dir NOT IN ('credit', 'debit') THEN RAISE EXCEPTION 'invalid_direction'; END IF;

  BEGIN v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'invalid_currency'; END;

  v_amt := _fmt6(p_amount::NUMERIC);
  v_sys_code := CASE v_ccy
    WHEN 'PHON' THEN 'manual_adjustment_phon'
    WHEN 'USDT' THEN 'manual_adjustment_usdt'
    WHEN 'KRW' THEN 'manual_adjustment_krw'
  END;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    v_idem := 'manual_adj:' || auth.uid()::TEXT || ':' || p_client_request_id;
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (auth.uid(), p_client_request_id, 'rpc_admin_manual_wallet_adjust')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', TRUE, 'idempotent', TRUE);
    END IF;
  ELSE
    v_idem := 'manual_adj:' || auth.uid()::TEXT || ':' || gen_random_uuid()::TEXT;
  END IF;

  IF v_dir = 'credit' THEN
    v_ledger_id := _credit_wallet_internal(p_user_id, v_ccy, v_amt, 'admin_manual_credit', v_idem);
    PERFORM _debit_system_account(v_sys_code, v_amt, 'admin_manual_credit', p_user_id, v_idem, v_ledger_id);
  ELSE
    v_ledger_id := _debit_wallet_internal(p_user_id, v_ccy, v_amt, 'admin_manual_debit', v_idem);
    PERFORM _credit_system_account(v_sys_code, v_amt, 'admin_manual_debit', p_user_id, v_idem, v_ledger_id);
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    auth.uid(), 'admin_manual_wallet_adjust', 'wallet', p_user_id,
    jsonb_build_object(
      'currency', v_ccy, 'amount', v_amt, 'direction', v_dir,
      'reason', v_reason, 'ledger_id', v_ledger_id, 'client_request_id', p_client_request_id
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'ledger_id', v_ledger_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_manual_wallet_adjust(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_manual_wallet_adjust(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ─── Admin KRW bank match ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_admin_match_krw_deposit(
  p_deposit_id UUID,
  p_transfer_id TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep krw_deposit_requests%ROWTYPE;
  v_res JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) < 4 THEN RAISE EXCEPTION 'reason_too_short'; END IF;

  SELECT * INTO v_dep FROM krw_deposit_requests WHERE id = p_deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;

  v_res := _try_match_krw_deposit(
    p_transfer_id,
    v_dep.amount_krw,
    'admin_match',
    v_dep.reference_code
  );

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'krw_deposit_admin_match', 'krw_deposit_requests', p_deposit_id,
          jsonb_build_object('reason', p_reason, 'transfer_id', p_transfer_id, 'result', v_res));

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_match_krw_deposit(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_match_krw_deposit(UUID, TEXT, TEXT) TO authenticated, service_role;

-- ─── CMS content (engine-backed) ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE cms_content_kind AS ENUM ('page', 'notice', 'promo', 'banner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cms_publish_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS cms_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key  TEXT NOT NULL,
  kind         cms_content_kind NOT NULL,
  locale       TEXT NOT NULL DEFAULT 'ko' CHECK (locale IN ('ko', 'en')),
  surface      TEXT,
  status       cms_publish_status NOT NULL DEFAULT 'draft',
  title        TEXT NOT NULL,
  body         TEXT,
  headline     TEXT,
  cta_label    TEXT,
  cta_href     TEXT,
  priority     INT NOT NULL DEFAULT 0,
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by   UUID REFERENCES profiles(id),
  updated_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_key, kind, locale)
);

CREATE INDEX IF NOT EXISTS cms_content_live_idx
  ON cms_content (kind, surface, locale, status, priority DESC, starts_at, ends_at);

ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms: public read published" ON cms_content;
DROP POLICY IF EXISTS "cms: admin read" ON cms_content;
CREATE POLICY "cms: read" ON cms_content
  FOR SELECT USING (
    _is_admin()
    OR (
      status = 'published'
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at > NOW())
    )
  );
DROP POLICY IF EXISTS "cms: admin insert" ON cms_content;
CREATE POLICY "cms: admin insert" ON cms_content
  FOR INSERT WITH CHECK (_is_admin());
DROP POLICY IF EXISTS "cms: admin update" ON cms_content;
CREATE POLICY "cms: admin update" ON cms_content
  FOR UPDATE USING (_is_admin());
DROP POLICY IF EXISTS "cms: admin delete" ON cms_content;
CREATE POLICY "cms: admin delete" ON cms_content
  FOR DELETE USING (_is_admin());

REVOKE ALL ON cms_content FROM PUBLIC, anon, authenticated;
GRANT SELECT ON cms_content TO anon, authenticated;
GRANT ALL ON cms_content TO service_role;

CREATE OR REPLACE FUNCTION rpc_list_cms_content(
  p_kind TEXT DEFAULT NULL,
  p_surface TEXT DEFAULT NULL,
  p_locale TEXT DEFAULT 'ko'
)
RETURNS SETOF JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'id', c.id, 'content_key', c.content_key, 'kind', c.kind,
    'locale', c.locale, 'surface', c.surface, 'status', c.status,
    'title', c.title, 'body', c.body, 'headline', c.headline,
    'cta_label', c.cta_label, 'cta_href', c.cta_href, 'priority', c.priority,
    'starts_at', c.starts_at, 'ends_at', c.ends_at, 'published_at', c.published_at
  )
  FROM cms_content c
  WHERE c.status = 'published'
    AND c.locale = COALESCE(NULLIF(btrim(p_locale), ''), 'ko')
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
    AND (p_kind IS NULL OR c.kind::TEXT = p_kind)
    AND (p_surface IS NULL OR c.surface = p_surface)
  ORDER BY c.priority DESC, c.published_at DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION rpc_list_cms_content(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_list_cms_content(TEXT, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_admin_upsert_cms_content(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_status cms_publish_status;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();

  v_status := COALESCE((p_payload->>'status')::cms_publish_status, 'draft');

  INSERT INTO cms_content (
    id, content_key, kind, locale, surface, status, title, body, headline,
    cta_label, cta_href, priority, starts_at, ends_at, published_at, created_by, updated_by
  ) VALUES (
    COALESCE(NULLIF(p_payload->>'id', '')::UUID, gen_random_uuid()),
    p_payload->>'content_key',
    (p_payload->>'kind')::cms_content_kind,
    COALESCE(p_payload->>'locale', 'ko'),
    NULLIF(p_payload->>'surface', ''),
    v_status,
    p_payload->>'title',
    p_payload->>'body',
    p_payload->>'headline',
    p_payload->>'cta_label',
    p_payload->>'cta_href',
    COALESCE((p_payload->>'priority')::INT, 0),
    NULLIF(p_payload->>'starts_at', '')::TIMESTAMPTZ,
    NULLIF(p_payload->>'ends_at', '')::TIMESTAMPTZ,
    CASE WHEN v_status = 'published' THEN NOW() ELSE NULL END,
    auth.uid(), auth.uid()
  )
  ON CONFLICT (content_key, kind, locale) DO UPDATE SET
    surface = EXCLUDED.surface,
    status = EXCLUDED.status,
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    headline = EXCLUDED.headline,
    cta_label = EXCLUDED.cta_label,
    cta_href = EXCLUDED.cta_href,
    priority = EXCLUDED.priority,
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    published_at = CASE WHEN EXCLUDED.status = 'published' THEN NOW() ELSE cms_content.published_at END,
    updated_by = auth.uid(),
    updated_at = NOW()
  RETURNING id INTO v_id;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (auth.uid(), 'cms_upsert', 'cms_content', v_id, p_payload);

  RETURN jsonb_build_object('ok', TRUE, 'id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_upsert_cms_content(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_upsert_cms_content(JSONB) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_list_cms_content()
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', c.id, 'content_key', c.content_key, 'kind', c.kind,
    'locale', c.locale, 'surface', c.surface, 'status', c.status,
    'title', c.title, 'body', c.body, 'headline', c.headline,
    'priority', c.priority, 'starts_at', c.starts_at, 'ends_at', c.ends_at,
    'published_at', c.published_at
  )
  FROM cms_content c
  ORDER BY c.updated_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_cms_content() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_list_cms_content() TO authenticated, service_role;

-- ─── Geo block + account deletion ────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS geo_country TEXT,
  ADD COLUMN IF NOT EXISTS geo_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION _assert_not_geo_blocked(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_enabled TEXT;
  v_blocked BOOLEAN;
BEGIN
  SELECT value INTO v_enabled FROM app_config WHERE key = 'geo_block_enabled';
  IF COALESCE(v_enabled, 'false') <> 'true' THEN RETURN; END IF;

  SELECT geo_blocked INTO v_blocked FROM profiles WHERE id = p_user_id;
  IF COALESCE(v_blocked, FALSE) THEN
    RAISE EXCEPTION 'geo_blocked';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_not_geo_blocked(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_request_account_deletion(p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reason  TEXT := NULLIF(btrim(p_reason), '');
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF COALESCE((SELECT value FROM app_config WHERE key = 'feature_account_deletion_enabled'), 'true') <> 'true' THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF v_reason IS NULL OR length(v_reason) < 8 THEN RAISE EXCEPTION 'reason_too_short'; END IF;

  UPDATE profiles
     SET deletion_requested_at = NOW(),
         activity_frozen = TRUE,
         updated_at = NOW()
   WHERE id = v_user_id AND deleted_at IS NULL;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (v_user_id, 'account_deletion_requested', 'profile', v_user_id, jsonb_build_object('reason', v_reason));

  RETURN jsonb_build_object('ok', TRUE, 'status', 'pending_review');
END;
$$;

REVOKE ALL ON FUNCTION rpc_request_account_deletion(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_request_account_deletion(TEXT) TO authenticated;

-- ─── Server notification queue ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_outbox (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('push', 'email', 'in_app')),
  event_type   TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}'::JSONB,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts     INT NOT NULL DEFAULT 0,
  last_error   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notification_outbox_pending_idx
  ON notification_outbox (status, created_at) WHERE status = 'pending';

ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_outbox: own read" ON notification_outbox;
CREATE POLICY "notification_outbox: own read" ON notification_outbox
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notification_outbox: service insert" ON notification_outbox;
CREATE POLICY "notification_outbox: service insert" ON notification_outbox
  FOR INSERT WITH CHECK (current_setting('role', true) = 'service_role');

REVOKE ALL ON notification_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT ON notification_outbox TO authenticated;
GRANT ALL ON notification_outbox TO service_role;

CREATE OR REPLACE FUNCTION _enqueue_notification(
  p_user_id UUID,
  p_channel TEXT,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notification_outbox (user_id, channel, event_type, payload)
  VALUES (p_user_id, p_channel, p_event_type, p_payload)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION _enqueue_notification(UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- Withdrawal on-chain tx hash tracking
ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS on_chain_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS broadcast_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION rpc_service_mark_withdrawal_broadcast(
  p_withdrawal_id UUID,
  p_tx_hash TEXT,
  p_reason TEXT DEFAULT 'on_chain_broadcast'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_req withdrawal_requests%ROWTYPE;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_req FROM withdrawal_requests WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'withdrawal_not_found'; END IF;
  IF v_req.status NOT IN ('approved', 'sent') THEN RAISE EXCEPTION 'invalid_withdrawal_status'; END IF;

  UPDATE withdrawal_requests
     SET status = 'sent',
         on_chain_tx_hash = p_tx_hash,
         broadcast_at = NOW(),
         sent_at = COALESCE(sent_at, NOW())
   WHERE id = p_withdrawal_id;

  PERFORM _enqueue_notification(
    v_req.user_id, 'push', 'withdrawal_sent',
    jsonb_build_object('withdrawal_id', p_withdrawal_id, 'tx_hash', p_tx_hash, 'amount', v_req.amount, 'currency', v_req.currency)
  );

  RETURN jsonb_build_object('ok', TRUE, 'withdrawal_id', p_withdrawal_id, 'tx_hash', p_tx_hash);
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_mark_withdrawal_broadcast(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_mark_withdrawal_broadcast(UUID, TEXT, TEXT) TO service_role;

-- Enable withdrawals when hot wallet configured (operator can disable via admin)
UPDATE app_config SET value = 'true', updated_at = NOW()
 WHERE key = 'feature_withdrawal_enabled';
