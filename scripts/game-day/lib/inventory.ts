/** Drill 0 — emergency lever inventory (code citations for report §0). */
export interface LeverInventoryEntry {
  readonly category: string;
  readonly lever: string;
  readonly rpcOrKey: string;
  readonly blocks: string;
  readonly toggle: string;
  readonly auth: string;
  readonly citation: string;
}

export const EMERGENCY_LEVER_INVENTORY: readonly LeverInventoryEntry[] = [
  {
    category: 'platform',
    lever: 'Hard halt',
    rpcOrKey: 'rpc_set_system_mode(p_halt:=true) → app_config.system_halt',
    blocks: 'User-initiated balance-moving RPCs via _assert_system_live()',
    toggle: 'rpc_set_system_mode(false, …, reason)',
    auth: '_is_admin() + _assert_admin_aal2()',
    citation: 'supabase/migrations/20260609000018_p0_system_live_guard.sql:69-106',
  },
  {
    category: 'platform',
    lever: 'Readonly',
    rpcOrKey: 'rpc_set_system_mode(…, p_readonly:=true) → system_readonly',
    blocks: 'Same guard; raises system_readonly',
    toggle: 'rpc_set_system_mode(…, false, reason)',
    auth: '_is_admin() + _assert_admin_aal2()',
    citation: 'supabase/migrations/20260609000018_p0_system_live_guard.sql:43-63',
  },
  {
    category: 'platform',
    lever: 'Auto readonly',
    rpcOrKey: 'rpc_run_reconciliation() mismatch',
    blocks: 'Sets system_readonly=true on wallet↔ledger mismatch',
    toggle: 'Manual rpc_set_system_mode',
    auth: 'service_role',
    citation: 'supabase/migrations/20260609000026_s1_solvency_reconciliation.sql:269-274',
  },
  {
    category: 'platform',
    lever: 'Liquidation (intentionally unguarded)',
    rpcOrKey: 'rpc_liquidate_position / rpc_run_liquidations',
    blocks: 'NOT blocked by system_halt (solvency de-risk)',
    toggle: 'N/A',
    auth: 'internal / service',
    citation: 'supabase/migrations/20260609000018_p0_system_live_guard.sql:24-29',
  },
  {
    category: 'feature',
    lever: 'Per-feature kill',
    rpcOrKey: 'rpc_set_feature_enabled(feature, enabled, reason)',
    blocks: 'Whitelisted surfaces only (spot, futures, game, deposit, withdrawal, …)',
    toggle: 'Same RPC enabled:=true',
    auth: '_is_admin() + _assert_admin_aal2()',
    citation: 'supabase/migrations/20260609000019_p0_feature_kill_switches.sql:62-105',
  },
  {
    category: 'feature',
    lever: 'Per-game kill (no dedicated RPC)',
    rpcOrKey: 'app_config.feature_game_{game}_enabled',
    blocks: '_assert_game_feature_enabled(p_game) on rpc_place_game_bet',
    toggle: 'UPDATE app_config (operator SQL) or auto parity/rtp drift',
    auth: 'Operator SQL / rpc_check_casino_rtp_drift (admin AAL2)',
    citation: 'supabase/migrations/20260609000029_s3_casino_atomic_settlement.sql:52-100',
  },
  {
    category: 'withdrawal',
    lever: 'Withdrawal feature OFF',
    rpcOrKey: 'feature_withdrawal_enabled=false',
    blocks: 'rpc_request_withdrawal, rpc_approve_withdrawal, rpc_mark_withdrawal_sent',
    toggle: "rpc_set_feature_enabled('withdrawal', true, reason)",
    auth: 'Admin AAL2',
    citation: 'supabase/migrations/20260611000063_withdrawal_admin_guard_and_deposit_lock.sql',
  },
  {
    category: 'withdrawal',
    lever: 'Solvency hold',
    rpcOrKey: '_assert_solvency_withdrawal_gate(currency)',
    blocks: 'Withdrawal paths; code withdrawal_solvency_hold',
    toggle: 'Fresh rpc_run_reconciliation + treasury attestation',
    auth: 'Internal guard (triggered by stale recon / low treasury)',
    citation: 'supabase/migrations/20260609000033_s1_phase5_deposits_withdrawals.sql:403-459',
  },
  {
    category: 'casino',
    lever: 'parity_hold',
    rpcOrKey: 'game_bets.parity_hold (auto on p_expected_result mismatch)',
    blocks: 'Settlement; auto-disables feature_game_{game}_enabled',
    toggle: 'Manual per-game flag restore + bet resolution',
    auth: 'Automatic on rpc_place_game_bet',
    citation: 'supabase/migrations/20260609000029_s3_casino_atomic_settlement.sql:735-742',
  },
  {
    category: 'market',
    lever: 'Market circuit breaker',
    rpcOrKey: 'market_circuit_breakers.is_halted',
    blocks: 'Trading on halted symbol via _assert_price_fresh',
    toggle: 'rpc_resume_market(symbol, reason)',
    auth: 'Admin AAL2',
    citation: 'supabase/migrations/20260609000008_p0_hardening_schema.sql:598-674',
  },
  {
    category: 'hypothesis',
    lever: 'Halt leak candidate: bank transfer',
    rpcOrKey: 'rpc_process_bank_transfer',
    blocks: "Only _assert_feature_enabled('deposit'); NO _assert_system_live",
    toggle: 'Verify in drill 1',
    auth: 'service_role only',
    citation: 'supabase/migrations/20260609000033_s1_phase5_deposits_withdrawals.sql:737-739',
  },
  {
    category: 'hypothesis',
    lever: 'Halt leak candidate: approve withdrawal',
    rpcOrKey: 'rpc_approve_withdrawal',
    blocks: 'Only feature_withdrawal guard; NO _assert_system_live',
    toggle: 'Verify in drill 1',
    auth: 'Admin AAL2',
    citation: 'supabase/migrations/20260611000063_withdrawal_admin_guard_and_deposit_lock.sql:24-31',
  },
] as const;
