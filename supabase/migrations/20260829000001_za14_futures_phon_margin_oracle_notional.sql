-- ============================================================
-- ZA-14 root fix: PHON-margin futures notional via PHON_USDT oracle
-- ============================================================
-- docs/audit/ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md 1-J.2
-- Plan: 월드클래스_격차_해소 · wc-money-futures-margin-oracle-fix
--
-- Bug: rpc_open_futures_position used `v_notional := v_margin * v_lev`
-- for both USDT and PHON margin. PHON quantity is a token count, so OI /
-- min-notional / stored notional·quantity were distorted by ~1/PHON_USDT
-- (peg ≈ 0.01 → ~100×). ZA-14 kill switch (20260826000001) only blocked
-- new PHON opens — this migration is the root oracle conversion.
--
-- Money safety companion: after notional/qty become USD-correct, settle
-- PnL/close_fee (computed as qty×price in mark/USD units) must be converted
-- back to PHON when margin_currency = PHON — otherwise wallet credits would
-- under/over-pay by the peg. Zero open PHON-margin positions at apply time
-- (kill switch held the queue empty).
--
-- Pattern: live pg_get_functiondef → replace/regexp_replace → EXECUTE.
-- Static CREATE OR REPLACE is forbidden (13 prior patches / RG gate).
-- Re-enable feature_futures_phon_margin via rpc_set_feature_enabled is a
-- separate operator decision — this migration does NOT flip the flag.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── A. rpc_open_futures_position — USD notional + margin-currency open fee ─
DO $mig$
DECLARE
  v_sig TEXT := 'public.rpc_open_futures_position(text,text,text,text,text,text,text,text)';
  v_def TEXT;
  v_new TEXT;
  v_notional_old TEXT := 'v_notional := v_margin * v_lev;';
  v_notional_new TEXT :=
    E'-- za14_phon_oracle_notional\n'
    || E'  IF p_margin_currency = ''PHON'' THEN\n'
    || E'    v_notional := v_margin * _assert_price_fresh(''PHON_USDT'') * v_lev;\n'
    || E'  ELSE\n'
    || E'    v_notional := v_margin * v_lev;\n'
    || E'  END IF;';
  v_fee_old TEXT := 'v_open_fee := v_notional * v_mkt.open_fee_rate::NUMERIC;';
  v_fee_new TEXT :=
    E'-- Fee stays in margin-currency units (USDT: margin*lev = notional)\n'
    || E'  v_open_fee := (v_margin * v_lev) * v_mkt.open_fee_rate::NUMERIC;';
BEGIN
  v_def := replace(pg_get_functiondef(v_sig::regprocedure), E'\r\n', E'\n');

  IF position('za14_phon_oracle_notional' IN v_def) > 0 THEN
    RAISE NOTICE 'za14 oracle notional: rpc_open_futures_position already patched, skipping';
    RETURN;
  END IF;

  IF position(v_notional_old IN v_def) = 0 THEN
    RAISE EXCEPTION 'za14 oracle notional: v_notional assignment anchor not found in %', v_sig;
  END IF;

  v_new := replace(v_def, v_notional_old, v_notional_new);

  IF position(v_fee_old IN v_new) = 0 THEN
    RAISE EXCEPTION 'za14 oracle notional: v_open_fee assignment anchor not found in %', v_sig;
  END IF;

  v_new := replace(v_new, v_fee_old, v_fee_new);

  IF v_new = v_def THEN
    RAISE EXCEPTION 'za14 oracle notional: no-op replace on %', v_sig;
  END IF;

  -- Preserve critical guards (fail loud if any vanished during replace).
  IF position('_assert_rg_domain_entry_allowed(' IN v_new) = 0 THEN
    RAISE EXCEPTION 'za14 oracle notional: RG gate missing after patch';
  END IF;
  IF position('futures_phon_margin' IN v_new) = 0 THEN
    RAISE EXCEPTION 'za14 oracle notional: futures_phon_margin killswitch missing after patch';
  END IF;
  IF position('_assert_position_limits(' IN v_new) = 0 THEN
    RAISE EXCEPTION 'za14 oracle notional: OI limits missing after patch';
  END IF;
  IF position('below_min_notional' IN v_new) = 0 THEN
    RAISE EXCEPTION 'za14 oracle notional: min_notional missing after patch';
  END IF;
  IF position('p_client_request_id' IN v_new) = 0 THEN
    RAISE EXCEPTION 'za14 oracle notional: p_client_request_id missing after patch';
  END IF;

  EXECUTE v_new;
  RAISE NOTICE 'za14 oracle notional: rpc_open_futures_position patched';
END
$mig$;

REVOKE ALL ON FUNCTION rpc_open_futures_position(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_open_futures_position(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ─── B. _settle_futures_position — convert USD mark PnL/fees → PHON ───────────
DO $mig$
DECLARE
  v_sig TEXT := 'public._settle_futures_position(uuid,numeric,position_status,text)';
  v_def TEXT;
  v_new TEXT;
  v_anchor TEXT := 'v_close_fee    := (v_qty * p_exit) * v_close_rate;';
  v_inject TEXT :=
    E'\n  -- za14_phon_settle_fx: qty×price is mark/USD; convert when margin is PHON\n'
    || E'  IF v_pos.margin_currency = ''PHON'' THEN\n'
    || E'    v_pnl := v_pnl / NULLIF(_assert_price_fresh(''PHON_USDT''), 0);\n'
    || E'    v_close_fee := v_close_fee / NULLIF(_assert_price_fresh(''PHON_USDT''), 0);\n'
    || E'  END IF;';
BEGIN
  v_def := replace(pg_get_functiondef(v_sig::regprocedure), E'\r\n', E'\n');

  IF position('za14_phon_settle_fx' IN v_def) > 0 THEN
    RAISE NOTICE 'za14 oracle notional: _settle_futures_position already patched, skipping';
    RETURN;
  END IF;

  IF position(v_anchor IN v_def) = 0 THEN
    RAISE EXCEPTION 'za14 oracle notional: close_fee anchor not found in %', v_sig;
  END IF;

  v_new := replace(v_def, v_anchor, v_anchor || v_inject);

  IF v_new = v_def THEN
    RAISE EXCEPTION 'za14 oracle notional: no-op settle replace on %', v_sig;
  END IF;

  EXECUTE v_new;
  RAISE NOTICE 'za14 oracle notional: _settle_futures_position patched';
END
$mig$;

REVOKE ALL ON FUNCTION _settle_futures_position(UUID, NUMERIC, position_status, TEXT)
  FROM PUBLIC, anon, authenticated;
