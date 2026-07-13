-- ============================================================
-- Migration: ew_e2_mission_catalog
-- E2 Mission Catalog Admin CRUD — list/upsert + claim gate
-- Plan: ew-e2-missions-wave (#242) · ADR-011
-- ============================================================

SET search_path = public, pg_temp;

-- ─── mission_catalog ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mission_catalog (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_key       TEXT NOT NULL UNIQUE,
  family            TEXT NOT NULL CHECK (family IN ('viral', 'earn_limit')),
  mission_code      TEXT,
  config_key        TEXT NOT NULL,
  quota_config_key  TEXT,
  extra_config_key  TEXT,
  exposure          TEXT NOT NULL DEFAULT 'live'
                    CHECK (exposure IN ('live', 'hidden')),
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INT NOT NULL DEFAULT 0,
  title_i18n_key    TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT mission_catalog_viral_code_chk CHECK (
    (family = 'viral' AND mission_code IS NOT NULL)
    OR (family = 'earn_limit' AND mission_code IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS mission_catalog_family_sort_idx
  ON mission_catalog (family, sort_order, catalog_key);

ALTER TABLE mission_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mission_catalog: admin select" ON mission_catalog;
CREATE POLICY "mission_catalog: admin select" ON mission_catalog
  FOR SELECT USING (_is_admin());

REVOKE ALL ON TABLE mission_catalog FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE mission_catalog TO authenticated;
GRANT ALL ON TABLE mission_catalog TO service_role;

-- ─── seed (allowlist only — ON CONFLICT DO UPDATE exposure defaults) ─────────

INSERT INTO mission_catalog (
  catalog_key, family, mission_code, config_key, quota_config_key, extra_config_key,
  exposure, enabled, sort_order, title_i18n_key
) VALUES
  ('viral:share_referral_link', 'viral', 'share_referral_link',
   'viral_share_referral_link_reward_phon', 'viral_share_referral_link_max_per_day', NULL,
   'live', TRUE, 10, 'admin.missions.viral.shareReferralLink'),
  ('viral:share_story_template', 'viral', 'share_story_template',
   'viral_share_story_template_reward_phon', 'viral_share_story_template_max_per_week', NULL,
   'hidden', TRUE, 20, 'admin.missions.viral.shareStoryTemplate'),
  ('viral:invite_friend_signup', 'viral', 'invite_friend_signup',
   'viral_invite_friend_signup_reward_phon', 'viral_invite_friend_signup_max_per_day', NULL,
   'live', TRUE, 30, 'admin.missions.viral.inviteFriendSignup'),
  ('viral:affiliate_content_post', 'viral', 'affiliate_content_post',
   'viral_affiliate_content_post_reward_phon', 'viral_affiliate_content_post_max_per_month', NULL,
   'live', TRUE, 40, 'admin.missions.viral.affiliateContentPost'),
  ('viral:viral_streak_share', 'viral', 'viral_streak_share',
   'viral_streak_share_reward_phon', 'viral_streak_share_max_per_day', 'viral_streak_share_min_days',
   'live', TRUE, 50, 'admin.missions.viral.streakShare'),
  ('earn:referral_qualified_reward_phon', 'earn_limit', NULL,
   'referral_qualified_reward_phon', NULL, NULL,
   'live', TRUE, 100, 'admin.missions.earn.referralQualified'),
  ('earn:referral_pending_reward_phon', 'earn_limit', NULL,
   'referral_pending_reward_phon', NULL, NULL,
   'live', TRUE, 110, 'admin.missions.earn.referralPending'),
  ('earn:referral_velocity_max_24h', 'earn_limit', NULL,
   'referral_velocity_max_24h', NULL, NULL,
   'live', TRUE, 120, 'admin.missions.earn.referralVelocity'),
  ('earn:earn_phon_to_usdt_rate', 'earn_limit', NULL,
   'earn_phon_to_usdt_rate', NULL, NULL,
   'live', TRUE, 130, 'admin.missions.earn.phonToUsdtRate'),
  ('earn:earn_season_global_xp', 'earn_limit', NULL,
   'earn_season_global_xp', NULL, NULL,
   'live', TRUE, 140, 'admin.missions.earn.seasonGlobalXp'),
  ('earn:launch_slots_total', 'earn_limit', NULL,
   'launch_slots_total', NULL, NULL,
   'live', TRUE, 150, 'admin.missions.earn.launchSlots')
ON CONFLICT (catalog_key) DO UPDATE SET
  config_key = EXCLUDED.config_key,
  quota_config_key = EXCLUDED.quota_config_key,
  extra_config_key = EXCLUDED.extra_config_key,
  title_i18n_key = EXCLUDED.title_i18n_key,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ─── helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _mission_catalog_is_forbidden_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT lower(COALESCE(p_code, '')) IN (
    'ad_watch', 'ad_watch_mission', 'watch_ad', 'survey', 'survey_mission',
    'ad', 'ads', 'questionnaire'
  )
  OR lower(COALESCE(p_code, '')) LIKE '%ad_watch%'
  OR lower(COALESCE(p_code, '')) LIKE '%survey%';
$$;

REVOKE ALL ON FUNCTION _mission_catalog_is_forbidden_code(TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _mission_catalog_assert_numeric_text(p_value TEXT, p_label TEXT)
RETURNS VOID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_value IS NULL OR length(btrim(p_value)) = 0 THEN
    RAISE EXCEPTION 'mission_catalog_invalid_value: % empty', p_label;
  END IF;
  IF btrim(p_value) !~ '^[0-9]+([.][0-9]+)?$' THEN
    RAISE EXCEPTION 'mission_catalog_invalid_value: % not numeric', p_label;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _mission_catalog_assert_numeric_text(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_mission_catalog_claimable(p_mission viral_mission_code)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key TEXT := 'viral:' || p_mission::TEXT;
  v_enabled BOOLEAN;
  v_exposure TEXT;
BEGIN
  SELECT enabled, exposure INTO v_enabled, v_exposure
    FROM mission_catalog
   WHERE catalog_key = v_key;

  IF NOT FOUND THEN
    -- Seed missing → allow (legacy enum still claimable until cataloged)
    RETURN;
  END IF;

  IF COALESCE(v_enabled, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'mission_disabled';
  END IF;

  IF COALESCE(v_exposure, 'hidden') <> 'live' THEN
    RAISE EXCEPTION 'mission_hidden';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_mission_catalog_claimable(viral_mission_code)
  FROM PUBLIC, anon, authenticated;

-- ─── list RPC ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_admin_list_mission_catalog()
RETURNS SETOF JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  PERFORM _assert_admin_aal2();

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', c.id,
    'catalog_key', c.catalog_key,
    'family', c.family,
    'mission_code', c.mission_code,
    'config_key', c.config_key,
    'quota_config_key', c.quota_config_key,
    'extra_config_key', c.extra_config_key,
    'exposure', c.exposure,
    'enabled', c.enabled,
    'sort_order', c.sort_order,
    'title_i18n_key', c.title_i18n_key,
    'value', (SELECT ac.value FROM app_config ac WHERE ac.key = c.config_key),
    'quota_value', CASE
      WHEN c.quota_config_key IS NULL THEN NULL
      ELSE (SELECT ac.value FROM app_config ac WHERE ac.key = c.quota_config_key)
    END,
    'extra_value', CASE
      WHEN c.extra_config_key IS NULL THEN NULL
      ELSE (SELECT ac.value FROM app_config ac WHERE ac.key = c.extra_config_key)
    END,
    'description', (SELECT ac.description FROM app_config ac WHERE ac.key = c.config_key),
    'updated_at', c.updated_at
  )
  FROM mission_catalog c
  ORDER BY c.sort_order ASC, c.catalog_key ASC;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_mission_catalog() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_list_mission_catalog() TO authenticated, service_role;

-- ─── upsert RPC ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_admin_upsert_mission_catalog(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_key TEXT;
  v_reason TEXT;
  v_row mission_catalog%ROWTYPE;
  v_value TEXT;
  v_quota TEXT;
  v_extra TEXT;
  v_exposure TEXT;
  v_enabled BOOLEAN;
  v_before JSONB;
BEGIN
  IF v_actor IS NULL OR NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  PERFORM _assert_admin_aal2();

  v_key := NULLIF(btrim(COALESCE(p_payload->>'catalog_key', '')), '');
  v_reason := NULLIF(btrim(COALESCE(p_payload->>'reason', '')), '');

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'mission_catalog_key_required';
  END IF;

  IF v_reason IS NULL OR length(v_reason) < 4 THEN
    RAISE EXCEPTION 'mission_catalog_reason_required';
  END IF;

  IF _mission_catalog_is_forbidden_code(v_key)
     OR _mission_catalog_is_forbidden_code(COALESCE(p_payload->>'mission_code', '')) THEN
    RAISE EXCEPTION 'mission_catalog_forbidden';
  END IF;

  SELECT * INTO v_row FROM mission_catalog WHERE catalog_key = v_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'mission_catalog_unknown_key';
  END IF;

  v_before := jsonb_build_object(
    'exposure', v_row.exposure,
    'enabled', v_row.enabled,
    'value', (SELECT value FROM app_config WHERE key = v_row.config_key),
    'quota_value', CASE
      WHEN v_row.quota_config_key IS NULL THEN NULL
      ELSE (SELECT value FROM app_config WHERE key = v_row.quota_config_key)
    END,
    'extra_value', CASE
      WHEN v_row.extra_config_key IS NULL THEN NULL
      ELSE (SELECT value FROM app_config WHERE key = v_row.extra_config_key)
    END
  );

  IF p_payload ? 'value' AND p_payload->>'value' IS NOT NULL THEN
    v_value := btrim(p_payload->>'value');
    PERFORM _mission_catalog_assert_numeric_text(v_value, 'value');
    UPDATE app_config
       SET value = v_value, updated_at = NOW()
     WHERE key = v_row.config_key;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'mission_catalog_config_missing: %', v_row.config_key;
    END IF;
  END IF;

  IF p_payload ? 'quota_value'
     AND p_payload->>'quota_value' IS NOT NULL
     AND v_row.quota_config_key IS NOT NULL THEN
    v_quota := btrim(p_payload->>'quota_value');
    PERFORM _mission_catalog_assert_numeric_text(v_quota, 'quota_value');
    UPDATE app_config
       SET value = v_quota, updated_at = NOW()
     WHERE key = v_row.quota_config_key;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'mission_catalog_config_missing: %', v_row.quota_config_key;
    END IF;
  END IF;

  IF p_payload ? 'extra_value'
     AND p_payload->>'extra_value' IS NOT NULL
     AND v_row.extra_config_key IS NOT NULL THEN
    v_extra := btrim(p_payload->>'extra_value');
    PERFORM _mission_catalog_assert_numeric_text(v_extra, 'extra_value');
    UPDATE app_config
       SET value = v_extra, updated_at = NOW()
     WHERE key = v_row.extra_config_key;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'mission_catalog_config_missing: %', v_row.extra_config_key;
    END IF;
  END IF;

  v_exposure := v_row.exposure;
  IF p_payload ? 'exposure' AND p_payload->>'exposure' IS NOT NULL THEN
    v_exposure := btrim(p_payload->>'exposure');
    IF v_exposure NOT IN ('live', 'hidden') THEN
      RAISE EXCEPTION 'mission_catalog_invalid_exposure';
    END IF;
  END IF;

  v_enabled := v_row.enabled;
  IF p_payload ? 'enabled' AND p_payload->>'enabled' IS NOT NULL THEN
    v_enabled := (p_payload->>'enabled')::BOOLEAN;
  END IF;

  UPDATE mission_catalog
     SET exposure = v_exposure,
         enabled = v_enabled,
         updated_at = NOW(),
         updated_by = v_actor
   WHERE catalog_key = v_key
  RETURNING * INTO v_row;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    v_actor,
    'mission_catalog_upsert',
    'mission_catalog',
    v_row.id,
    jsonb_build_object(
      'catalog_key', v_key,
      'reason', left(v_reason, 500),
      'before', v_before,
      'after', jsonb_build_object(
        'exposure', v_row.exposure,
        'enabled', v_row.enabled,
        'value', (SELECT value FROM app_config WHERE key = v_row.config_key),
        'quota_value', CASE
          WHEN v_row.quota_config_key IS NULL THEN NULL
          ELSE (SELECT value FROM app_config WHERE key = v_row.quota_config_key)
        END,
        'extra_value', CASE
          WHEN v_row.extra_config_key IS NULL THEN NULL
          ELSE (SELECT value FROM app_config WHERE key = v_row.extra_config_key)
        END
      )
    )
  );

  RETURN jsonb_build_object(
    'ok', TRUE,
    'id', v_row.id,
    'catalog_key', v_row.catalog_key,
    'exposure', v_row.exposure,
    'enabled', v_row.enabled
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_upsert_mission_catalog(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_upsert_mission_catalog(JSONB) TO authenticated, service_role;

-- ─── claim / status: respect catalog exposure ────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_claim_viral_mission(
  p_mission TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_mission    viral_mission_code;
  v_window     TEXT;
  v_used       INT;
  v_max        INT;
  v_slot       INT;
  v_window_key TEXT;
  v_claim_id   UUID;
  v_reward     TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_user_id);
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_claim_viral_mission');

  BEGIN
    v_mission := p_mission::viral_mission_code;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_viral_mission';
  END;

  IF _mission_catalog_is_forbidden_code(p_mission) THEN
    RAISE EXCEPTION 'mission_catalog_forbidden';
  END IF;

  PERFORM _assert_mission_catalog_claimable(v_mission);

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_claim_viral_mission')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'duplicate_request';
    END IF;
  END IF;

  PERFORM _assert_viral_mission_eligible(v_user_id, v_mission);

  v_window := _viral_quota_window_key(v_mission);
  v_used := _viral_quota_used(v_user_id, v_mission);
  v_max := _viral_quota_max(v_mission);

  IF v_used >= v_max THEN
    RAISE EXCEPTION 'viral_quota_exhausted';
  END IF;

  v_slot := v_used + 1;
  v_window_key := v_window || ':' || v_slot::TEXT;

  v_claim_id := _grant_viral_mission(
    v_user_id, v_mission, v_window_key, p_client_request_id,
    jsonb_build_object('slot', v_slot, 'window', v_window)
  );

  v_reward := _viral_mission_reward(v_mission);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'claim_id', v_claim_id,
    'mission', v_mission,
    'phon_awarded', v_reward,
    'used', v_used + 1,
    'max', v_max,
    'window_key', v_window_key
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_claim_viral_mission(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_claim_viral_mission(TEXT, TEXT) TO authenticated;

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
    'viral_streak_share'
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
