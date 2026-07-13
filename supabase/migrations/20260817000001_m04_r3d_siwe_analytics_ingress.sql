-- M-04 / Platform audit R3-d (audit-r3d-siwe-analytics-ingress)
-- 1) Revoke anon EXECUTE on SIWE challenge + product analytics record RPCs.
-- 2) Service ingress RPCs with HMAC-hashed IP + resource dual rate buckets.
-- 3) Analytics payload/length limits · anon idempotency · retention purge.
-- 4) SIWE complete rejects challenge.user_id mismatch (no arbitrary client bind).
-- Money path: 0 (identity/analytics only).

SET search_path = public, pg_temp;

-- ─── Config ──────────────────────────────────────────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('product_analytics_retention_days', '90',
   'Days to retain product_analytics_events before service purge.'),
  ('product_analytics_max_properties_bytes', '2048',
   'Max jsonb properties octet length for product analytics.'),
  ('product_analytics_max_surface_len', '64',
   'Max surface string length for product analytics.'),
  ('product_analytics_max_anonymous_id_len', '128',
   'Max anonymous_id length for product analytics.'),
  ('product_analytics_max_client_event_id_len', '128',
   'Max client_event_id length for product analytics.'),
  ('siwe_challenge_retention_hours', '24',
   'Hours to retain expired/consumed SIWE challenges before purge.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO rpc_rate_limit_configs (rpc_name, capacity, refill_rate, cost, window_sec) VALUES
  ('service_ingress_siwe_challenge', 20, 0.5, 1, 60),
  ('service_ingress_product_analytics', 60, 2, 1, 60)
ON CONFLICT (rpc_name) DO NOTHING;

-- Anon analytics idempotency (NULL user_id rows were not unique under (user_id, client_event_id))
CREATE UNIQUE INDEX IF NOT EXISTS product_analytics_events_anon_client_event_uidx
  ON product_analytics_events (anonymous_id, client_event_id)
  WHERE user_id IS NULL
    AND anonymous_id IS NOT NULL
    AND client_event_id IS NOT NULL;

-- ─── Dual IP/resource ingress buckets ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS service_ingress_rate_buckets (
  bucket_scope  TEXT NOT NULL CHECK (bucket_scope IN ('ip', 'resource')),
  bucket_key    TEXT NOT NULL,
  resource      TEXT NOT NULL REFERENCES rpc_rate_limit_configs(rpc_name),
  tokens        NUMERIC NOT NULL,
  last_refill   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket_scope, bucket_key, resource)
);

CREATE INDEX IF NOT EXISTS service_ingress_rate_buckets_resource_idx
  ON service_ingress_rate_buckets (resource, last_refill);

ALTER TABLE service_ingress_rate_buckets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE service_ingress_rate_buckets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE service_ingress_rate_buckets TO service_role;

CREATE OR REPLACE FUNCTION _normalize_ingress_ip_hmac(p_ip_hmac TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v TEXT := lower(btrim(COALESCE(p_ip_hmac, '')));
BEGIN
  IF v !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'ingress_ip_hmac_invalid';
  END IF;
  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION _normalize_ingress_ip_hmac(TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _consume_service_ingress_bucket(
  p_scope TEXT,
  p_key TEXT,
  p_resource TEXT,
  p_capacity NUMERIC,
  p_refill_rate NUMERIC,
  p_cost NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_bkt service_ingress_rate_buckets%ROWTYPE;
  v_elapsed NUMERIC;
  v_tokens NUMERIC;
BEGIN
  INSERT INTO service_ingress_rate_buckets (bucket_scope, bucket_key, resource, tokens, last_refill)
  VALUES (p_scope, p_key, p_resource, p_capacity, v_now)
  ON CONFLICT (bucket_scope, bucket_key, resource) DO NOTHING;

  SELECT * INTO v_bkt
    FROM service_ingress_rate_buckets
   WHERE bucket_scope = p_scope AND bucket_key = p_key AND resource = p_resource
   FOR UPDATE;

  v_elapsed := EXTRACT(EPOCH FROM (v_now - v_bkt.last_refill));
  v_tokens := LEAST(p_capacity, v_bkt.tokens + (v_elapsed * p_refill_rate));
  IF v_tokens < p_cost THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING HINT = p_resource || ':' || p_scope;
  END IF;

  UPDATE service_ingress_rate_buckets
     SET tokens = v_tokens - p_cost, last_refill = v_now
   WHERE bucket_scope = p_scope AND bucket_key = p_key AND resource = p_resource;
END;
$$;

REVOKE ALL ON FUNCTION _consume_service_ingress_bucket(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _enforce_service_ingress_rate_limit(
  p_ip_hmac TEXT,
  p_resource TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cfg rpc_rate_limit_configs%ROWTYPE;
  v_ip TEXT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  v_ip := _normalize_ingress_ip_hmac(p_ip_hmac);

  SELECT * INTO v_cfg
    FROM rpc_rate_limit_configs
   WHERE rpc_name = p_resource AND is_active;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Dual bucket: HMAC(IP)×resource then global resource.
  PERFORM _consume_service_ingress_bucket(
    'ip', v_ip, p_resource, v_cfg.capacity, v_cfg.refill_rate, v_cfg.cost
  );
  PERFORM _consume_service_ingress_bucket(
    'resource', p_resource, p_resource, v_cfg.capacity, v_cfg.refill_rate, v_cfg.cost
  );
END;
$$;

REVOKE ALL ON FUNCTION _enforce_service_ingress_rate_limit(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION _enforce_service_ingress_rate_limit(TEXT, TEXT)
  TO service_role;

-- ─── Analytics payload guards ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _assert_product_analytics_payload(
  p_surface TEXT,
  p_properties JSONB,
  p_anonymous_id TEXT,
  p_client_event_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_props JSONB := COALESCE(p_properties, '{}'::JSONB);
  v_keys TEXT[];
  v_max_bytes INT;
  v_max_surface INT;
  v_max_anon INT;
  v_max_cid INT;
  v_surface TEXT := NULLIF(btrim(COALESCE(p_surface, '')), '');
  v_anon TEXT := NULLIF(btrim(COALESCE(p_anonymous_id, '')), '');
  v_cid TEXT := NULLIF(btrim(COALESCE(p_client_event_id, '')), '');
BEGIN
  IF jsonb_typeof(v_props) <> 'object' THEN
    RAISE EXCEPTION 'analytics_invalid_properties';
  END IF;

  SELECT COALESCE(value::INT, 2048) INTO v_max_bytes
    FROM app_config WHERE key = 'product_analytics_max_properties_bytes';
  SELECT COALESCE(value::INT, 64) INTO v_max_surface
    FROM app_config WHERE key = 'product_analytics_max_surface_len';
  SELECT COALESCE(value::INT, 128) INTO v_max_anon
    FROM app_config WHERE key = 'product_analytics_max_anonymous_id_len';
  SELECT COALESCE(value::INT, 128) INTO v_max_cid
    FROM app_config WHERE key = 'product_analytics_max_client_event_id_len';

  IF octet_length(v_props::TEXT) > GREATEST(COALESCE(v_max_bytes, 2048), 64) THEN
    RAISE EXCEPTION 'analytics_payload_too_large';
  END IF;
  IF v_surface IS NOT NULL AND char_length(v_surface) > GREATEST(COALESCE(v_max_surface, 64), 1) THEN
    RAISE EXCEPTION 'analytics_surface_too_long';
  END IF;
  IF v_anon IS NOT NULL AND char_length(v_anon) > GREATEST(COALESCE(v_max_anon, 128), 1) THEN
    RAISE EXCEPTION 'analytics_anonymous_id_too_long';
  END IF;
  IF v_cid IS NOT NULL AND char_length(v_cid) > GREATEST(COALESCE(v_max_cid, 128), 1) THEN
    RAISE EXCEPTION 'analytics_client_event_id_too_long';
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
END;
$$;

REVOKE ALL ON FUNCTION _assert_product_analytics_payload(TEXT, JSONB, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── Client SIWE challenge — authenticated/service only (anon revoked) ───────

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
  -- Anon PostgREST path revoked; body still guards unauthenticated callers.
  IF v_uid IS NULL AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

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

REVOKE ALL ON FUNCTION rpc_create_siwe_challenge(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_create_siwe_challenge(TEXT, INT)
  TO authenticated, service_role;

-- ─── Service SIWE challenge (HMAC IP dual-bucket) ────────────────────────────

CREATE OR REPLACE FUNCTION rpc_service_create_siwe_challenge(
  p_address TEXT,
  p_chain_id INT DEFAULT NULL,
  p_ip_hmac TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  PERFORM _enforce_service_ingress_rate_limit(
    p_ip_hmac,
    'service_ingress_siwe_challenge'
  );

  RETURN rpc_create_siwe_challenge(p_address, p_chain_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_create_siwe_challenge(TEXT, INT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_create_siwe_challenge(TEXT, INT, TEXT)
  TO service_role;

-- ─── SIWE identity lookup (edge resolve — no client user_id) ─────────────────

CREATE OR REPLACE FUNCTION rpc_service_lookup_siwe_identity(
  p_address TEXT,
  p_chain_id INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_addr TEXT;
  v_chain INT;
  v_user UUID;
  v_identity UUID;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  v_addr := _siwe_normalize_address(p_address);
  IF p_chain_id IS NOT NULL AND p_chain_id > 0 THEN
    v_chain := p_chain_id;
  ELSE
    SELECT COALESCE(value::INT, 1) INTO v_chain
      FROM app_config WHERE key = 'siwe_default_chain_id';
    v_chain := COALESCE(v_chain, 1);
  END IF;

  SELECT id, user_id INTO v_identity, v_user
    FROM user_wallet_identities
   WHERE chain_namespace = 'eip155'
     AND chain_id = v_chain
     AND address = v_addr;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', TRUE, 'found', FALSE, 'address', v_addr, 'chain_id', v_chain);
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'found', TRUE,
    'user_id', v_user,
    'identity_id', v_identity,
    'address', v_addr,
    'chain_id', v_chain
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_lookup_siwe_identity(TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_lookup_siwe_identity(TEXT, INT)
  TO service_role;

-- ─── SIWE complete — challenge bind / identity conflict guards ───────────────

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

  -- Challenge created while authenticated must bind that identity only.
  IF v_ch.user_id IS NOT NULL AND v_ch.user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'siwe_user_mismatch';
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

-- ─── Client analytics — authenticated/service only (anon revoked) ────────────

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
BEGIN
  IF v_uid IS NULL AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  PERFORM _assert_feature_enabled('product_analytics');

  IF v_name = '' OR NOT _product_analytics_event_allowed(v_name) THEN
    RAISE EXCEPTION 'analytics_event_not_allowed';
  END IF;

  IF v_uid IS NOT NULL THEN
    PERFORM _enforce_rate_limit(v_uid, 'rpc_record_product_analytics_event');
  END IF;

  PERFORM _assert_product_analytics_payload(p_surface, v_props, v_anon, v_cid);

  IF v_uid IS NOT NULL AND v_cid IS NOT NULL THEN
    SELECT id INTO v_id FROM product_analytics_events
     WHERE user_id = v_uid AND client_event_id = v_cid;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', TRUE, 'event_id', v_id, 'idempotent', TRUE);
    END IF;
  END IF;

  IF v_uid IS NULL AND v_anon IS NOT NULL AND v_cid IS NOT NULL THEN
    SELECT id INTO v_id FROM product_analytics_events
     WHERE user_id IS NULL AND anonymous_id = v_anon AND client_event_id = v_cid;
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
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_record_product_analytics_event(
  TEXT, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ
) TO authenticated, service_role;

-- ─── Service analytics ingress ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_service_record_product_analytics_event(
  p_event_name TEXT,
  p_surface TEXT DEFAULT NULL,
  p_properties JSONB DEFAULT '{}'::JSONB,
  p_anonymous_id TEXT DEFAULT NULL,
  p_client_event_id TEXT DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT NULL,
  p_ip_hmac TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name TEXT := lower(btrim(COALESCE(p_event_name, '')));
  v_cid TEXT := NULLIF(btrim(COALESCE(p_client_event_id, '')), '');
  v_anon TEXT := NULLIF(btrim(COALESCE(p_anonymous_id, '')), '');
  v_props JSONB := COALESCE(p_properties, '{}'::JSONB);
  v_uid UUID := p_user_id;
  v_id UUID;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  PERFORM _enforce_service_ingress_rate_limit(
    p_ip_hmac,
    'service_ingress_product_analytics'
  );

  PERFORM _assert_feature_enabled('product_analytics');

  IF v_name = '' OR NOT _product_analytics_event_allowed(v_name) THEN
    RAISE EXCEPTION 'analytics_event_not_allowed';
  END IF;

  IF v_uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'analytics_user_not_found';
  END IF;

  PERFORM _assert_product_analytics_payload(p_surface, v_props, v_anon, v_cid);

  IF v_uid IS NOT NULL AND v_cid IS NOT NULL THEN
    SELECT id INTO v_id FROM product_analytics_events
     WHERE user_id = v_uid AND client_event_id = v_cid;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', TRUE, 'event_id', v_id, 'idempotent', TRUE);
    END IF;
  ELSIF v_uid IS NULL AND v_anon IS NOT NULL AND v_cid IS NOT NULL THEN
    SELECT id INTO v_id FROM product_analytics_events
     WHERE user_id IS NULL AND anonymous_id = v_anon AND client_event_id = v_cid;
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

REVOKE ALL ON FUNCTION rpc_service_record_product_analytics_event(
  TEXT, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ, TEXT, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_record_product_analytics_event(
  TEXT, TEXT, JSONB, TEXT, TEXT, TIMESTAMPTZ, TEXT, UUID
) TO service_role;

-- ─── Retention purge (service) ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_service_purge_siwe_analytics_retention()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_analytics_days INT;
  v_siwe_hours INT;
  v_analytics_deleted INT := 0;
  v_siwe_deleted INT := 0;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COALESCE(value::INT, 90) INTO v_analytics_days
    FROM app_config WHERE key = 'product_analytics_retention_days';
  SELECT COALESCE(value::INT, 24) INTO v_siwe_hours
    FROM app_config WHERE key = 'siwe_challenge_retention_hours';

  DELETE FROM product_analytics_events
   WHERE received_at < NOW() - make_interval(days => GREATEST(COALESCE(v_analytics_days, 90), 1));
  GET DIAGNOSTICS v_analytics_deleted = ROW_COUNT;

  DELETE FROM siwe_challenges
   WHERE (
     (consumed_at IS NOT NULL AND consumed_at < NOW() - make_interval(hours => GREATEST(COALESCE(v_siwe_hours, 24), 1)))
     OR (consumed_at IS NULL AND expires_at < NOW() - make_interval(hours => GREATEST(COALESCE(v_siwe_hours, 24), 1)))
   );
  GET DIAGNOSTICS v_siwe_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'analytics_deleted', v_analytics_deleted,
    'siwe_challenges_deleted', v_siwe_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_service_purge_siwe_analytics_retention()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_service_purge_siwe_analytics_retention()
  TO service_role;
