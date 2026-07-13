-- ============================================================
-- Migration: ew_e3_viral_cms
-- E3 Viral leaderboard + CMS targeting/schedule + viral analytics
-- Plan: ew-e3-viral-cms-wave (#244) · ADR-012
-- ============================================================

SET search_path = public, pg_temp;

-- ─── CMS schema extensions (targeting + schedule publish) ────────────────────

ALTER TABLE cms_content
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS min_tier earn_vip_tier,
  ADD COLUMN IF NOT EXISTS max_tier earn_vip_tier,
  ADD COLUMN IF NOT EXISTS schedule_publish_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cms_content_audience_chk'
      AND conrelid = 'public.cms_content'::regclass
  ) THEN
    ALTER TABLE cms_content
      ADD CONSTRAINT cms_content_audience_chk
      CHECK (audience IN ('all', 'authenticated', 'referrer', 'new_user'));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION _cms_assert_tier_range(
  p_min earn_vip_tier,
  p_max earn_vip_tier
)
RETURNS VOID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_min IS NOT NULL AND p_max IS NOT NULL
     AND _earn_tier_index(p_min) > _earn_tier_index(p_max) THEN
    RAISE EXCEPTION 'cms_tier_range_invalid';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _cms_assert_tier_range(earn_vip_tier, earn_vip_tier)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _cms_mask_display_name(p_raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trim TEXT := btrim(COALESCE(p_raw, ''));
BEGIN
  IF length(v_trim) = 0 THEN
    RETURN 'anon***';
  END IF;
  IF length(v_trim) = 1 THEN
    RETURN v_trim || '***';
  END IF;
  RETURN left(v_trim, 2) || '***';
END;
$$;

REVOKE ALL ON FUNCTION _cms_mask_display_name(TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── rpc_list_cms_content (targeting fields) ─────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_list_cms_content(
  p_kind TEXT DEFAULT NULL,
  p_surface TEXT DEFAULT NULL,
  p_locale TEXT DEFAULT 'ko'
)
RETURNS SETOF JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'id', c.id, 'content_key', c.content_key, 'kind', c.kind,
    'locale', c.locale, 'surface', c.surface, 'status', c.status,
    'title', c.title, 'body', c.body, 'headline', c.headline,
    'cta_label', c.cta_label, 'cta_href', c.cta_href, 'priority', c.priority,
    'starts_at', c.starts_at, 'ends_at', c.ends_at, 'published_at', c.published_at,
    'audience', c.audience, 'min_tier', c.min_tier, 'max_tier', c.max_tier,
    'schedule_publish_at', c.schedule_publish_at
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

-- ─── rpc_admin_upsert_cms_content (targeting + schedule) ─────────────────────

CREATE OR REPLACE FUNCTION rpc_admin_upsert_cms_content(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_status cms_publish_status;
  v_audience TEXT;
  v_min earn_vip_tier;
  v_max earn_vip_tier;
  v_schedule TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();

  v_status := COALESCE((p_payload->>'status')::cms_publish_status, 'draft');
  v_audience := COALESCE(NULLIF(btrim(p_payload->>'audience'), ''), 'all');
  IF v_audience NOT IN ('all', 'authenticated', 'referrer', 'new_user') THEN
    RAISE EXCEPTION 'cms_audience_invalid';
  END IF;

  v_min := NULLIF(p_payload->>'min_tier', '')::earn_vip_tier;
  v_max := NULLIF(p_payload->>'max_tier', '')::earn_vip_tier;
  PERFORM _cms_assert_tier_range(v_min, v_max);

  v_schedule := NULLIF(p_payload->>'schedule_publish_at', '')::TIMESTAMPTZ;
  IF v_status = 'scheduled' AND v_schedule IS NULL AND NULLIF(p_payload->>'starts_at', '') IS NULL THEN
    RAISE EXCEPTION 'cms_schedule_required';
  END IF;

  INSERT INTO cms_content (
    id, content_key, kind, locale, surface, status, title, body, headline,
    cta_label, cta_href, priority, starts_at, ends_at, published_at,
    audience, min_tier, max_tier, schedule_publish_at, created_by, updated_by
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
    v_audience,
    v_min,
    v_max,
    v_schedule,
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
    published_at = CASE
      WHEN EXCLUDED.status = 'published' THEN COALESCE(cms_content.published_at, NOW())
      ELSE cms_content.published_at
    END,
    audience = EXCLUDED.audience,
    min_tier = EXCLUDED.min_tier,
    max_tier = EXCLUDED.max_tier,
    schedule_publish_at = EXCLUDED.schedule_publish_at,
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

-- ─── rpc_admin_list_cms_content (targeting fields) ───────────────────────────

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
    'cta_label', c.cta_label, 'cta_href', c.cta_href,
    'priority', c.priority, 'starts_at', c.starts_at, 'ends_at', c.ends_at,
    'published_at', c.published_at,
    'audience', c.audience, 'min_tier', c.min_tier, 'max_tier', c.max_tier,
    'schedule_publish_at', c.schedule_publish_at
  )
  FROM cms_content c
  ORDER BY c.updated_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_list_cms_content() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_list_cms_content() TO authenticated, service_role;

-- ─── scheduled publish ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_run_cms_publish_scheduled(
  p_now TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  -- Cron / service: auth.uid() NULL. Interactive: admin only.
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  UPDATE cms_content
     SET status = 'published',
         published_at = COALESCE(published_at, p_now),
         updated_at = p_now
   WHERE status = 'scheduled'
     AND (
       (schedule_publish_at IS NOT NULL AND schedule_publish_at <= p_now)
       OR (schedule_publish_at IS NULL AND starts_at IS NOT NULL AND starts_at <= p_now)
     );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('ok', TRUE, 'published_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_cms_publish_scheduled(TIMESTAMPTZ)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_run_cms_publish_scheduled(TIMESTAMPTZ)
  TO authenticated, service_role;

-- pg_cron: every 15 minutes
SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname = 'phonara_cms_publish_scheduled';

SELECT cron.schedule(
  'phonara_cms_publish_scheduled',
  '*/15 * * * *',
  $cron$SELECT public.rpc_run_cms_publish_scheduled(NOW());$cron$
);

-- ─── affiliate rank leaderboard ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _affiliate_rank_window_start(p_window TEXT, p_now TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_window IS NULL OR p_window = 'all_time' THEN
    RETURN NULL;
  ELSIF p_window = '30d' THEN
    RETURN p_now - INTERVAL '30 days';
  ELSIF p_window = '7d' THEN
    RETURN p_now - INTERVAL '7 days';
  ELSE
    RAISE EXCEPTION 'affiliate_rank_window_invalid';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _affiliate_rank_window_start(TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_get_affiliate_rank_leaderboard(
  p_limit INT DEFAULT 50,
  p_window TEXT DEFAULT 'all_time'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_window TEXT := COALESCE(NULLIF(btrim(p_window), ''), 'all_time');
  v_since TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_entries JSONB := '[]'::JSONB;
  v_self JSONB := NULL;
  v_self_rank INT;
  v_self_count INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  v_since := _affiliate_rank_window_start(v_window, v_now);

  WITH scored AS (
    SELECT
      r.referrer_id AS user_id,
      COUNT(*)::INT AS qualified_count
    FROM referrals r
    WHERE r.state IN ('qualified', 'paid')
      AND (
        v_since IS NULL
        OR COALESCE(r.qualified_at, r.created_at) >= v_since
      )
    GROUP BY r.referrer_id
  ),
  ranked AS (
    SELECT
      s.user_id,
      s.qualified_count,
      ROW_NUMBER() OVER (
        ORDER BY s.qualified_count DESC, s.user_id ASC
      )::INT AS rank
    FROM scored s
    WHERE s.qualified_count > 0
  ),
  top_n AS (
    SELECT
      rk.rank,
      rk.qualified_count,
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
    'qualified_count', t.qualified_count,
    'is_self', t.is_self
  ) ORDER BY t.rank), '[]'::JSONB)
  INTO v_entries
  FROM top_n t;

  SELECT rk.rank, rk.qualified_count
    INTO v_self_rank, v_self_count
  FROM (
    SELECT
      r.referrer_id AS user_id,
      COUNT(*)::INT AS qualified_count,
      ROW_NUMBER() OVER (
        ORDER BY COUNT(*) DESC, r.referrer_id ASC
      )::INT AS rank
    FROM referrals r
    WHERE r.state IN ('qualified', 'paid')
      AND (
        v_since IS NULL
        OR COALESCE(r.qualified_at, r.created_at) >= v_since
      )
    GROUP BY r.referrer_id
    HAVING COUNT(*) > 0
  ) rk
  WHERE rk.user_id = v_uid;

  IF v_self_rank IS NOT NULL THEN
    v_self := jsonb_build_object(
      'rank', v_self_rank,
      'qualified_count', v_self_count,
      'display_name', _cms_mask_display_name(
        (SELECT COALESCE(NULLIF(display_name, ''), NULLIF(username, ''), LEFT(id::TEXT, 8))
           FROM profiles WHERE id = v_uid)
      ),
      'is_self', TRUE
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'window', v_window,
    'limit', v_limit,
    'generated_at', v_now,
    'entries', v_entries,
    'self', v_self
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_affiliate_rank_leaderboard(INT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_affiliate_rank_leaderboard(INT, TEXT)
  TO authenticated, service_role;

-- ─── viral analytics (admin full aggregates) ─────────────────────────────────

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

  RETURN jsonb_build_object(
    'ok', TRUE,
    'generated_at', v_now,
    'referrals', COALESCE(v_referrals, '{}'::JSONB),
    'affiliate_links', COALESCE(v_affiliate, '{}'::JSONB),
    'viral_missions', COALESCE(v_missions, '[]'::JSONB),
    'commissions', COALESCE(v_commissions, '[]'::JSONB),
    'leaderboard_preview', COALESCE(v_preview, '[]'::JSONB),
    'share_events_available', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_get_viral_analytics()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_get_viral_analytics()
  TO authenticated, service_role;
