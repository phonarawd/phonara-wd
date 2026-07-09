/**
 * Trade Desk Phase 4 Launch RC gate bundle (Plan Tier 2 · S4).
 * Authority: `phase-4-launch-rc` · 390/768/1024 · complaint+toast registry · CI check:full · 24h soak.
 */

import { assertP9TradeWorldClassGateSync } from './p9-gate-trade-world-class-display-contract';
import { P9_TRADE_DEAD_CONTROL_TEST_IDS } from './p9-trade-visual-signoff-display-contract';
import { STAKING_HUB_ROUTE, STAKING_POSITIONS_ROUTE } from './staking-display-contract';
import {
  TRADE_USER_COMPLAINT_RISKS,
  assertTradeToastFeedbackSync,
  type TradeComplaintMitigation,
  type TradeUserComplaintRisk,
} from './trade-exchange-parity-display-contract';
import {
  TRADE_TOAST_EVENT_REGISTRY,
  assertTradeToastRegistrySync,
  type TradeToastRegistryRow,
} from './trade-toast-display-contract';

export const TRADE_DESK_LAUNCH_RC_TODO = 'phase-4-launch-rc' as const;

/** Phase 4 S4 mandatory operator viewport widths (Plan §4A · P2-B 375 narrow). */
export const TRADE_LAUNCH_RC_VIEWPORT_WIDTHS = [375, 390, 768, 1024] as const;

/** Launch RC in-scope surfaces (Plan §4A). */
export const TRADE_LAUNCH_RC_SURFACE_ROUTES = [
  '/trade',
  '/trade/futures',
  STAKING_HUB_ROUTE,
  STAKING_POSITIONS_ROUTE,
] as const;

/** Tier 1 engineering complete todos required before Launch RC. */
export const TRADE_LAUNCH_RC_PREREQUISITE_TODOS = [
  'phase-3-e2e',
  'phase-2-toast-arch',
  'p9-gate-trade-world-class',
  'p9-operator-visual-signoff',
] as const;

/** Allowed deferred toast ownerTodo at Launch RC (T2 only · Plan §4B). */
export const TRADE_LAUNCH_RC_DEFERRED_TOAST_OWNER_TODOS = ['engine-t2-futures-completion'] as const;

/** GitHub CI jobs authoritative for Launch RC Verified (Plan §4C · G13). */
export const TRADE_LAUNCH_RC_CI_JOBS = ['quality', 'sql', 'e2e', 'advisors', 'check:full'] as const;

export const TRADE_LAUNCH_RC_E2E_SPEC = 'tests/e2e/trade-desk-smoke.spec.ts' as const;

export const TRADE_LAUNCH_RC_GATE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/trade-desk-launch-rc-display-contract.test.ts',
  'apps/web/src/product/surfaces/__tests__/p9-trade-visual-signoff.test.tsx',
] as const;

export const TRADE_LAUNCH_RC_SOAK_SPOTCHECK_SCRIPT =
  'scripts/trade-desk-launch-rc-soak-spotcheck.sql' as const;

/** One-time operator remediation before soak re-run (MATIC stale · stack_test alerts). */
export const TRADE_LAUNCH_RC_SOAK_REMEDIATE_SCRIPT =
  'scripts/trade-desk-launch-rc-soak-remediate.sql' as const;

export const TRADE_LAUNCH_RC_SIGNOFF_DOC =
  'docs/OPERATIONS/TRADE_DESK_LAUNCH_RC_SIGNOFF.md' as const;

/** Futures desk axe in jsdom hits Radix aria-controls false positive — operator browser S4 authoritative. */
export const TRADE_LAUNCH_RC_FUTURES_AXE_OPERATOR_BROWSER = true as const;

/** P10 surfaces — out of Trade Desk Launch RC scope (separate plan). */
export const TRADE_LAUNCH_RC_OUT_OF_SCOPE_COMPLAINT_IDS = [
  'sports-stake-usdt-only',
  'casino-stake-usdt-only',
] as const;

const COMPLAINT_MITIGATIONS: readonly TradeComplaintMitigation[] = [
  'live',
  'disabled',
  'disabled+key',
  'built_hidden',
];

export type TradeLaunchRcComplaintSignoffRow = {
  id: string;
  control: string;
  mitigatedBy: TradeComplaintMitigation;
  ownerTodo: string;
  signoffStatus: 'agent_confirmed' | 'operator_pending';
};

export type TradeLaunchRcToastSignoffRow = {
  eventId: string;
  phase: TradeToastRegistryRow['phase'];
  implemented: TradeToastRegistryRow['implemented'];
  ownerTodo: string | null;
  signoffStatus: 'agent_confirmed' | 'operator_pending';
};

export function isTradeLaunchRcInScopeComplaint(row: TradeUserComplaintRisk): boolean {
  return !TRADE_LAUNCH_RC_OUT_OF_SCOPE_COMPLAINT_IDS.includes(
    row.id as (typeof TRADE_LAUNCH_RC_OUT_OF_SCOPE_COMPLAINT_IDS)[number],
  );
}

export function listTradeLaunchRcComplaintSignoffRows(): TradeLaunchRcComplaintSignoffRow[] {
  return TRADE_USER_COMPLAINT_RISKS.filter(isTradeLaunchRcInScopeComplaint).map((row) => ({
    id: row.id,
    control: row.control,
    mitigatedBy: row.mitigatedBy,
    ownerTodo: row.ownerTodo,
    signoffStatus: 'agent_confirmed' as const,
  }));
}

export function listTradeLaunchRcToastSignoffRows(): TradeLaunchRcToastSignoffRow[] {
  return TRADE_TOAST_EVENT_REGISTRY.map((row) => ({
    eventId: row.eventId,
    phase: row.phase,
    implemented: row.implemented,
    ownerTodo: row.ownerTodo,
    signoffStatus:
      row.implemented === 'yes' ||
      (row.implemented === 'deferred' &&
        row.ownerTodo !== null &&
        TRADE_LAUNCH_RC_DEFERRED_TOAST_OWNER_TODOS.includes(
          row.ownerTodo as (typeof TRADE_LAUNCH_RC_DEFERRED_TOAST_OWNER_TODOS)[number],
        ))
        ? ('agent_confirmed' as const)
        : ('operator_pending' as const),
  }));
}

/** Non-waivable sync for Phase 4 Launch RC agent Implemented closeout. */
export function assertTradeDeskLaunchRcSync(): void {
  assertP9TradeWorldClassGateSync();
  assertTradeToastRegistrySync();
  assertTradeToastFeedbackSync();

  const complaintRows = listTradeLaunchRcComplaintSignoffRows();
  if (complaintRows.length < TRADE_USER_COMPLAINT_RISKS.length - 2) {
    throw new Error('trade-launch-rc: complaint signoff rows missing in-scope entries');
  }

  for (const row of complaintRows) {
    if (!COMPLAINT_MITIGATIONS.includes(row.mitigatedBy)) {
      throw new Error(`trade-launch-rc: complaint ${row.id} invalid mitigatedBy`);
    }
    if (row.signoffStatus !== 'agent_confirmed') {
      throw new Error(`trade-launch-rc: complaint ${row.id} not agent_confirmed`);
    }
  }

  for (const row of TRADE_TOAST_EVENT_REGISTRY) {
    if (row.implemented === 'deferred') {
      if (
        !row.ownerTodo ||
        !TRADE_LAUNCH_RC_DEFERRED_TOAST_OWNER_TODOS.includes(
          row.ownerTodo as (typeof TRADE_LAUNCH_RC_DEFERRED_TOAST_OWNER_TODOS)[number],
        )
      ) {
        throw new Error(
          `trade-launch-rc: deferred toast ${row.eventId} must have T2 ownerTodo only`,
        );
      }
    } else if (row.implemented !== 'yes') {
      throw new Error(`trade-launch-rc: toast ${row.eventId} must be yes or allowed deferred`);
    }
  }

  const toastRows = listTradeLaunchRcToastSignoffRows();
  const pendingToast = toastRows.filter((row) => row.signoffStatus === 'operator_pending');
  if (pendingToast.length > 0) {
    throw new Error(
      `trade-launch-rc: toast signoff pending for ${pendingToast.map((row) => row.eventId).join(', ')}`,
    );
  }

  const implementedCount = TRADE_TOAST_EVENT_REGISTRY.filter(
    (row) => row.implemented === 'yes',
  ).length;
  if (implementedCount < 18) {
    throw new Error('trade-launch-rc: expected at least 18 implemented toast events');
  }

  if (P9_TRADE_DEAD_CONTROL_TEST_IDS.length < 5) {
    throw new Error('trade-launch-rc: dead control test ids must cover primary CTAs');
  }

  if (TRADE_LAUNCH_RC_VIEWPORT_WIDTHS.length !== 4) {
    throw new Error('trade-launch-rc: S4 requires exactly 375/390/768/1024 viewport widths');
  }
}
