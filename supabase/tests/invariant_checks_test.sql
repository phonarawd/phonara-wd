-- ============================================================
-- Task 8 — Invariant monitoring coordinator
-- ============================================================

-- ── Normal state: no new invariant alerts ─────────────────────────────────────
BEGIN;
DO $$
DECLARE
  v_before INT;
  v_after INT;
  v_res JSONB;
BEGIN
  SELECT COUNT(*)::INT INTO v_before
    FROM ops_alerts
   WHERE source_check_id LIKE 'invariant_%'
     AND status IN ('open', 'acknowledged');

  v_res := rpc_run_invariant_checks();
  ASSERT COALESCE((v_res->>'ok')::BOOLEAN, FALSE), format('invariant checks must return ok, got %s', v_res);

  SELECT COUNT(*)::INT INTO v_after
    FROM ops_alerts
   WHERE source_check_id LIKE 'invariant_%'
     AND status IN ('open', 'acknowledged');

  ASSERT v_after = v_before,
    format('healthy state must not open invariant alerts, before=%s after=%s', v_before, v_after);

  RAISE NOTICE 'INVARIANT CHECKS OK — healthy state produces no new alerts';
END;
$$;
ROLLBACK;

-- ── Injected sigma mismatch opens alert (transaction rolls back) ──────────────
BEGIN;
DO $$
DECLARE
  v_before INT;
  v_after INT;
  v_res JSONB;
BEGIN
  SELECT COUNT(*)::INT INTO v_before
    FROM ops_alerts
   WHERE dedupe_key = 'invariant:global_zero:PHON'
     AND status IN ('open', 'acknowledged');

  UPDATE system_accounts
     SET balance = (balance::NUMERIC + 9999)::TEXT
   WHERE code = 'insurance_fund_phon';

  v_res := rpc_run_invariant_checks();
  ASSERT COALESCE((v_res->>'mismatch')::BOOLEAN, FALSE) = TRUE,
    format('injected mismatch must be reported, got %s', v_res);

  SELECT COUNT(*)::INT INTO v_after
    FROM ops_alerts
   WHERE dedupe_key = 'invariant:global_zero:PHON'
     AND status IN ('open', 'acknowledged');

  ASSERT v_after > v_before,
    format('invariant mismatch must open ops alert, before=%s after=%s', v_before, v_after);

  RAISE NOTICE 'INVARIANT MISMATCH ALERT OK';
END;
$$;
ROLLBACK;
