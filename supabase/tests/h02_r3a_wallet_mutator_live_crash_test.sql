-- ============================================================
-- H-02 / R3-a — rpc_lock_wallet client revoke · live_crash secret
-- Platform audit: audit-r3a-wallet-mutator-live-crash
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_lock_sig TEXT := 'public.rpc_lock_wallet(currency,text,text,text,uuid)';
  v_round_id UUID;
  v_current JSONB;
  v_uid UUID := gen_random_uuid();
BEGIN
  -- ── 1. Generic wallet mutator must not be client-callable ──────────────────
  ASSERT to_regprocedure(v_lock_sig) IS NOT NULL,
    'rpc_lock_wallet must still exist for guarded SECURITY DEFINER callers';

  ASSERT NOT has_function_privilege('anon', v_lock_sig, 'EXECUTE'),
    'anon must NOT EXECUTE rpc_lock_wallet';
  ASSERT NOT has_function_privilege('authenticated', v_lock_sig, 'EXECUTE'),
    'authenticated must NOT EXECUTE rpc_lock_wallet (H-02)';
  ASSERT has_function_privilege('service_role', v_lock_sig, 'EXECUTE'),
    'service_role must EXECUTE rpc_lock_wallet';

  -- ── 2. live_crash_rounds — no direct client SELECT; seed column closed ─────
  ASSERT NOT has_table_privilege('anon', 'public.live_crash_rounds', 'SELECT'),
    'anon must NOT SELECT live_crash_rounds (RPC only)';
  ASSERT NOT has_table_privilege('authenticated', 'public.live_crash_rounds', 'SELECT'),
    'authenticated must NOT SELECT live_crash_rounds (RPC only)';
  ASSERT has_table_privilege('service_role', 'public.live_crash_rounds', 'SELECT'),
    'service_role must SELECT live_crash_rounds';

  ASSERT NOT has_column_privilege('anon', 'public.live_crash_rounds', 'server_seed', 'SELECT'),
    'anon must NOT SELECT live_crash_rounds.server_seed';
  ASSERT NOT has_column_privilege(
    'authenticated', 'public.live_crash_rounds', 'server_seed', 'SELECT'
  ), 'authenticated must NOT SELECT live_crash_rounds.server_seed';

  ASSERT NOT has_table_privilege('authenticated', 'public.live_crash_rounds', 'INSERT'),
    'authenticated must NOT INSERT live_crash_rounds';
  ASSERT NOT has_table_privilege('authenticated', 'public.live_crash_rounds', 'UPDATE'),
    'authenticated must NOT UPDATE live_crash_rounds';
  ASSERT NOT has_table_privilege('authenticated', 'public.live_crash_rounds', 'DELETE'),
    'authenticated must NOT DELETE live_crash_rounds';

  -- Open SELECT policy must be gone (defense in depth with RLS enabled).
  ASSERT NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'live_crash_rounds'
       AND policyname = 'public read live_crash_rounds'
  ), 'public read live_crash_rounds policy must be dropped';

  -- ── 3. RPC path still works and does not leak seed before crash ────────────
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES (
    v_uid, 'authenticated', 'authenticated',
    'h02_live_crash_' || v_uid::TEXT || '@test.local', NOW(), NOW()
  );

  INSERT INTO live_crash_rounds (
    status, server_seed_hash, server_seed, betting_closes_at
  ) VALUES (
    'betting',
    encode(extensions.digest('h02_secret_seed_value', 'sha256'), 'hex'),
    'h02_secret_seed_value',
    NOW() + INTERVAL '30 seconds'
  )
  RETURNING id INTO v_round_id;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::TEXT)::TEXT,
    true
  );

  v_current := rpc_live_crash_get_current();
  ASSERT v_current->'round'->>'id' = v_round_id::TEXT,
    'rpc_live_crash_get_current must return active betting round';
  ASSERT v_current->'round'->>'server_seed_hash' IS NOT NULL,
    'commitment hash must remain public';
  ASSERT v_current->'round'->>'server_seed' IS NULL,
    'server_seed must stay NULL while status=betting';

  RAISE NOTICE 'H-02 R3-a OK — rpc_lock_wallet client revoked · live_crash seed private';
END;
$$;

ROLLBACK;
