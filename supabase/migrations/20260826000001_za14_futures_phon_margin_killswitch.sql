-- ============================================================
-- ZA-14 P0 mitigation: futures PHON-margin kill switch
-- ============================================================
-- docs/audit/ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md 1-J.2 — rpc_open_futures_position
-- never converts PHON margin through the PHON_USDT oracle, so the stored/
-- displayed notional and quantity for PHON-margin positions are distorted by
-- the peg factor (OI cap · min-notional · on-screen figures affected). This
-- is a temporary block, not the root fix — the root fix (oracle conversion
-- in the notional calc) is a separate follow-up.
--
-- Scope: blocks NEW PHON-margin position opens only. Closing or liquidating
-- an existing PHON-margin position is never blocked — users can always exit.
--
-- Follows the existing per-feature kill switch pattern (20260609000019) and
-- the live pg_get_functiondef + regexp_replace + EXECUTE dynamic-patch
-- convention used throughout this migration history — no new components.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── New flag — default false (active-defect mitigation, not a reserved flag) ─
INSERT INTO app_config (key, value, description) VALUES
  ('feature_futures_phon_margin_enabled', 'false',
   'PHON-margin futures OPEN kill switch (ZA-14 P0 mitigation). false blocks new PHON-margin position opens only; close/liquidate of existing positions is never blocked. Re-enable via rpc_set_feature_enabled only after the PHON_USDT oracle conversion fix ships.')
ON CONFLICT (key) DO NOTHING;

-- ─── Allowlist: rpc_set_feature_enabled must recognize the new flag name ───────
-- Body copied from the live definition (includes the AAL2 step-up guard added
-- after the original 20260609000019 migration) with 'futures_phon_margin'
-- appended to the allowlist — anything less would silently drop the AAL2 guard.
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
  PERFORM _assert_admin_aal2();
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_feature NOT IN (
    'spot','futures','staking','game','referral','deposit','withdrawal',
    'p2p_transfer','giftcard_redeem',
    'siwe_login','support_tickets','product_analytics','app_install_mission',
    'krw_deposit_proof','mission_chains','co_bet','ml_mission_recommend',
    'sports','live_crash','futures_phon_margin'
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
  VALUES (
    v_actor, 'feature_toggle', 'app_config',
    jsonb_build_object('feature', p_feature, 'enabled', p_enabled, 'reason', p_reason)
  );
  RETURN jsonb_build_object('feature', p_feature, 'enabled', p_enabled);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT) TO authenticated, service_role;

-- ─── Inject the guard right after the existing margin-currency validation ─────
-- Anchor is p_margin_currency (already validated TEXT), not v_ccy — in the
-- live body v_ccy is not assigned until two statements after this anchor, so
-- guarding on v_ccy here would compare against NULL and never trigger.
DO $mig$
DECLARE
  v_sig TEXT := 'public.rpc_open_futures_position(text,text,text,text,text,text,text,text)';
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef(v_sig::regprocedure);

  -- Idempotent: check for the specific new feature name, not the generic
  -- _assert_feature_enabled( call (already present for the 'futures' flag).
  IF position('futures_phon_margin' IN v_def) > 0 THEN
    RETURN;
  END IF;

  v_new := regexp_replace(
    v_def,
    'IF p_margin_currency NOT IN \(''PHON'',''USDT''\) THEN RAISE EXCEPTION ''invalid_margin_currency''; END IF;',
    'IF p_margin_currency NOT IN (''PHON'',''USDT'') THEN RAISE EXCEPTION ''invalid_margin_currency''; END IF;' ||
      E'\n  IF p_margin_currency = ''PHON'' THEN PERFORM _assert_feature_enabled(''futures_phon_margin''); END IF;',
    ''
  );

  IF v_new = v_def THEN
    RAISE EXCEPTION 'futures_phon_margin guard anchor (invalid_margin_currency check) not found in %', v_sig;
  END IF;

  EXECUTE v_new;
END
$mig$;
