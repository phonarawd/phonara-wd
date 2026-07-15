-- ============================================================
-- Migration: ew_e9_identity_support
-- E9 Identity+Support — SIWE · tickets · analytics · app-install · tier LB
-- Plan: ew-e9-identity-wave · ADR-019
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Config + feature kills ──────────────────────────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('feature_siwe_login_enabled', 'true',
   'SIWE wallet login kill switch.'),
  ('feature_support_tickets_enabled', 'true',
   'Support tickets kill switch.'),
  ('feature_product_analytics_enabled', 'true',
   'Product analytics event recording kill switch.'),
  ('feature_app_install_mission_enabled', 'true',
   'App-install attribution mission kill switch.'),
  ('siwe_challenge_ttl_sec', '300',
   'SIWE challenge TTL seconds.'),
  ('siwe_default_chain_id', '1',
   'Default EIP-155 chain id for SIWE (Closed Beta).'),
  ('siwe_domain', 'phonara.net',
   'SIWE EIP-4361 domain pin.'),
  ('siwe_uri', 'https://phonara.net/login',
   'SIWE EIP-4361 URI pin.'),
  ('siwe_statement', 'Sign in to PHONARA with your wallet.',
   'SIWE statement shown to wallet.'),
  ('support_ticket_max_open', '5',
   'Max open/in_progress support tickets per user.'),
  ('product_analytics_event_allowlist',
   '["page_view","cta_click","mission_view","share_click","install_prompt_shown","install_accepted","siwe_challenge_created","support_ticket_created"]',
   'JSON array of allowed product analytics event names.'),
  ('viral_app_install_reward_phon', '50.000000',
   'PHON reward for one-time app_install viral mission.'),
  ('viral_app_install_max_per_lifetime', '1',
   'Max app_install claims per account (lifetime).')
ON CONFLICT (key) DO NOTHING;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('rpc_create_siwe_challenge', 20, 0.5, 1, 60),
  ('rpc_create_support_ticket', 5, 0.1, 1, 60),
  ('rpc_record_product_analytics_event', 60, 2, 1, 60),
  ('rpc_record_app_install_attribution', 3, 0.05, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- Extend admin feature whitelist
CREATE OR REPLACE FUNCTION rpc_set_feature_enabled(
  p_feature TEXT,
  p_enabled BOOLEAN,
  p_reason  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_key   TEXT;
  v_rows  INT;
BEGIN
  IF NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_feature NOT IN (
    'spot','futures','staking','game','referral','deposit','withdrawal',
    'p2p_transfer','giftcard_redeem',
    'siwe_login','support_tickets','product_analytics','app_install_mission'
  ) THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  v_key := 'feature_' || p_feature || '_enabled';
  UPDATE app_config
     SET value = CASE WHEN p_enabled THEN 'true' ELSE 'false' END, updated_at = NOW()
   WHERE key = v_key;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (v_actor, 'feature_toggle', 'app_config',
    jsonb_build_object('feature', p_feature, 'enabled', p_enabled, 'reason', p_reason));

  RETURN jsonb_build_object('feature', p_feature, 'enabled', p_enabled);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT) TO authenticated, service_role;

-- ─── Helpers: address normalize ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _siwe_normalize_address(p_address TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v TEXT := lower(btrim(COALESCE(p_address, '')));
BEGIN
  IF v LIKE '0x%' THEN
    v := substr(v, 3);
  END IF;
  IF v !~ '^[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'siwe_invalid_address';
  END IF;
  RETURN '0x' || v;
END;
$$;

REVOKE ALL ON FUNCTION _siwe_normalize_address(TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── Tables: SIWE ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS siwe_challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address      TEXT NOT NULL,
  chain_id     INT NOT NULL DEFAULT 1,
  nonce        TEXT NOT NULL,
  domain       TEXT NOT NULL,
  uri          TEXT NOT NULL,
  statement    TEXT NOT NULL,
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nonce)
);

CREATE INDEX IF NOT EXISTS siwe_challenges_address_idx
  ON siwe_challenges (address, expires_at DESC);
CREATE INDEX IF NOT EXISTS siwe_challenges_expires_idx
  ON siwe_challenges (expires_at) WHERE consumed_at IS NULL;

ALTER TABLE siwe_challenges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE siwe_challenges FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE siwe_challenges TO service_role;

CREATE TABLE IF NOT EXISTS user_wallet_identities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chain_namespace TEXT NOT NULL DEFAULT 'eip155',
  chain_id       INT NOT NULL DEFAULT 1,
  address        TEXT NOT NULL,
  verified_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chain_namespace, chain_id, address),
  UNIQUE (user_id, chain_namespace, chain_id, address)
);

CREATE INDEX IF NOT EXISTS user_wallet_identities_user_idx
  ON user_wallet_identities (user_id);

ALTER TABLE user_wallet_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_wallet_identities: own select" ON user_wallet_identities;
CREATE POLICY "user_wallet_identities: own select" ON user_wallet_identities
  FOR SELECT USING (auth.uid() = user_id OR _is_admin());

REVOKE ALL ON TABLE user_wallet_identities FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE user_wallet_identities TO authenticated;
GRANT ALL ON TABLE user_wallet_identities TO service_role;

-- ─── Tables: support tickets ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category         TEXT NOT NULL
                   CHECK (category IN (
                     'account','wallet','trade','sports','casino','earn','other'
                   )),
  subject          TEXT NOT NULL,
  body             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_progress','resolved','closed')),
  priority         TEXT NOT NULL DEFAULT 'normal'
                   CHECK (priority IN ('low','normal','high')),
  client_request_id TEXT,
  resolved_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  resolution_note  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_request_id)
);

CREATE INDEX IF NOT EXISTS support_tickets_user_idx
  ON support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx
  ON support_tickets (status, created_at DESC);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets: own select" ON support_tickets;
CREATE POLICY "support_tickets: own select" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id OR _is_admin());

REVOKE ALL ON TABLE support_tickets FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE support_tickets TO authenticated;
GRANT ALL ON TABLE support_tickets TO service_role;

-- ─── Tables: product analytics ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_analytics_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  anonymous_id    TEXT,
  event_name      TEXT NOT NULL,
  surface         TEXT,
  properties      JSONB NOT NULL DEFAULT '{}'::JSONB,
  client_event_id TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_event_id)
);

CREATE INDEX IF NOT EXISTS product_analytics_events_name_idx
  ON product_analytics_events (event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS product_analytics_events_user_idx
  ON product_analytics_events (user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE product_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_analytics_events: admin select" ON product_analytics_events;
CREATE POLICY "product_analytics_events: admin select" ON product_analytics_events
  FOR SELECT USING (_is_admin());

REVOKE ALL ON TABLE product_analytics_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE product_analytics_events TO authenticated;
GRANT ALL ON TABLE product_analytics_events TO service_role;

-- ─── Tables: app install attribution ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_install_attributions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  platform         TEXT NOT NULL
                   CHECK (platform IN ('pwa','android','ios','other')),
  client_event_id  TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::JSONB,
  installed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id),
  UNIQUE (user_id, client_event_id)
);

CREATE INDEX IF NOT EXISTS app_install_attributions_recorded_idx
  ON app_install_attributions (recorded_at DESC);

ALTER TABLE app_install_attributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_install_attributions: own select" ON app_install_attributions;
CREATE POLICY "app_install_attributions: own select" ON app_install_attributions
  FOR SELECT USING (auth.uid() = user_id OR _is_admin());

REVOKE ALL ON TABLE app_install_attributions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE app_install_attributions TO authenticated;
GRANT ALL ON TABLE app_install_attributions TO service_role;

-- ─── SIWE RPCs ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_create_siwe_challenge(
  p_address TEXT,
  p_chain_id INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_addr TEXT;
  v_chain INT;
  v_ttl INT;
  v_nonce TEXT;
  v_id UUID;
  v_domain TEXT;
  v_uri TEXT;
  v_statement TEXT;
  v_issued TIMESTAMPTZ := NOW();
  v_expires TIMESTAMPTZ;
  v_message TEXT;
  v_uid UUID := auth.uid();
BEGIN
  PERFORM _assert_feature_enabled('siwe_login');

  v_addr := _siwe_normalize_address(p_address);
  IF p_chain_id IS NOT NULL AND p_chain_id > 0 THEN
    v_chain := p_chain_id;
  ELSE
    SELECT COALESCE(value::INT, 1) INTO v_chain
      FROM app_config WHERE key = 'siwe_default_chain_id';
    v_chain := COALESCE(v_chain, 1);
  END IF;

  SELECT COALESCE(value::INT, 300) INTO v_ttl
    FROM app_config WHERE key = 'siwe_challenge_ttl_sec';
  SELECT value INTO v_domain FROM app_config WHERE key = 'siwe_domain';
  SELECT value INTO v_uri FROM app_config WHERE key = 'siwe_uri';
  SELECT value INTO v_statement FROM app_config WHERE key = 'siwe_statement';

  v_expires := v_issued + make_interval(secs => GREATEST(COALESCE(v_ttl, 300), 60));
  v_nonce := encode(extensions.gen_random_bytes(16), 'hex');
  v_id := gen_random_uuid();

  IF v_uid IS NOT NULL THEN
    PERFORM _enforce_rate_limit(v_uid, 'rpc_create_siwe_challenge');
  END IF;

  INSERT INTO siwe_challenges (
    id, address, chain_id, nonce, domain, uri, statement,
    issued_at, expires_at, user_id
  ) VALUES (
    v_id, v_addr, v_chain, v_nonce,
    COALESCE(v_domain, 'phonara.net'),
    COALESCE(v_uri, 'https://phonara.net/login'),
    COALESCE(v_statement, 'Sign in to PHONARA with your wallet.'),
    v_issued, v_expires, v_uid
  );

  v_message :=
    COALESCE(v_domain, 'phonara.net') || ' wants you to sign in with your Ethereum account:' || E'\n'
    || v_addr || E'\n\n'
    || COALESCE(v_statement, 'Sign in to PHONARA with your wallet.') || E'\n\n'
    || 'URI: ' || COALESCE(v_uri, 'https://phonara.net/login') || E'\n'
    || 'Version: 1' || E'\n'
    || 'Chain ID: ' || v_chain::TEXT || E'\n'
    || 'Nonce: ' || v_nonce || E'\n'
    || 'Issued At: ' || to_char(v_issued AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');

  RETURN jsonb_build_object(
    'ok', TRUE,
    'challenge_id', v_id,
    'address', v_addr,
    'chain_id', v_chain,
    'nonce', v_nonce,
    'domain', COALESCE(v_domain, 'phonara.net'),
    'uri', COALESCE(v_uri, 'https://phonara.net/login'),
    'statement', COALESCE(v_statement, 'Sign in to PHONARA with your wallet.'),
    'issued_at', v_issued,
    'expires_at', v_expires,
    'message', v_message
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_siwe_challenge(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_create_siwe_challenge(TEXT, INT)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_service_complete_siwe_login(
  p_challenge_id UUID,
  p_address TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ch siwe_challenges%ROWTYPE;
  v_addr TEXT;
  v_identity_id UUID;
BEGIN
  -- service_role only (edge after crypto verify)
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  PERFORM _assert_feature_enabled('siwe_login');
  v_addr := _siwe_normalize_address(p_address);

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'siwe_user_required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'siwe_user_not_found';
  END IF;

  SELECT * INTO v_ch
    FROM siwe_challenges
   WHERE id = p_challenge_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'siwe_challenge_not_found';
  END IF;
  IF v_ch.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'siwe_challenge_consumed';
  END IF;
  IF v_ch.expires_at <= NOW() THEN
    RAISE EXCEPTION 'siwe_challenge_expired';
  END IF;
  IF v_ch.address <> v_addr THEN
    RAISE EXCEPTION 'siwe_address_mismatch';
  END IF;

  UPDATE siwe_challenges
     SET consumed_at = NOW(), user_id = p_user_id
   WHERE id = p_challenge_id;

  IF EXISTS (
    SELECT 1 FROM user_wallet_identities
     WHERE chain_namespace = 'eip155'
       AND chain_id = v_ch.chain_id
       AND address = v_addr
       AND user_id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'siwe_address_linked_other_user';
  END IF;

  INSERT INTO user_wallet_identities (
    user_id, chain_namespace, chain_id, address, verified_at, last_login_at
  ) VALUES (
    p_user_id, 'eip155', v_ch.chain_id, v_addr, NOW(), NOW()
  )
  ON CONFLICT (chain_namespace, chain_id, address) DO UPDATE
    SET last_login_at = NOW(),
        verified_at = NOW()
  WHERE user_wallet_identities.user_id = EXCLUDED.user_id
  RETURNING id INTO v_identity_id;

  IF v_identity_id IS NULL THEN
    SELECT id INTO v_identity_id
      FROM user_wallet_identities
     WHERE chain_namespace = 'eip155'
       AND chain_id = v_ch.chain_id
       AND address = v_addr
       AND user_id = p_user_id;
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (
    p_user_id, 'siwe_login_complete', 'user_wallet_identities',
    jsonb_build_object(
      'challenge_id', p_challenge_id,
      'address', v_addr,
      'chain_id', v_ch.chain_id,
      'identity_id', v_identity_id
    )
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'user_id', p_user_id,
    'identity_id', v_identity_id,
    'address', v_addr,
    'chain_id', v_ch.chain_id
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_complete_siwe_login(UUID, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_complete_siwe_login(UUID, TEXT, UUID)
  TO service_role;

CREATE OR REPLACE FUNCTION rpc_list_wallet_identities()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_rows JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'chain_namespace', i.chain_namespace,
    'chain_id', i.chain_id,
    'address', i.address,
    'verified_at', i.verified_at,
    'last_login_at', i.last_login_at
  ) ORDER BY i.verified_at DESC), '[]'::JSONB)
  INTO v_rows
  FROM user_wallet_identities i
  WHERE i.user_id = v_uid;

  RETURN jsonb_build_object('ok', TRUE, 'identities', v_rows);
END;
$$;

REVOKE ALL ON FUNCTION rpc_list_wallet_identities() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_list_wallet_identities() TO authenticated, service_role;

-- ─── Support ticket RPCs ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_create_support_ticket(
  p_category TEXT,
  p_subject TEXT,
  p_body TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_open INT;
  v_max INT;
  v_cat TEXT := lower(btrim(COALESCE(p_category, '')));
  v_subj TEXT := btrim(COALESCE(p_subject, ''));
  v_body TEXT := btrim(COALESCE(p_body, ''));
  v_cid TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_feature_enabled('support_tickets');
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_uid, 'rpc_create_support_ticket');

  IF v_cat NOT IN ('account','wallet','trade','sports','casino','earn','other') THEN
    RAISE EXCEPTION 'support_invalid_category';
  END IF;
  IF length(v_subj) < 3 OR length(v_subj) > 200 THEN
    RAISE EXCEPTION 'support_invalid_subject';
  END IF;
  IF length(v_body) < 10 OR length(v_body) > 8000 THEN
    RAISE EXCEPTION 'support_invalid_body';
  END IF;

  v_cid := NULLIF(btrim(COALESCE(p_client_request_id, '')), '');
  IF v_cid IS NOT NULL THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_uid, v_cid, 'rpc_create_support_ticket')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      SELECT id INTO v_id FROM support_tickets
       WHERE user_id = v_uid AND client_request_id = v_cid;
      IF FOUND THEN
        RETURN jsonb_build_object('ok', TRUE, 'ticket_id', v_id, 'idempotent', TRUE);
      END IF;
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  SELECT COALESCE(value::INT, 5) INTO v_max
    FROM app_config WHERE key = 'support_ticket_max_open';
  SELECT COUNT(*)::INT INTO v_open
    FROM support_tickets
   WHERE user_id = v_uid AND status IN ('open', 'in_progress');
  IF v_open >= COALESCE(v_max, 5) THEN
    RAISE EXCEPTION 'support_too_many_open';
  END IF;

  INSERT INTO support_tickets (
    user_id, category, subject, body, client_request_id
  ) VALUES (
    v_uid, v_cat, v_subj, v_body, v_cid
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'ticket_id', v_id,
    'status', 'open'
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_create_support_ticket(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_support_ticket(TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_list_support_tickets(p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_rows JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'category', t.category,
    'subject', t.subject,
    'status', t.status,
    'priority', t.priority,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'resolved_at', t.resolved_at
  ) ORDER BY t.created_at DESC), '[]'::JSONB)
  INTO v_rows
  FROM (
    SELECT * FROM support_tickets
     WHERE user_id = v_uid
     ORDER BY created_at DESC
     LIMIT v_limit
  ) t;

  RETURN jsonb_build_object('ok', TRUE, 'tickets', v_rows, 'limit', v_limit);
END;
$$;

REVOKE ALL ON FUNCTION rpc_list_support_tickets(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_list_support_tickets(INT)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_get_support_ticket(p_ticket_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_t support_tickets%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT * INTO v_t FROM support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'support_ticket_not_found'; END IF;
  IF v_t.user_id <> v_uid AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'ticket', jsonb_build_object(
      'id', v_t.id,
      'category', v_t.category,
      'subject', v_t.subject,
      'body', v_t.body,
      'status', v_t.status,
      'priority', v_t.priority,
      'created_at', v_t.created_at,
      'updated_at', v_t.updated_at,
      'resolved_at', v_t.resolved_at,
      'resolution_note', CASE WHEN _is_admin() OR v_t.user_id = v_uid
        THEN v_t.resolution_note ELSE NULL END
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_support_ticket(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_support_ticket(UUID)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_list_support_tickets(
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_status TEXT := NULLIF(lower(btrim(COALESCE(p_status, ''))), '');
  v_rows JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF v_status IS NOT NULL AND v_status NOT IN ('open','in_progress','resolved','closed') THEN
    RAISE EXCEPTION 'support_invalid_status';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'user_id', t.user_id,
    'category', t.category,
    'subject', t.subject,
    'status', t.status,
    'priority', t.priority,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'resolved_at', t.resolved_at
  ) ORDER BY t.created_at DESC), '[]'::JSONB)
  INTO v_rows
  FROM (
    SELECT * FROM support_tickets
     WHERE (v_status IS NULL OR status = v_status)
     ORDER BY created_at DESC
     LIMIT v_limit
  ) t;

  RETURN jsonb_build_object('ok', TRUE, 'tickets', v_rows, 'limit', v_limit);
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_support_tickets(TEXT, INT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_list_support_tickets(TEXT, INT)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_resolve_support_ticket(
  p_ticket_id UUID,
  p_reason TEXT,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_t support_tickets%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  SELECT * INTO v_t FROM support_tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'support_ticket_not_found'; END IF;
  IF v_t.status IN ('resolved', 'closed') THEN
    RETURN jsonb_build_object('ok', TRUE, 'ticket_id', v_t.id, 'status', v_t.status, 'idempotent', TRUE);
  END IF;

  UPDATE support_tickets
     SET status = 'resolved',
         resolved_by = v_actor,
         resolved_at = NOW(),
         resolution_note = NULLIF(btrim(COALESCE(p_resolution_note, '')), ''),
         updated_at = NOW()
   WHERE id = p_ticket_id;

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (
    v_actor, 'support_ticket_resolve', 'support_tickets',
    jsonb_build_object(
      'ticket_id', p_ticket_id,
      'user_id', v_t.user_id,
      'reason', btrim(p_reason)
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'ticket_id', p_ticket_id, 'status', 'resolved');
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_resolve_support_ticket(UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_resolve_support_ticket(UUID, TEXT, TEXT)
  TO authenticated, service_role;

-- ─── Product analytics RPCs ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _product_analytics_event_allowed(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw TEXT;
  v_arr JSONB;
BEGIN
  SELECT value INTO v_raw FROM app_config WHERE key = 'product_analytics_event_allowlist';
  BEGIN
    v_arr := v_raw::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  RETURN v_arr ? p_name;
END;
$$;

REVOKE ALL ON FUNCTION _product_analytics_event_allowed(TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_record_product_analytics_event(
  p_event_name TEXT,
  p_surface TEXT DEFAULT NULL,
  p_properties JSONB DEFAULT '{}'::JSONB,
  p_anonymous_id TEXT DEFAULT NULL,
  p_client_event_id TEXT DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_name TEXT := lower(btrim(COALESCE(p_event_name, '')));
  v_cid TEXT := NULLIF(btrim(COALESCE(p_client_event_id, '')), '');
  v_anon TEXT := NULLIF(btrim(COALESCE(p_anonymous_id, '')), '');
  v_props JSONB := COALESCE(p_properties, '{}'::JSONB);
  v_id UUID;
  v_keys TEXT[];
BEGIN
  PERFORM _assert_feature_enabled('product_analytics');

  IF v_name = '' OR NOT _product_analytics_event_allowed(v_name) THEN
    RAISE EXCEPTION 'analytics_event_not_allowed';
  END IF;

  IF v_uid IS NOT NULL THEN
    PERFORM _enforce_rate_limit(v_uid, 'rpc_record_product_analytics_event');
  END IF;

  IF jsonb_typeof(v_props) <> 'object' THEN
    RAISE EXCEPTION 'analytics_invalid_properties';
  END IF;

  SELECT ARRAY(SELECT jsonb_object_keys(v_props)) INTO v_keys;
  IF EXISTS (
    SELECT 1 FROM unnest(v_keys) k
     WHERE lower(k) IN (
       'email','password','token','access_token','refresh_token',
       'wallet','address','balance','phon','usdt','secret','mnemonic'
     )
  ) THEN
    RAISE EXCEPTION 'analytics_pii_forbidden';
  END IF;

  IF v_uid IS NOT NULL AND v_cid IS NOT NULL THEN
    SELECT id INTO v_id FROM product_analytics_events
     WHERE user_id = v_uid AND client_event_id = v_cid;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', TRUE, 'event_id', v_id, 'idempotent', TRUE);
    END IF;
  END IF;

  INSERT INTO product_analytics_events (
    user_id, anonymous_id, event_name, surface, properties,
    client_event_id, occurred_at
  ) VALUES (
    v_uid, v_anon, v_name, NULLIF(btrim(COALESCE(p_surface, '')), ''),
    v_props, v_cid, COALESCE(p_occurred_at, NOW())
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', TRUE, 'event_id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_record_product_analytics_event(
  TEXT, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_record_product_analytics_event(
  TEXT, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ
) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_admin_get_product_analytics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_by_event JSONB;
  v_total BIGINT;
  v_since TIMESTAMPTZ := NOW() - INTERVAL '30 days';
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COUNT(*) INTO v_total
    FROM product_analytics_events
   WHERE occurred_at >= v_since;

  SELECT COALESCE(jsonb_object_agg(event_name, cnt), '{}'::JSONB)
    INTO v_by_event
  FROM (
    SELECT event_name, COUNT(*)::BIGINT AS cnt
      FROM product_analytics_events
     WHERE occurred_at >= v_since
     GROUP BY event_name
     ORDER BY COUNT(*) DESC
  ) s;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'window', '30d',
    'total_events', v_total,
    'by_event', v_by_event,
    'generated_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_get_product_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_get_product_analytics()
  TO authenticated, service_role;

-- ─── Viral helpers: app_install quota window ─────────────────────────────────

CREATE OR REPLACE FUNCTION _viral_quota_window_key(p_mission viral_mission_code)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW() AT TIME ZONE 'UTC';
BEGIN
  RETURN CASE p_mission
    WHEN 'share_referral_link' THEN 'day:' || to_char(v_now, 'YYYY-MM-DD')
    WHEN 'invite_friend_signup' THEN 'day:' || to_char(v_now, 'YYYY-MM-DD')
    WHEN 'viral_streak_share' THEN 'day:' || to_char(v_now, 'YYYY-MM-DD')
    WHEN 'share_story_template' THEN 'week:' || to_char(v_now, 'IYYY-IW')
    WHEN 'affiliate_content_post' THEN 'month:' || to_char(v_now, 'YYYY-MM')
    WHEN 'app_install' THEN 'lifetime:once'
  END;
END;
$$;

REVOKE ALL ON FUNCTION _viral_quota_window_key(viral_mission_code)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _viral_quota_max(p_mission viral_mission_code)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_config INT;
  v_tier_cap INT;
BEGIN
  IF p_mission = 'app_install' THEN
    SELECT COALESCE(value::INT, 1) INTO v_config
      FROM app_config WHERE key = 'viral_app_install_max_per_lifetime';
    RETURN GREATEST(COALESCE(v_config, 1), 1);
  END IF;

  SELECT COALESCE(value::INT, 1) INTO v_config
    FROM app_config
   WHERE key = 'viral_' || p_mission::TEXT ||
     CASE p_mission
       WHEN 'share_story_template' THEN '_max_per_week'
       WHEN 'affiliate_content_post' THEN '_max_per_month'
       ELSE '_max_per_day'
     END;

  IF p_mission IN ('share_referral_link', 'invite_friend_signup') AND v_user IS NOT NULL THEN
    v_tier_cap := _earn_limit_viral_share(_earn_user_tier(v_user));
    RETURN LEAST(v_config, v_tier_cap);
  END IF;

  RETURN v_config;
END;
$$;

REVOKE ALL ON FUNCTION _viral_quota_max(viral_mission_code)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_viral_mission_eligible(
  p_user_id UUID,
  p_mission viral_mission_code
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_streak INT;
  v_min    INT;
BEGIN
  IF p_mission = 'app_install' THEN
    IF NOT EXISTS (
      SELECT 1 FROM app_install_attributions WHERE user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'viral_app_install_not_attributed';
    END IF;
    RETURN;
  END IF;

  IF p_mission = 'invite_friend_signup' THEN
    IF NOT EXISTS (
      SELECT 1 FROM referrals
       WHERE referrer_id = p_user_id
         AND state IN ('qualified', 'paid')
         AND qualified_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
    ) AND NOT EXISTS (
      SELECT 1 FROM referrals
       WHERE referrer_id = p_user_id
         AND state = 'paid'
         AND rewarded_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
    ) THEN
      RAISE EXCEPTION 'viral_invite_not_eligible';
    END IF;
  END IF;

  IF p_mission = 'viral_streak_share' THEN
    SELECT COALESCE(value::INT, 7) INTO v_min
      FROM app_config WHERE key = 'viral_streak_share_min_days';
    SELECT COALESCE(current_streak, 0) INTO v_streak
      FROM user_streaks WHERE user_id = p_user_id;
    IF COALESCE(v_streak, 0) < v_min THEN
      RAISE EXCEPTION 'viral_streak_not_eligible';
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_viral_mission_eligible(UUID, viral_mission_code)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_get_viral_mission_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_m       viral_mission_code;
  v_items   JSONB := '[]'::JSONB;
  v_used    INT;
  v_max     INT;
  v_streak  INT;
  v_min     INT;
  v_live    BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  FOREACH v_m IN ARRAY ARRAY[
    'share_referral_link'::viral_mission_code,
    'share_story_template',
    'invite_friend_signup',
    'affiliate_content_post',
    'viral_streak_share',
    'app_install'
  ] LOOP
    SELECT COALESCE(enabled, TRUE) AND COALESCE(exposure, 'live') = 'live'
      INTO v_live
      FROM mission_catalog
     WHERE catalog_key = 'viral:' || v_m::TEXT;

    IF FOUND AND v_live IS NOT TRUE THEN
      CONTINUE;
    END IF;

    v_used := _viral_quota_used(v_user_id, v_m);
    v_max := _viral_quota_max(v_m);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'mission', v_m,
      'used', v_used,
      'max', v_max,
      'remaining', GREATEST(v_max - v_used, 0),
      'window', _viral_quota_window_key(v_m),
      'reward_phon', _viral_mission_reward(v_m)
    ));
  END LOOP;

  SELECT COALESCE(current_streak, 0) INTO v_streak FROM user_streaks WHERE user_id = v_user_id;
  SELECT COALESCE(value::INT, 7) INTO v_min FROM app_config WHERE key = 'viral_streak_share_min_days';

  RETURN jsonb_build_object(
    'ok', TRUE,
    'missions', v_items,
    'streak_days', COALESCE(v_streak, 0),
    'streak_target_days', v_min
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_viral_mission_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_viral_mission_status() TO authenticated;

INSERT INTO mission_catalog (
  catalog_key, family, mission_code, config_key, quota_config_key, extra_config_key,
  exposure, enabled, sort_order, title_i18n_key
) VALUES
  ('viral:app_install', 'viral', 'app_install',
   'viral_app_install_reward_phon', 'viral_app_install_max_per_lifetime', NULL,
   'hidden', TRUE, 60, 'admin.missions.viral.appInstall')
ON CONFLICT (catalog_key) DO UPDATE SET
  config_key = EXCLUDED.config_key,
  quota_config_key = EXCLUDED.quota_config_key,
  title_i18n_key = EXCLUDED.title_i18n_key,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

CREATE OR REPLACE FUNCTION rpc_record_app_install_attribution(
  p_platform TEXT,
  p_client_event_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_platform TEXT := lower(btrim(COALESCE(p_platform, '')));
  v_cid TEXT := NULLIF(btrim(COALESCE(p_client_event_id, '')), '');
  v_attr_id UUID;
  v_claim_id UUID;
  v_existing UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_feature_enabled('app_install_mission');
  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_uid);
  PERFORM _enforce_rate_limit(v_uid, 'rpc_record_app_install_attribution');

  IF v_platform NOT IN ('pwa','android','ios','other') THEN
    RAISE EXCEPTION 'app_install_invalid_platform';
  END IF;

  SELECT id INTO v_existing FROM app_install_attributions WHERE user_id = v_uid;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'attribution_id', v_existing,
      'idempotent', TRUE,
      'granted', FALSE
    );
  END IF;

  IF v_cid IS NOT NULL THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_uid, v_cid, 'rpc_record_app_install_attribution')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      SELECT id INTO v_attr_id FROM app_install_attributions WHERE user_id = v_uid;
      RETURN jsonb_build_object(
        'ok', TRUE,
        'attribution_id', v_attr_id,
        'idempotent', TRUE,
        'granted', FALSE
      );
    END IF;
  END IF;

  INSERT INTO app_install_attributions (
    user_id, platform, client_event_id, metadata
  ) VALUES (
    v_uid, v_platform, v_cid, COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_attr_id;

  -- Engine grant allowed while catalog exposure=hidden (UI unlock = E10).
  -- Enabled=false still blocks.
  IF EXISTS (
    SELECT 1 FROM mission_catalog
     WHERE catalog_key = 'viral:app_install' AND COALESCE(enabled, FALSE) IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'mission_disabled';
  END IF;

  PERFORM _assert_viral_mission_eligible(v_uid, 'app_install'::viral_mission_code);

  IF _viral_quota_used(v_uid, 'app_install'::viral_mission_code)
     >= _viral_quota_max('app_install'::viral_mission_code) THEN
    RAISE EXCEPTION 'viral_quota_exhausted';
  END IF;

  v_claim_id := _grant_viral_mission(
    v_uid,
    'app_install'::viral_mission_code,
    _viral_quota_window_key('app_install'::viral_mission_code) || ':1',
    v_cid,
    jsonb_build_object('platform', v_platform, 'attribution_id', v_attr_id)
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'attribution_id', v_attr_id,
    'claim_id', v_claim_id,
    'granted', TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_record_app_install_attribution(TEXT, TEXT, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_record_app_install_attribution(TEXT, TEXT, JSONB)
  TO authenticated, service_role;

-- ─── Tier leaderboard ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_get_tier_leaderboard(p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_entries JSONB := '[]'::JSONB;
  v_self JSONB := NULL;
  v_self_rank INT;
  v_self_xp BIGINT;
  v_self_tier TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  WITH ranked AS (
    SELECT
      u.user_id,
      u.xp,
      u.tier::TEXT AS tier,
      ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.user_id ASC)::INT AS rank
    FROM user_earn_vip u
    WHERE u.xp > 0
  ),
  top_n AS (
    SELECT
      rk.rank,
      rk.xp,
      rk.tier,
      rk.user_id,
      _cms_mask_display_name(
        COALESCE(NULLIF(p.display_name, ''), NULLIF(p.username, ''), LEFT(p.id::TEXT, 8))
      ) AS display_name,
      (rk.user_id = v_uid) AS is_self
    FROM ranked rk
    JOIN profiles p ON p.id = rk.user_id
    WHERE rk.rank <= v_limit
    ORDER BY rk.rank
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'rank', t.rank,
    'display_name', t.display_name,
    'tier', t.tier,
    'xp', t.xp,
    'is_self', t.is_self
  ) ORDER BY t.rank), '[]'::JSONB)
  INTO v_entries
  FROM top_n t;

  SELECT rk.rank, rk.xp, rk.tier
    INTO v_self_rank, v_self_xp, v_self_tier
  FROM (
    SELECT
      u.user_id,
      u.xp,
      u.tier::TEXT AS tier,
      ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.user_id ASC)::INT AS rank
    FROM user_earn_vip u
    WHERE u.xp > 0
  ) rk
  WHERE rk.user_id = v_uid;

  IF v_self_rank IS NOT NULL THEN
    v_self := jsonb_build_object(
      'rank', v_self_rank,
      'xp', v_self_xp,
      'tier', v_self_tier,
      'display_name', _cms_mask_display_name(
        (SELECT COALESCE(NULLIF(display_name, ''), NULLIF(username, ''), LEFT(id::TEXT, 8))
           FROM profiles WHERE id = v_uid)
      ),
      'is_self', TRUE
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'limit', v_limit,
    'generated_at', v_now,
    'entries', v_entries,
    'self', v_self
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_tier_leaderboard(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_tier_leaderboard(INT)
  TO authenticated, service_role;

-- ─── Viral analytics: share events available when product events exist ───────

CREATE OR REPLACE FUNCTION rpc_admin_get_viral_analytics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_referrals JSONB;
  v_affiliate JSONB;
  v_missions JSONB;
  v_commissions JSONB;
  v_preview JSONB;
  v_now TIMESTAMPTZ := NOW();
  v_share_available BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();

  SELECT jsonb_build_object(
    'total', COUNT(*)::INT,
    'by_state', jsonb_build_object(
      'registered', COUNT(*) FILTER (WHERE state = 'registered')::INT,
      'pending', COUNT(*) FILTER (WHERE state = 'pending')::INT,
      'qualified', COUNT(*) FILTER (WHERE state = 'qualified')::INT,
      'paid', COUNT(*) FILTER (WHERE state = 'paid')::INT,
      'blocked', COUNT(*) FILTER (WHERE state = 'blocked')::INT
    ),
    'unique_referrers', COUNT(DISTINCT referrer_id)::INT,
    'recent_7d', COUNT(*) FILTER (
      WHERE created_at >= v_now - INTERVAL '7 days'
    )::INT
  )
  INTO v_referrals
  FROM referrals;

  SELECT jsonb_build_object(
    'total', COUNT(*)::INT,
    'unique_parents', COUNT(DISTINCT parent_id)::INT,
    'recent_7d', COUNT(*) FILTER (
      WHERE created_at >= v_now - INTERVAL '7 days'
    )::INT
  )
  INTO v_affiliate
  FROM affiliate_relationships;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'mission', m.mission,
    'claim_count', m.claim_count,
    'phon_awarded_total', m.phon_total
  ) ORDER BY m.claim_count DESC), '[]'::JSONB)
  INTO v_missions
  FROM (
    SELECT
      mission::TEXT AS mission,
      COUNT(*)::INT AS claim_count,
      COALESCE(SUM(phon_awarded::NUMERIC), 0)::TEXT AS phon_total
    FROM viral_mission_claims
    GROUP BY mission
  ) m;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'domain', c.domain,
    'currency', c.currency,
    'gross_revenue_total', c.gross_total,
    'latest_date', c.latest_date,
    'row_count', c.row_count
  ) ORDER BY c.latest_date DESC), '[]'::JSONB)
  INTO v_commissions
  FROM (
    SELECT
      domain,
      currency,
      COALESCE(SUM(gross_revenue::NUMERIC), 0)::TEXT AS gross_total,
      MAX(aggregate_date)::TEXT AS latest_date,
      COUNT(*)::INT AS row_count
    FROM affiliate_commission_daily_aggregates
    GROUP BY domain, currency
  ) c;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'rank', t.rank,
    'display_name', t.display_name,
    'qualified_count', t.qualified_count
  ) ORDER BY t.rank), '[]'::JSONB)
  INTO v_preview
  FROM (
    SELECT
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, r.referrer_id ASC)::INT AS rank,
      COUNT(*)::INT AS qualified_count,
      _cms_mask_display_name(
        COALESCE(NULLIF(p.display_name, ''), NULLIF(p.username, ''), LEFT(p.id::TEXT, 8))
      ) AS display_name
    FROM referrals r
    JOIN profiles p ON p.id = r.referrer_id
    WHERE r.state IN ('qualified', 'paid')
    GROUP BY r.referrer_id, p.display_name, p.username, p.id
    HAVING COUNT(*) > 0
    ORDER BY COUNT(*) DESC, r.referrer_id ASC
    LIMIT 10
  ) t;

  SELECT EXISTS (SELECT 1 FROM product_analytics_events LIMIT 1)
    INTO v_share_available;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'generated_at', v_now,
    'referrals', COALESCE(v_referrals, '{}'::JSONB),
    'affiliate_links', COALESCE(v_affiliate, '{}'::JSONB),
    'viral_missions', COALESCE(v_missions, '[]'::JSONB),
    'commissions', COALESCE(v_commissions, '[]'::JSONB),
    'leaderboard_preview', COALESCE(v_preview, '[]'::JSONB),
    'share_events_available', COALESCE(v_share_available, FALSE)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_get_viral_analytics()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_get_viral_analytics()
  TO authenticated, service_role;
