/**
 * P4-A — Trade desk failure recovery matrix (Plan trade_desk_qa_audit).
 * Tier 1 basic + Tier 2 chaos scenarios · Oracle freeze vs lag · incident escalation.
 *
 * Authority: TRADE_DESK_FAILURE_RECOVERY_MATRIX.md · T0_ORACLE_OPS_RUNBOOK cross-ref §7
 */

import { TRADE_DESK_FETCH_ERROR_BANNER_COMPONENT } from './trade-desk-fetch-error-display-contract';
import { TRADE_MARKET_STATUS_BANNER_COMPONENT } from './trade-market-status-display-contract';

export const TRADE_DESK_FAILURE_RECOVERY_TODO = 'p4-failure-recovery' as const;

export const TRADE_DESK_FAILURE_RECOVERY_DOC =
  'docs/OPERATIONS/TRADE_DESK_FAILURE_RECOVERY_MATRIX.md' as const;

export const TRADE_DESK_FAILURE_RECOVERY_E0_SLOT =
  'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/failure-recovery-matrix.md' as const;

export const T0_ORACLE_OPS_RUNBOOK_DOC =
  'docs/OPERATIONS/TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md' as const;

/** Oracle alive but mark unchanged — distinct from lag (updated_at threshold). v5 V5 · plan P4-A. */
export const TRADE_ORACLE_PRICE_FREEZE_SECONDS = 60 as const;

export type FailureRecoveryTier = 'tier1' | 'tier2';

export type TradeDeskFailureScenario = {
  id: string;
  tier: FailureRecoveryTier;
  scenario: string;
  uiDefense: string;
  verification: string;
};

/** Tier 1 — basic visible recovery (P0 surfaces). */
export const TRADE_DESK_FAILURE_RECOVERY_TIER1: readonly TradeDeskFailureScenario[] = [
  {
    id: 'db-postgrest-unreachable',
    tier: 'tier1',
    scenario: 'DB/PostgREST unreachable',
    uiDefense: `${TRADE_DESK_FETCH_ERROR_BANNER_COMPONENT} + retry`,
    verification: 'vitest mock · trade-desk-fetch-error-display-contract',
  },
  {
    id: 'realtime-channel-down',
    tier: 'tier1',
    scenario: 'Realtime channel down',
    uiDefense: `${TRADE_MARKET_STATUS_BANNER_COMPONENT} disconnect · submit block`,
    verification: 'vitest reconnect · use-trade-oracle-realtime-disconnected',
  },
  {
    id: 'rpc-timeout-5xx',
    tier: 'tier1',
    scenario: 'RPC timeout / 5xx',
    uiDefense: 'toast stable code · trade-feedback-display',
    verification: 'i18n audit · trade-toast-display-contract',
  },
  {
    id: 'browser-offline',
    tier: 'tier1',
    scenario: 'browser offline',
    uiDefense: 'navigator.onLine gate · fetch error',
    verification: 'Playwright offline (CI e2e advisory)',
  },
  {
    id: 'partial-stale-price',
    tier: 'tier1',
    scenario: 'partial stale price (per-symbol)',
    uiDefense: `${TRADE_MARKET_STATUS_BANNER_COMPONENT} stale · submit-only block`,
    verification: 'trade-market-status-display-contract · trade-submit-display-contract',
  },
] as const;

/** Tier 2 — composite chaos (v4 E2). Minimum 4 rows + freeze in DoD. */
export const TRADE_DESK_FAILURE_RECOVERY_TIER2: readonly TradeDeskFailureScenario[] = [
  {
    id: 'partial-fill-disconnect',
    tier: 'tier2',
    scenario: 'Partial fill mid disconnect',
    uiDefense: 'fills partial + disconnect banner · submit blocked · reconnect consistency',
    verification: 'E2E mock (CI advisory) · trade-desk-load-realtime-display-contract',
  },
  {
    id: 'duplicate-submit-retry',
    tier: 'tier2',
    scenario: 'Duplicate submit (network retry)',
    uiDefense: 'idempotency → single ledger leg · already-processed toast or silent dedup',
    verification: 'S0 SQL pins · hardening_test · trade_cross_user_reject_test',
  },
  {
    id: 'retry-storm',
    tier: 'tier2',
    scenario: 'Retry storm',
    uiDefense: 'submit lock · exponential backoff · graceful degrade',
    verification: 'vitest · P3-C soak advisory',
  },
  {
    id: 'clock-drift',
    tier: 'tier2',
    scenario: 'Clock drift',
    uiDefense: 'stale price gate · server updated_at authoritative',
    verification: 'trade-chart-mount-display-contract · resolveOraclePriceStale',
  },
  {
    id: 'oracle-lag',
    tier: 'tier2',
    scenario: 'Oracle lag (updated_at threshold exceeded)',
    uiDefense: 'stale banner · futures/spot submit block',
    verification: 'trade-market-status-display-contract · E8 browser matrix',
  },
  {
    id: 'price-feed-freeze',
    tier: 'tier2',
    scenario: 'Price feed freeze (oracle alive · mark ≥60s unchanged)',
    uiDefense: 'freeze banner · submit block · distinct from lag',
    verification: 'trade-desk-failure-recovery-display-contract · resolveOraclePriceFrozen',
  },
  {
    id: 'redis-cache-delay',
    tier: 'tier2',
    scenario: 'Redis/cache delay',
    uiDefense: 'N/A — no Redis on trade path · P0 fetch error fallback',
    verification: 'doc N/A row · TRADE_DESK_FAILURE_RECOVERY_MATRIX.md',
  },
] as const;

export type OracleFreezeEscalationStep = {
  step: number;
  owner: string;
  sla: string;
  checkLocation: string;
  action: string;
};

/** v7 V7-5 — 4 rows required (DoD). Korean operator copy lives in TRADE_DESK_FAILURE_RECOVERY_MATRIX.md only. */
export const ORACLE_FREEZE_INCIDENT_ESCALATION: readonly OracleFreezeEscalationStep[] = [
  {
    step: 1,
    owner: 'auto UI banner + soak WARNING',
    sla: 'immediate',
    checkLocation: 'trade-market-status-banner · load-realtime soak SQL',
    action: 'keep submit block · no false urgency',
  },
  {
    step: 2,
    owner: 'operator',
    sla: '15m',
    checkLocation: 'Supabase oracle_prices.updated_at · T0 runbook §1.3 · §7',
    action: 'classify freeze vs lag',
  },
  {
    step: 3,
    owner: 'operator (single-operator)',
    sla: '30m',
    checkLocation: 'E0 P4/incident-*.md',
    action: 'oracle cron/edge restart · T0 runbook §2.2',
  },
  {
    step: 4,
    owner: 'operator discretion',
    sla: 'as needed',
    checkLocation: 'trade.dataStatus.freeze* i18n keys',
    action: 'eligibility-visible notice only · no exaggerated urgency',
  },
] as const;

/** True when oracle is fresh but mark value unchanged >= threshold (distinct from lag). */
export function resolveOraclePriceFrozen(
  lastPriceChangeMs: number,
  nowMs: number,
  oracleStale: boolean,
  thresholdSeconds: number = TRADE_ORACLE_PRICE_FREEZE_SECONDS,
): boolean {
  if (oracleStale) return false;
  if (!Number.isFinite(lastPriceChangeMs) || !Number.isFinite(nowMs)) return false;
  const ageSeconds = (nowMs - lastPriceChangeMs) / 1000;
  return ageSeconds >= thresholdSeconds;
}

export function listTradeDeskFailureRecoveryScenarios(): TradeDeskFailureScenario[] {
  return [...TRADE_DESK_FAILURE_RECOVERY_TIER1, ...TRADE_DESK_FAILURE_RECOVERY_TIER2];
}

export function assertTradeDeskFailureRecoverySync(): void {
  if (TRADE_DESK_FAILURE_RECOVERY_TIER1.length < 5) {
    throw new Error('trade-desk-failure-recovery: Tier1 must cover ≥5 basic scenarios');
  }
  if (TRADE_DESK_FAILURE_RECOVERY_TIER2.length < 4) {
    throw new Error('trade-desk-failure-recovery: Tier2 must cover ≥4 chaos scenarios');
  }
  if (ORACLE_FREEZE_INCIDENT_ESCALATION.length !== 4) {
    throw new Error('trade-desk-failure-recovery: Oracle freeze escalation must have 4 rows');
  }
  const ids = new Set(listTradeDeskFailureRecoveryScenarios().map((row) => row.id));
  if (ids.size !== listTradeDeskFailureRecoveryScenarios().length) {
    throw new Error('trade-desk-failure-recovery: duplicate scenario id');
  }
  if (!TRADE_DESK_FAILURE_RECOVERY_TIER2.some((row) => row.id === 'price-feed-freeze')) {
    throw new Error('trade-desk-failure-recovery: price-feed-freeze row required');
  }
}
