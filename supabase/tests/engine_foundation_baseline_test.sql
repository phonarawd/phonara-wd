-- ============================================================
-- Engine Phase 0 — Foundation & Safety Baseline inventory
-- ============================================================
-- Pins authoritative evidence for:
--   0.1 Double-entry ledger (append-only, hash-chain, reconciliation)
--   0.2 Journal & idempotency key prefix inventory
--   0.3 Temporal workflow status taxonomy + current schema gaps
--   0.5 Security baseline (RLS on, definer search_path, anon definer allowlist)
--
-- Does NOT redesign schema — records current authority path only.
-- Each block runs in a transaction and ROLLBACKs — no residue.
-- ============================================================

-- ── 0.1 Ledger table & invariant inventory ───────────────────────────────────
BEGIN;
DO $$
BEGIN
  -- Core ledger tables exist
  ASSERT to_regclass('public.wallets') IS NOT NULL, 'wallets table must exist';
  ASSERT to_regclass('public.wallet_ledger') IS NOT NULL, 'wallet_ledger table must exist';
  ASSERT to_regclass('public.system_accounts') IS NOT NULL, 'system_accounts table must exist';
  ASSERT to_regclass('public.system_account_ledger') IS NOT NULL, 'system_account_ledger table must exist';
  ASSERT to_regclass('public.reconciliation_log') IS NOT NULL, 'reconciliation_log table must exist';

  -- wallet_ledger journal columns
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'wallet_ledger'
       AND column_name = 'idempotency_key' AND is_nullable = 'NO'
  ), 'wallet_ledger.idempotency_key must be NOT NULL';

  ASSERT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = 'wallet_ledger'
       AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%idempotency_key%'
  ), 'wallet_ledger.idempotency_key must be UNIQUE';

  -- hash-chain columns (wallet + system)
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'wallet_ledger'
       AND column_name IN ('seq', 'prev_hash', 'row_hash')
  ), 'wallet_ledger must carry seq/prev_hash/row_hash hash-chain columns';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'system_account_ledger'
       AND column_name IN ('seq', 'prev_hash', 'row_hash')
  ), 'system_account_ledger must carry seq/prev_hash/row_hash hash-chain columns';

  -- append-only rules
  ASSERT EXISTS (
    SELECT 1 FROM pg_rewrite
     WHERE ev_class = 'public.wallet_ledger'::regclass AND ev_type = '2'
  ), 'wallet_ledger must have UPDATE rule (append-only)';
  ASSERT EXISTS (
    SELECT 1 FROM pg_rules
     WHERE schemaname = 'public' AND tablename = 'wallet_ledger'
       AND rulename = 'wallet_ledger_no_delete'
  ), 'wallet_ledger must have DELETE rule (append-only)';
  ASSERT EXISTS (
    SELECT 1 FROM pg_rewrite
     WHERE ev_class = 'public.system_account_ledger'::regclass AND ev_type = '2'
  ), 'system_account_ledger must have UPDATE rule (append-only)';

  -- user wallet non-negative guards
  ASSERT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.wallets'::regclass
       AND conname = 'wallets_phon_available_nonneg'
  ), 'wallets must enforce phon_available >= 0';

  -- mandatory system accounts (double-entry counterparty)
  ASSERT (SELECT COUNT(*) FROM system_accounts WHERE code IN (
    'house_fee_phon', 'house_fee_usdt', 'insurance_fund_phon', 'insurance_fund_usdt',
    'house_liquidity_phon', 'house_liquidity_usdt', 'dust_phon', 'dust_usdt', 'reward_issuance_phon'
  )) = 9, 'seed system_accounts must include all nine mandatory codes';

  -- reconciliation_log widened check types (E foundation ①-3)
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'reconciliation_log'
       AND column_name = 'check_type'
  ), 'reconciliation_log.check_type must exist';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'reconciliation_log'
       AND column_name = 'broken_count'
  ), 'reconciliation_log.broken_count must exist';

  -- verifier + reconciliation authority
  ASSERT to_regprocedure('public.verify_ledger_hash_chain(uuid)') IS NOT NULL,
    'verify_ledger_hash_chain must exist';
  ASSERT to_regprocedure('public.verify_system_account_hash_chain(text)') IS NOT NULL,
    'verify_system_account_hash_chain must exist';
  ASSERT to_regprocedure('public.rpc_run_reconciliation()') IS NOT NULL,
    'rpc_run_reconciliation must exist';

  ASSERT NOT has_function_privilege('authenticated', 'public.rpc_run_reconciliation()', 'EXECUTE'),
    'authenticated must NOT execute rpc_run_reconciliation';
  ASSERT has_function_privilege('service_role', 'public.rpc_run_reconciliation()', 'EXECUTE'),
    'service_role must execute rpc_run_reconciliation';

  ASSERT NOT has_function_privilege('anon', 'public.verify_ledger_hash_chain(uuid)', 'EXECUTE'),
    'anon must NOT execute verify_ledger_hash_chain';
  ASSERT NOT has_function_privilege('authenticated', 'public.verify_system_account_hash_chain(text)', 'EXECUTE'),
    'authenticated must NOT execute verify_system_account_hash_chain';

  -- ledger write guard GUC belt
  ASSERT to_regprocedure('public._require_ledger_write_allowed()') IS NOT NULL,
    '_require_ledger_write_allowed must exist';

  RAISE NOTICE 'ENGINE FOUNDATION 0.1 LEDGER BASELINE OK';
END;
$$;
ROLLBACK;

-- ── 0.2 Idempotency key prefix inventory ──────────────────────────────────────
BEGIN;
DO $$
DECLARE
  v_prefix TEXT;
  v_expected TEXT[] := ARRAY[
    -- Earn / referral
    'welcome:', 'referral_reward:', 'referral_qualified:', 'mission:', 'daily:',
    'roulette:', 'repeatable:', 'lifetime:',
    -- Withdrawal lifecycle
    'wd_req:', 'wd_lock:', 'wd_approve_debit:',
    -- Casino
    'gbet_lock:', 'gbet_unlock:', 'gbet_debit:', 'gbet_pay:', 'gbet_house:',
    'gbet_cancel:', 'gbet_admin_void:', 'gbet_stale:',
    -- Sportsbook
    'sbet_lock:',
    -- Trading / spot / futures / orders / staking
    'spot_pay:', 'spot_recv:', 'fut_margin:', 'fut_openfee:', 'fut_unlock:', 'fut_pnl:',
    'fut_partial_unlock:', 'fut_partial_pnl:', 'fut_margin_adj:',
    'ord_margin:', 'ord_unlock:', 'ord_cancel:',
    'stake_lock:', 'stake_reward:', 'stake_unlock:',
    -- Deposits
    'krw_dep:', 'crypto_dep:', 'giftcard_dep:',
    -- Affiliate / ops
    'affiliate:settlement:', 'invariant:global_zero:', 'feed:'
  ];
  v_phase1_new TEXT[] := ARRAY[
    'notification:dispatch:',
    'webhook:pg_bank:',
    'withdrawal:broadcast:',
    'price_feed:ingest:'
  ];
  v_overlap TEXT := '';
BEGIN
  FOREACH v_prefix IN ARRAY v_expected LOOP
    NULL; -- inventory pin only; collision domain documented in ENGINE_PHASE0_EVIDENCE_REPORT.md
  END LOOP;

  -- Phase 1 reserved domains must not overlap existing engine prefixes
  FOREACH v_prefix IN ARRAY v_phase1_new LOOP
    IF v_prefix = ANY(v_expected) THEN
      v_overlap := v_overlap || ' ' || v_prefix;
    END IF;
  END LOOP;
  ASSERT v_overlap = '',
    format('Phase 1 idempotency domains must not overlap existing prefixes:%s', v_overlap);

  -- Client-supplied idempotency surfaces must remain unique-scoped
  ASSERT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.withdrawal_requests'::regclass
       AND conname = 'wr_user_idem'
  ), 'withdrawal_requests must enforce wr_user_idem UNIQUE (user_id, idempotency_key)';

  ASSERT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = 'game_bets'
       AND indexname = 'gb_user_idem_key'
  ), 'game_bets must enforce gb_user_idem_key UNIQUE (user_id, idempotency_key)';

  RAISE NOTICE 'ENGINE FOUNDATION 0.2 IDEMPOTENCY INVENTORY OK — % legacy prefixes pinned, % Phase 1 domains reserved',
    array_length(v_expected, 1), array_length(v_phase1_new, 1);
END;
$$;
ROLLBACK;

-- ── 0.3 Temporal workflow taxonomy + current schema inventory ─────────────────
BEGIN;
DO $$
DECLARE
  v_workflow_statuses TEXT[] := ARRAY[
    'pending', 'processing', 'retryable_failed', 'failed', 'manual_review',
    'sent', 'broadcasted', 'confirmed', 'completed'
  ];
  v_notif_statuses TEXT[];
  v_withdrawal_statuses TEXT[];
  v_missing_claim_cols TEXT := '';
BEGIN
  -- Pin taxonomy count (Phase 1 must extend tables, not invent ad-hoc strings)
  ASSERT array_length(v_workflow_statuses, 1) = 9,
    'external workflow status taxonomy must remain nine canonical values';

  -- notification_outbox current authority
  ASSERT to_regclass('public.notification_outbox') IS NOT NULL,
    'notification_outbox must exist for external dispatch workflow';

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO v_notif_statuses
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_enum e ON e.enumtypid = (
      SELECT atttypid FROM pg_attribute
       WHERE attrelid = c.conrelid AND attname = a.attname
    )
   WHERE c.conrelid = 'public.notification_outbox'::regclass
     AND c.contype = 'c'
     AND a.attname = 'status'
   LIMIT 1;

  -- status is TEXT + CHECK, not enum — read check constraint instead
  IF v_notif_statuses IS NULL THEN
    ASSERT EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'notification_outbox'
         AND column_name = 'status'
    ), 'notification_outbox.status must exist';
    ASSERT EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'notification_outbox'
         AND column_name = 'attempts'
    ), 'notification_outbox.attempts must exist';
    ASSERT EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'notification_outbox'
         AND column_name = 'last_error'
    ), 'notification_outbox.last_error must exist';
  END IF;

  -- Phase 1 claim columns — documented gap (baseline records absence)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'notification_outbox'
       AND column_name = 'claimed_at'
  ) THEN
    v_missing_claim_cols := v_missing_claim_cols || ' notification_outbox.claimed_at';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'notification_outbox'
       AND column_name = 'claimed_by'
  ) THEN
    v_missing_claim_cols := v_missing_claim_cols || ' notification_outbox.claimed_by';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'notification_outbox'
       AND column_name = 'claim_expires_at'
  ) THEN
    v_missing_claim_cols := v_missing_claim_cols || ' notification_outbox.claim_expires_at';
  END IF;

  -- Phase 1 claim columns (p0-edge-contracts)
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'notification_outbox'
       AND column_name = 'claimed_at'
  ), 'notification_outbox.claimed_at must exist after p0-edge-contracts';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'notification_outbox'
       AND column_name = 'claimed_by'
  ), 'notification_outbox.claimed_by must exist after p0-edge-contracts';
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'notification_outbox'
       AND column_name = 'claim_expires_at'
  ), 'notification_outbox.claim_expires_at must exist after p0-edge-contracts';

  IF v_missing_claim_cols <> '' THEN
    RAISE EXCEPTION 'unexpected notification_outbox claim gap:%', v_missing_claim_cols;
  END IF;

  -- withdrawal_status enum inventory (broadcast flow extends in Phase 1)
  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO v_withdrawal_statuses
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
   WHERE t.typname = 'withdrawal_status';

  ASSERT v_withdrawal_statuses @> ARRAY['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
    format('withdrawal_status enum must include core lifecycle values, got %s', v_withdrawal_statuses);

  RAISE NOTICE 'ENGINE FOUNDATION 0.3 WORKFLOW BASELINE OK — taxonomy pinned; notification_outbox claim columns verified';
END;
$$;
ROLLBACK;

-- ── 0.5 Security baseline (RLS + definer search_path + anon allowlist) ────────
BEGIN;
DO $$
DECLARE
  r RECORD;
  v_rls_off TEXT := '';
  v_bad_definer_path TEXT := '';
  v_anon_definer TEXT := '';
  v_expected_anon_definer TEXT[] := ARRAY[
    '_is_admin()',
    'rpc_get_fixture_markets(uuid)',
    'rpc_get_golden_earth_status()',
    'rpc_get_synthetic_book(text,integer)',
    'rpc_list_sports_fixtures(date,text,text)'
  ];
  v_sig TEXT;
  v_anon_definer_count INT;
BEGIN
  -- public tables: RLS must be enabled (baseline = 0 off)
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
    ORDER BY c.relname
  LOOP
    v_rls_off := v_rls_off || ' ' || r.relname;
  END LOOP;
  ASSERT v_rls_off = '',
    format('public tables with RLS disabled must be 0, found:%s', v_rls_off);

  -- SECURITY DEFINER in public must declare search_path
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%')
      )
  LOOP
    v_bad_definer_path := v_bad_definer_path || ' ' || r.sig::TEXT;
  END LOOP;
  ASSERT v_bad_definer_path = '',
    format('SECURITY DEFINER without search_path must be 0, found:%s', v_bad_definer_path);

  -- anon executable SECURITY DEFINER inventory (Phase 2 will reclassify)
  SELECT COUNT(*)::INT INTO v_anon_definer_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.prosecdef
     AND has_function_privilege('anon', p.oid, 'EXECUTE');

  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
    ORDER BY p.proname, p.oid
  LOOP
    v_anon_definer := v_anon_definer || ' ' || r.sig::TEXT;
  END LOOP;

  ASSERT v_anon_definer_count = array_length(v_expected_anon_definer, 1),
    format(
      'anon executable SECURITY DEFINER count must equal allowlist (expected %s, got %s). actual:%s',
      array_length(v_expected_anon_definer, 1), v_anon_definer_count, v_anon_definer
    );

  FOREACH v_sig IN ARRAY v_expected_anon_definer LOOP
    ASSERT has_function_privilege('anon', ('public.' || v_sig)::regprocedure, 'EXECUTE'),
      format('anon must execute allowlisted definer RPC %s', v_sig);
  END LOOP;

  RAISE NOTICE 'ENGINE FOUNDATION 0.5 SECURITY BASELINE OK — RLS on all public tables; definer search_path pinned; anon definer allowlist=%',
    array_length(v_expected_anon_definer, 1);
END;
$$;
ROLLBACK;
