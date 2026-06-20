-- ============================================================
-- Migration: 20260620000140_trade_launch_funding_cross_gates
-- Trade launch gates: funding + cross margin (server final defense)
-- ============================================================
-- Closes half-open inconsistent states until wallet funding settlement
-- and cross-margin pooling ship. Reversible via feature flags.
-- Money-path core (_settle, liquidation legs) untouched.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Feature flags (default disabled at launch) ─────────────────────────────

INSERT INTO app_config (key, value, description) VALUES
  ('feature_funding_enabled', 'false',
   'Funding wallet settlement. false = rate=0 schedule-only; non-zero blocked.'),
  ('feature_cross_margin_enabled', 'false',
   'Cross margin mode. false = isolated only; rpc_set_margin_mode(cross) rejected.')
ON CONFLICT (key) DO NOTHING;

-- Seed/funding rate consistency: non-zero rates are a time bomb without _apply_funding
UPDATE funding_rates SET rate = '0', updated_at = NOW() WHERE rate::NUMERIC <> 0;

-- ─── Guard helpers ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _assert_funding_settlement_enabled()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_val TEXT;
BEGIN
  SELECT value INTO v_val FROM app_config WHERE key = 'feature_funding_enabled';
  IF v_val = 'false' THEN
    RAISE EXCEPTION 'funding_not_enabled';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_funding_settlement_enabled() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _assert_cross_margin_enabled()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_val TEXT;
BEGIN
  SELECT value INTO v_val FROM app_config WHERE key = 'feature_cross_margin_enabled';
  IF v_val = 'false' THEN
    RAISE EXCEPTION 'cross_margin_not_available';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _assert_cross_margin_enabled() FROM PUBLIC, anon, authenticated;

-- ─── Funding: accrual gate + direct UPDATE back-door block ───────────────────

CREATE OR REPLACE FUNCTION rpc_run_funding_accrual()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fr       funding_rates%ROWTYPE;
  v_advanced INT := 0;
BEGIN
  IF auth.role() = 'anon' OR (auth.role() = 'authenticated' AND NOT _is_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_fr IN
    SELECT * FROM funding_rates WHERE next_funding_at <= NOW()
  LOOP
    IF v_fr.rate::NUMERIC = 0 THEN
      UPDATE funding_rates
      SET next_funding_at = next_funding_at + INTERVAL '8 hours',
          updated_at = NOW()
      WHERE market = v_fr.market;
      v_advanced := v_advanced + 1;
    ELSE
      PERFORM _assert_funding_settlement_enabled();
      RAISE EXCEPTION 'funding_settlement_not_implemented';
    END IF;
  END LOOP;

  RETURN jsonb_build_object('advanced', v_advanced, 'ran_at', NOW());
END;
$$;

REVOKE ALL ON FUNCTION rpc_run_funding_accrual() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_run_funding_accrual() TO service_role;

CREATE OR REPLACE FUNCTION _guard_funding_rates_nonzero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_val TEXT;
BEGIN
  IF NEW.rate::NUMERIC <> 0 THEN
    SELECT value INTO v_val FROM app_config WHERE key = 'feature_funding_enabled';
    IF v_val = 'false' THEN
      RAISE EXCEPTION 'funding_not_enabled';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_funding_rates_nonzero ON funding_rates;
CREATE TRIGGER trg_guard_funding_rates_nonzero
  BEFORE INSERT OR UPDATE OF rate ON funding_rates
  FOR EACH ROW
  EXECUTE FUNCTION _guard_funding_rates_nonzero();

-- ─── Cross margin: rpc_set_margin_mode gate ──────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_set_margin_mode(p_mode TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_mode    margin_mode;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_set_margin_mode');
  PERFORM _assert_feature_enabled('futures');

  IF p_mode NOT IN ('isolated', 'cross') THEN
    RAISE EXCEPTION 'invalid_margin_mode';
  END IF;

  IF p_mode = 'cross' THEN
    PERFORM _assert_cross_margin_enabled();
  END IF;

  v_mode := p_mode::margin_mode;

  IF EXISTS (
    SELECT 1 FROM futures_positions
    WHERE user_id = v_user_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'open_positions_block';
  END IF;

  IF EXISTS (
    SELECT 1 FROM trading_open_orders
    WHERE user_id = v_user_id AND status IN ('pending', 'open', 'triggered')
  ) THEN
    RAISE EXCEPTION 'open_orders_block';
  END IF;

  INSERT INTO margin_accounts (user_id, margin_mode, updated_at)
  VALUES (v_user_id, v_mode, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET margin_mode = EXCLUDED.margin_mode, updated_at = NOW();

  RETURN jsonb_build_object('user_id', v_user_id, 'margin_mode', v_mode);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_margin_mode(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_set_margin_mode(TEXT) TO authenticated, service_role;

-- ─── Cross margin: inject open-path rejection (rpc_open + _place_open_order) ─

DO $mig$
DECLARE
  v_sigs TEXT[] := ARRAY[
    'public.rpc_open_futures_position(text,text,text,text,text,text,text,text)',
    'public._place_open_order_common(text,text,text,text,text,order_type,order_status,text,text,text)'
  ];
  v_sig  TEXT;
  v_def  TEXT;
  v_new  TEXT;
  v_guard TEXT := E'  IF EXISTS (\n    SELECT 1 FROM margin_accounts\n    WHERE user_id = v_user_id AND margin_mode = ''cross''\n  ) THEN\n    PERFORM _assert_cross_margin_enabled();\n  END IF;\n';
BEGIN
  FOREACH v_sig IN ARRAY v_sigs LOOP
    v_def := pg_get_functiondef(v_sig::regprocedure);

    IF position('_assert_cross_margin_enabled' IN v_def) > 0 THEN
      CONTINUE;
    END IF;

    v_new := regexp_replace(
      v_def,
      'PERFORM _assert_feature_enabled\(''futures''\);',
      'PERFORM _assert_feature_enabled(''futures'');' || E'\n' || v_guard,
      ''
    );

    IF v_new = v_def THEN
      RAISE EXCEPTION 'cross margin guard anchor not found in %', v_sig;
    END IF;

    EXECUTE v_new;
  END LOOP;
END
$mig$;
