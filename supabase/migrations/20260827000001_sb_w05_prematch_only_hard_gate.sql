-- ============================================================
-- Wave 0.5 — Pre-match-only hard gate (additive, live code preserved)
-- ============================================================
-- Plan: 스포츠 무료 실배당 완결 로드맵 · sb-w05-prematch-hard-gate
--
-- Problem: rpc_place_sports_bet only rejects when
-- `fixture.status NOT IN ('scheduled', 'live')` — i.e. it already ALLOWS
-- `live` fixtures today. It is only safe right now because no `live`
-- fixture rows exist yet; the code itself does not block it.
--
-- Fix: seed a new kill switch `feature_sports_live_betting_enabled` = 'false'
-- and inject a guard into the `v_is_live` branch of `rpc_place_sports_bet`
-- ONLY. Pre-match (v_is_live = FALSE) legs are completely unaffected.
--
-- rpc_place_sports_system_bet does NOT need a separate edit: its live
-- definition (verified via remote pg_get_functiondef) places each system
-- line by calling `rpc_place_sports_bet(...)` per combo — so it inherits
-- this guard automatically.
--
-- Absolutely NOT touched (§흡수된 확정 결정 2 — live code preserved):
--   _sports_live_acceptance_delay · _sports_any_live_leg ·
--   wave_s7_sportsbook_inplay_engine.sql (rpc_get_live_fixture_state 등) ·
--   sports_live_ttl_by_sport · WS ingest (ws-run.ts / ws-worker.ts /
--   odds-api-io-ws.ts / ws-stall-detector.ts).
--
-- Fail-open trap (`_assert_feature_enabled` = enabled unless value is
-- explicitly 'false'): the config row seed and the guard injection are in
-- the SAME migration file (single transaction) so there is never a moment
-- where the guard exists but the flag row is missing.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Flag (seeded false — live betting stays closed pre-match-only) ──────────
INSERT INTO app_config (key, value, description) VALUES
  (
    'feature_sports_live_betting_enabled',
    'false',
    'Live (in-play) sports betting hard gate. false blocks rpc_place_sports_bet '
    || 'for fixture.status=live legs only; pre-match (scheduled) legs are unaffected. '
    || 'Wave 0.5 pre-match-only hard gate — live ingest/settlement code untouched.'
  )
ON CONFLICT (key) DO NOTHING;

-- ─── Guard injection (idempotent — live catalog definition, not file text) ──
DO $mig$
DECLARE
  v_sig TEXT := 'public.rpc_place_sports_bet(jsonb, text, text, text, text, text, text, text)';
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef(v_sig::regprocedure);
  v_def := replace(v_def, E'\r\n', E'\n');

  -- Idempotent: already guarded → skip (re-run safe on repeated `db reset`).
  IF position('sports_live_betting' IN v_def) > 0 THEN
    RETURN;
  END IF;

  v_new := regexp_replace(
    v_def,
    '(    v_is_live := v_fixture\.status = ''live'';)',
    E'\\1\n    IF v_is_live THEN\n      PERFORM _assert_feature_enabled(''sports_live_betting'');\n    END IF;',
    ''
  );

  IF v_new = v_def THEN
    RAISE EXCEPTION 'sports_live_betting guard anchor not found in %', v_sig;
  END IF;

  EXECUTE v_new;
END
$mig$;
