-- E2 — rpc_admin_halt_market + immutable audit + before/after snapshot
BEGIN;

DO $$
DECLARE
  v_admin   UUID := gen_random_uuid();
  v_user    UUID := gen_random_uuid();
  v_res     JSONB;
  v_halted  BOOLEAN;
  v_audit   RECORD;
  v_blocked BOOLEAN;
  v_msg     TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'halt_e2_' || v_admin::TEXT || '@t.local', NOW(), NOW()),
    (v_user, 'authenticated', 'authenticated', 'halt_u_' || v_user::TEXT || '@t.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHON_USDT', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = '0.010000', updated_at = NOW();
  UPDATE market_circuit_breakers SET is_halted = FALSE, halt_reason = NULL WHERE symbol = 'PHON_USDT';
  UPDATE spot_markets SET is_active = TRUE WHERE symbol = 'PHON_USDT';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    true
  );

  ASSERT to_regprocedure('public.rpc_admin_halt_market(text, text)') IS NOT NULL,
    'rpc_admin_halt_market must exist';
  ASSERT to_regprocedure('public.rpc_admin_list_trade_market_breakers()') IS NOT NULL,
    'rpc_admin_list_trade_market_breakers must exist';
  ASSERT NOT has_function_privilege('anon', 'public.rpc_admin_halt_market(text, text)', 'EXECUTE'),
    'anon must NOT execute rpc_admin_halt_market';

  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_admin_halt_market('PHON_USDT', 'abc');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'reason_required' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'short reason must raise reason_required';

  v_res := rpc_admin_halt_market('PHON_USDT', 'oracle incident manual halt');
  ASSERT (v_res->>'halted')::BOOLEAN, 'halt RPC must return halted=true';
  ASSERT v_res ? 'before' AND v_res ? 'after', 'halt RPC must return before/after snapshots';

  SELECT is_halted INTO v_halted FROM market_circuit_breakers WHERE symbol = 'PHON_USDT';
  ASSERT v_halted, 'market must be halted after admin halt';

  SELECT * INTO v_audit
  FROM audit_logs
  WHERE actor_id = v_admin
    AND action = 'trade_market_halt'
  ORDER BY created_at DESC
  LIMIT 1;

  ASSERT v_audit.id IS NOT NULL, 'immutable audit row missing for trade_market_halt';
  ASSERT (v_audit.payload->>'reason') = 'oracle incident manual halt',
    'audit payload must store reason';
  ASSERT v_audit.payload ? 'before' AND v_audit.payload ? 'after',
    'audit payload must include before/after snapshots';
  ASSERT (v_audit.payload->'before'->>'is_halted')::BOOLEAN = FALSE,
    'before snapshot must capture pre-halt state';
  ASSERT (v_audit.payload->'after'->>'is_halted')::BOOLEAN = TRUE,
    'after snapshot must capture post-halt state';

  v_blocked := FALSE;
  BEGIN
    UPDATE audit_logs SET action = 'tampered' WHERE id = v_audit.id;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'append_only_violation' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'audit_logs must remain immutable (append_only_violation)';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user::TEXT)::TEXT, true);
  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_admin_halt_market('PHON_USDT', 'non-admin attempt');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg = 'forbidden' THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, 'non-admin must not halt market';

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    true
  );

  v_res := rpc_resume_market('PHON_USDT', 'incident cleared resume trading');
  ASSERT (v_res->>'resumed')::BOOLEAN, 'resume RPC must return resumed=true';

  SELECT is_halted INTO v_halted FROM market_circuit_breakers WHERE symbol = 'PHON_USDT';
  ASSERT NOT v_halted, 'market must be active after admin resume';

  ASSERT EXISTS (
    SELECT 1 FROM audit_logs
    WHERE actor_id = v_admin
      AND action = 'trade_market_resume'
      AND payload->>'symbol' = 'PHON_USDT'
      AND payload ? 'before'
      AND payload ? 'after'
  ), 'resume must write immutable audit with before/after';

  ASSERT EXISTS (
    SELECT 1 FROM rpc_admin_list_trade_market_breakers() row
    WHERE row->>'symbol' = 'PHON_USDT'
  ), 'list RPC must return PHON_USDT row';

  RAISE NOTICE 'E2 ADMIN HALT MARKET OK — halt/resume audited with before/after snapshots';
END;
$$;

ROLLBACK;

-- Trading path blocked while halted
BEGIN;

DO $$
DECLARE
  v_admin UUID := gen_random_uuid();
  v_uid   UUID := gen_random_uuid();
  v_blocked BOOLEAN;
  v_msg TEXT;
BEGIN
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES
    (v_admin, 'authenticated', 'authenticated', 'halt_e2b_' || v_admin::TEXT || '@t.local', NOW(), NOW()),
    (v_uid, 'authenticated', 'authenticated', 'halt_e2u_' || v_uid::TEXT || '@t.local', NOW(), NOW());
  UPDATE profiles SET role = 'admin' WHERE id = v_admin;

  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets SET phon_available = '1000.000000' WHERE user_id = v_uid;
  UPDATE app_config SET value = 'false' WHERE key = 'consent_gate_enabled';

  INSERT INTO oracle_prices (symbol, price, updated_at)
  VALUES ('PHON_USDT', '0.010000', NOW())
  ON CONFLICT (symbol) DO UPDATE SET price = '0.010000', updated_at = NOW();

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::TEXT, 'aal', 'aal2')::TEXT,
    true
  );
  PERFORM rpc_admin_halt_market('PHON_USDT', 'halt blocks user trading');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid::TEXT)::TEXT, true);

  v_blocked := FALSE;
  BEGIN
    PERFORM rpc_spot_market_buy('PHON_USDT', 'USDT', '10.000000');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg IN ('market_halted', 'market_not_found') THEN v_blocked := TRUE; END IF;
  END;
  ASSERT v_blocked, format('spot buy must block under admin halt, got: %s', v_msg);

  RAISE NOTICE 'E2 ADMIN HALT MARKET OK — trading blocked under halt';
END;
$$;

ROLLBACK;
