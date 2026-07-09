-- ============================================================
-- Migration: 20260713000002_db_security_inventory
-- Phase 2 — DB security inventory: _is_admin anon grant policy,
-- anon executable SECURITY DEFINER classification, INVOKER
-- convergence for public read RPCs where RLS+GRANT already suffice.
-- ============================================================
-- Policy (inventory test expected set in security_definer_inventory_test.sql):
--   rls_eval_helper              — _is_admin() anon EXECUTE for RLS evaluation
--   public_read_definer_allowlisted — sports odds/outcomes join + golden_earth auth path
--   public_read_invoker          — cms, live fixture state, market types (RLS covers scope)
-- ============================================================

SET search_path = public, pg_temp;

-- ─── _is_admin() anon EXECUTE (idempotent; pairs with 20260712000005) ─────────
-- anon RLS on app_config/cms/sports uses _is_admin() in USING clauses.
-- SECURITY DEFINER returns false for anon — safe for PostgREST too.
GRANT EXECUTE ON FUNCTION public._is_admin() TO anon;

-- ─── public_read_invoker: rpc_list_cms_content ───────────────────────────────
-- cms_content RLS "cms: read" already scopes published rows for anon.
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

-- ─── public_read_invoker: rpc_get_live_fixture_state ─────────────────────────
-- anon/authenticated already SELECT sports_fixtures + sports_markets under RLS.
CREATE OR REPLACE FUNCTION rpc_get_live_fixture_state(p_fixture_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fixture sports_fixtures%ROWTYPE;
  v_markets JSONB;
BEGIN
  SELECT * INTO v_fixture FROM sports_fixtures WHERE id = p_fixture_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'fixture_not_found'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'market_id', m.id,
    'market_type', m.market_type,
    'status', m.status,
    'suspended_until', m.suspended_until,
    'suspend_reason', m.suspend_reason
  ) ORDER BY m.market_type), '[]'::JSONB)
  INTO v_markets
  FROM sports_markets m
  WHERE m.fixture_id = p_fixture_id;

  RETURN jsonb_build_object(
    'fixture_id', v_fixture.id,
    'league_code', v_fixture.league_code,
    'home_name', v_fixture.home_name,
    'away_name', v_fixture.away_name,
    'kickoff_at', v_fixture.kickoff_at,
    'status', v_fixture.status,
    'suspended_until', v_fixture.suspended_until,
    'suspend_reason', v_fixture.suspend_reason,
    'result_home_goals', v_fixture.result_home_goals,
    'result_away_goals', v_fixture.result_away_goals,
    'markets', v_markets
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_live_fixture_state(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_get_live_fixture_state(UUID) TO anon, authenticated, service_role;

-- ─── public_read_invoker: rpc_list_sports_market_types ───────────────────────
-- sports_market_type_registry RLS allows anon SELECT on enabled rows.
CREATE OR REPLACE FUNCTION rpc_list_sports_market_types()
RETURNS SETOF JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'market_type', market_type,
    'category', category,
    'settle_handler', settle_handler,
    'enabled', enabled,
    'description', description
  )
  FROM sports_market_type_registry
  WHERE enabled
  ORDER BY category, market_type;
$$;

REVOKE ALL ON FUNCTION rpc_list_sports_market_types() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rpc_list_sports_market_types() TO anon, authenticated, service_role;
