/** [C] intentional guard exemptions — each entry requires an operator-visible reason. */

export type GuardCoverageRule = 'aal2-exempt' | 'system-live-exempt';

export interface GuardCoverageAllowlistEntry {
  readonly name: string;
  /** Omit to match all overloads of `name`. */
  readonly args?: string;
  readonly rule: GuardCoverageRule;
  readonly reason: string;
}

export const GUARD_COVERAGE_ALLOWLIST: readonly GuardCoverageAllowlistEntry[] = [
  // ── AAL2 exempt: read-only admin / preview ────────────────────────────────
  {
    name: 'rpc_admin_list_linked_device_users',
    rule: 'aal2-exempt',
    reason: 'read-only admin list — no state mutation',
  },
  {
    name: 'rpc_admin_list_outcome_liability',
    rule: 'aal2-exempt',
    reason: 'read-only admin liability snapshot',
  },
  {
    name: 'rpc_admin_list_sports_risk_events',
    rule: 'aal2-exempt',
    reason: 'read-only admin risk event feed',
  },
  {
    name: 'rpc_admin_list_unsettled_sports_fixtures',
    rule: 'aal2-exempt',
    reason: 'read-only admin unsettled fixture queue',
  },
  {
    name: 'rpc_get_sports_bet',
    rule: 'aal2-exempt',
    reason: 'read-only bet lookup — references _is_admin() for cross-user read',
  },
  {
    name: 'rpc_preview_sports_cashout',
    rule: 'aal2-exempt',
    reason: 'read-only cashout preview — no wallet mutation',
  },

  // ── AAL2 exempt: liquidation (non-admin users may liquidate own positions) ─
  {
    name: 'rpc_liquidate_position',
    rule: 'aal2-exempt',
    reason: 'liquidation path — admin MFA must not block user self-liquidation',
  },

  // ── AAL2 exempt: service/cron (auth.uid() NULL; _assert_admin_aal2 auto-skips) ─
  {
    name: 'rpc_run_funding_accrual',
    rule: 'aal2-exempt',
    reason: 'service/cron funding accrual runner',
  },
  {
    name: 'rpc_run_open_order_fills',
    rule: 'aal2-exempt',
    reason: 'service/cron open-order fill runner',
  },
  {
    name: 'rpc_run_stop_orders',
    rule: 'aal2-exempt',
    reason: 'service/cron stop-order runner',
  },
  {
    name: 'rpc_run_stop_orders',
    rule: 'system-live-exempt',
    reason: 'service/cron stop-order runner — must execute during halt like run_liquidations',
  },
  {
    name: 'rpc_run_liquidations',
    rule: 'aal2-exempt',
    reason: 'service/cron liquidation batch runner',
  },

  // ── system_live exempt: solvency / incident / service paths ───────────────
  {
    name: 'rpc_liquidate_position',
    rule: 'system-live-exempt',
    reason: 'solvency de-risk during platform halt (000018)',
  },
  {
    name: 'rpc_run_liquidations',
    rule: 'system-live-exempt',
    reason: 'batch liquidation runner — must run during halt',
  },
  {
    name: 'rpc_reject_withdrawal',
    rule: 'system-live-exempt',
    reason: 'admin incident refund path — reject stays live during halt (000063)',
  },
  {
    name: 'rpc_process_bank_transfer',
    rule: 'system-live-exempt',
    reason: 'service_role deposit rail — feature guard only, not system halt',
  },
  {
    name: 'rpc_process_bank_transfer_batch',
    rule: 'system-live-exempt',
    reason: 'E1b PG webhook/batch ingest — delegates to rpc_process_bank_transfer',
  },
  {
    name: 'rpc_admin_void_game_bet',
    rule: 'system-live-exempt',
    reason: 'admin incident void/refund during halt — same class as reject_withdrawal',
  },
  {
    name: 'rpc_void_sports_bet',
    rule: 'system-live-exempt',
    reason: 'admin incident sports void/refund during halt',
  },
  {
    name: 'rpc_sweep_stale_game_bets',
    rule: 'system-live-exempt',
    reason: 'admin/cron stale bet cleanup — incident hygiene path',
  },
  {
    name: 'rpc_spot_market_buy',
    args: 'p_usdt_spent text, p_client_request_id text',
    rule: 'system-live-exempt',
    reason: 'thin wrapper delegates to guarded 4-arg rpc_spot_market_buy',
  },
  {
    name: 'rpc_admin_match_crypto_deposit',
    rule: 'system-live-exempt',
    reason: 'admin/service crypto deposit match — feature guard only, not user halt surface',
  },
  {
    name: 'rpc_admin_match_krw_deposit',
    rule: 'system-live-exempt',
    reason: 'admin/service KRW deposit match — feature guard only, not user halt surface',
  },
  {
    name: 'rpc_admin_manual_wallet_adjust',
    rule: 'system-live-exempt',
    reason:
      'admin manual wallet adjust — incident/finance path during halt (same class as treasury reserve)',
  },
  {
    name: 'rpc_process_on_chain_transfer',
    rule: 'system-live-exempt',
    reason: 'service_role on-chain deposit rail — same class as rpc_process_bank_transfer',
  },
  {
    name: 'rpc_approve_affiliate_commission',
    rule: 'system-live-exempt',
    reason: 'admin commission payout — incident/finance path during halt',
  },
  {
    name: 'rpc_contribute_insurance_capital',
    rule: 'system-live-exempt',
    reason: 'admin insurance capital attestation — not user balance-moving entry',
  },
  {
    name: 'rpc_update_treasury_reserve',
    rule: 'system-live-exempt',
    reason: 'admin treasury attestation — solvency ops during halt',
  },

  // ── E-Wave interim (E8–E10 · guard hardening tracked in ENGINE_GAP ADR) ───
  {
    name: 'rpc_admin_fulfill_giftcard_redeem',
    rule: 'system-live-exempt',
    reason: 'E8 admin giftcard fulfill — finance path; system_live hardening deferred',
  },
  {
    name: 'rpc_admin_reject_giftcard_redeem',
    rule: 'system-live-exempt',
    reason: 'E8 admin giftcard reject — finance path; system_live hardening deferred',
  },
  {
    name: 'rpc_admin_get_product_analytics',
    rule: 'aal2-exempt',
    reason: 'E9 read-only product analytics aggregate — no wallet mutation',
  },
  {
    name: 'rpc_admin_list_support_tickets',
    rule: 'aal2-exempt',
    reason: 'E9 read-only support ticket queue — no state mutation',
  },
  {
    name: 'rpc_get_support_ticket',
    rule: 'aal2-exempt',
    reason: 'E9 user-owned ticket read — auth.uid() scoped; not admin MFA surface',
  },
  {
    name: 'rpc_preview_sports_partial_cashout',
    rule: 'aal2-exempt',
    reason: 'E22 read-only partial cashout preview — no wallet mutation',
  },
  {
    name: 'rpc_partial_cashout_sports_bet',
    rule: 'system-live-exempt',
    reason: 'E22 sports partial cashout — user settlement; system_live hardening deferred',
  },
  {
    name: 'rpc_progressive_step',
    rule: 'system-live-exempt',
    reason: 'E23 casino progressive step — user settlement; system_live hardening deferred',
  },
  {
    name: 'rpc_run_cms_publish_scheduled',
    rule: 'aal2-exempt',
    reason: 'E3 service/cron CMS publish runner — auth.uid() NULL',
  },
  {
    name: 'rpc_run_tier_decay',
    rule: 'aal2-exempt',
    reason: 'E1 service/cron tier decay runner — auth.uid() NULL',
  },
] as const;

export {
  BALANCE_CALLEE_HELPERS,
  BALANCE_HELPER_RE,
  type DetectionContext,
  type RpcDefRow,
  balanceMovingSqlPattern,
  buildDetectionContext,
  hasDirectBalanceSignal,
  hasSystemLiveGuard,
  isBalanceMoving,
  isGuardedByCalleeOrSelf,
  isThinRpcWrapper,
  isThinWrapper,
} from './guard-coverage-detect.ts';

export function isAllowlisted(name: string, args: string, rule: GuardCoverageRule): boolean {
  return GUARD_COVERAGE_ALLOWLIST.some(
    (entry) =>
      entry.name === name &&
      entry.rule === rule &&
      (entry.args === undefined || entry.args === args),
  );
}
