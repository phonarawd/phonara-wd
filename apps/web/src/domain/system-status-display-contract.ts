/**
 * `/status` — public service status display (E10 + R4).
 * Live lane badges only from verified `rpc_get_public_platform_status`.
 * Fetch failure → fail-closed unknown (C-02 residual).
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import { ANNOUNCEMENTS_ROUTE } from './announcements-display-contract';
import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';
import { SUPPORT_HUB_ROUTE } from './support-hub-display-contract';
import type { MoneyStatusState } from '@/product/primitives/status-badge';

export const SYSTEM_STATUS_ROUTE = '/status' as const;

export const SYSTEM_STATUS_SEO_TITLE_KEY = 'status.page.head.title' as const satisfies MessageKey;
export const SYSTEM_STATUS_SEO_DESCRIPTION_KEY =
  'status.page.head.desc' as const satisfies MessageKey;

export const SYSTEM_STATUS_DEFER_TITLE_KEY =
  'status.page.defer.title' as const satisfies MessageKey;
export const SYSTEM_STATUS_DEFER_BODY_KEY = 'status.page.defer.body' as const satisfies MessageKey;

export const SYSTEM_STATUS_ENGINE_TODO = 'ew-e10-trust-support-ui' as const;
export const SYSTEM_STATUS_UI_UNLOCK_TODO = 'ew-e10-trust-support-ui' as const;

export const SYSTEM_STATUS_PUBLIC_RPC = 'rpc_get_public_platform_status' as const;

/** Presentation service lanes — must match public RPC lane ids. */
export const SYSTEM_STATUS_COMPONENT_IDS = ['earn', 'wallet', 'trade', 'sports', 'casino'] as const;

export type SystemStatusComponentId = (typeof SYSTEM_STATUS_COMPONENT_IDS)[number];

export const SYSTEM_STATUS_COMPONENT_TITLE_KEYS = {
  earn: 'status.page.component.earn.title',
  wallet: 'status.page.component.wallet.title',
  trade: 'status.page.component.trade.title',
  sports: 'status.page.component.sports.title',
  casino: 'status.page.component.casino.title',
} as const satisfies Record<SystemStatusComponentId, MessageKey>;

export const SYSTEM_STATUS_OPERATIONAL_KEY =
  'status.page.component.operational' as const satisfies MessageKey;

export const SYSTEM_STATUS_UNKNOWN_KEY =
  'status.page.component.unknown' as const satisfies MessageKey;

export const SYSTEM_STATUS_DEGRADED_KEY =
  'status.page.component.degraded' as const satisfies MessageKey;

export const SYSTEM_STATUS_OUTAGE_KEY =
  'status.page.component.outage' as const satisfies MessageKey;

export const SYSTEM_STATUS_SUMMARY_UNKNOWN_KEY =
  'status.page.summary.unknown' as const satisfies MessageKey;

export const SYSTEM_STATUS_SUMMARY_OPERATIONAL_KEY =
  'status.page.summary.operational' as const satisfies MessageKey;

export const SYSTEM_STATUS_SUMMARY_DEGRADED_KEY =
  'status.page.summary.degraded' as const satisfies MessageKey;

export const SYSTEM_STATUS_SUMMARY_OUTAGE_KEY =
  'status.page.summary.outage' as const satisfies MessageKey;

/** Fail-closed badge grammar when live feed is unavailable. */
export const SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE = 'pending' as const;

export type PublicPlatformLaneStatus = 'operational' | 'degraded' | 'outage' | 'unknown';

export type PublicPlatformOverallStatus = PublicPlatformLaneStatus;

export interface PublicPlatformLane {
  id: SystemStatusComponentId;
  status: PublicPlatformLaneStatus;
  reasonCategory: string;
  checkedAt: string;
}

export interface PublicPlatformStatus {
  checkedAt: string;
  overall: PublicPlatformOverallStatus;
  lanes: PublicPlatformLane[];
  source: 'live' | 'fail-closed';
}

export function shouldDeferSystemStatus(): boolean {
  return (PLATFORM_EWAVE_HIDDEN_ROUTES as readonly string[]).includes(SYSTEM_STATUS_ROUTE);
}

export function isSystemStatusLive(): boolean {
  return LAUNCH_GATES.systemStatusLive === true && !shouldDeferSystemStatus();
}

export function resolveSystemStatusBackRoute(): typeof SUPPORT_HUB_ROUTE {
  return SUPPORT_HUB_ROUTE;
}

export function resolveSystemStatusAnnouncementsRoute(): typeof ANNOUNCEMENTS_ROUTE {
  return ANNOUNCEMENTS_ROUTE;
}

export function mapPublicStatusToBadgeState(
  status: PublicPlatformLaneStatus,
): MoneyStatusState {
  switch (status) {
    case 'operational':
      return 'settled';
    case 'degraded':
      return 'halted';
    case 'outage':
      return 'failed';
    default:
      return 'pending';
  }
}

export function resolveLaneLabelKey(status: PublicPlatformLaneStatus): MessageKey {
  switch (status) {
    case 'operational':
      return SYSTEM_STATUS_OPERATIONAL_KEY;
    case 'degraded':
      return SYSTEM_STATUS_DEGRADED_KEY;
    case 'outage':
      return SYSTEM_STATUS_OUTAGE_KEY;
    default:
      return SYSTEM_STATUS_UNKNOWN_KEY;
  }
}

export function resolveSummaryLabelKey(status: PublicPlatformOverallStatus): MessageKey {
  switch (status) {
    case 'operational':
      return SYSTEM_STATUS_SUMMARY_OPERATIONAL_KEY;
    case 'degraded':
      return SYSTEM_STATUS_SUMMARY_DEGRADED_KEY;
    case 'outage':
      return SYSTEM_STATUS_SUMMARY_OUTAGE_KEY;
    default:
      return SYSTEM_STATUS_SUMMARY_UNKNOWN_KEY;
  }
}

function asLaneStatus(raw: unknown): PublicPlatformLaneStatus {
  if (raw === 'operational' || raw === 'degraded' || raw === 'outage' || raw === 'unknown') {
    return raw;
  }
  return 'unknown';
}

export function parsePublicPlatformStatus(raw: unknown): PublicPlatformStatus | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const overall = asLaneStatus(obj['overall']);
  const checkedAt = typeof obj['checkedAt'] === 'string' ? obj['checkedAt'] : '';
  const lanesRaw = obj['lanes'];
  if (!Array.isArray(lanesRaw) || lanesRaw.length === 0 || !checkedAt) return null;

  const byId = new Map<string, PublicPlatformLane>();
  for (const item of lanesRaw) {
    if (!item || typeof item !== 'object') continue;
    const lane = item as Record<string, unknown>;
    const id = lane['id'];
    if (typeof id !== 'string') continue;
    if (!(SYSTEM_STATUS_COMPONENT_IDS as readonly string[]).includes(id)) continue;
    byId.set(id, {
      id: id as SystemStatusComponentId,
      status: asLaneStatus(lane['status']),
      reasonCategory: typeof lane['reasonCategory'] === 'string' ? lane['reasonCategory'] : 'unknown',
      checkedAt: typeof lane['checkedAt'] === 'string' ? lane['checkedAt'] : checkedAt,
    });
  }

  const lanes = SYSTEM_STATUS_COMPONENT_IDS.map(
    (id) =>
      byId.get(id) ?? {
        id,
        status: 'unknown' as const,
        reasonCategory: 'unknown',
        checkedAt,
      },
  );

  return { checkedAt, overall, lanes, source: 'live' };
}

export function failClosedPublicPlatformStatus(): PublicPlatformStatus {
  const checkedAt = new Date(0).toISOString();
  return {
    checkedAt,
    overall: 'unknown',
    source: 'fail-closed',
    lanes: SYSTEM_STATUS_COMPONENT_IDS.map((id) => ({
      id,
      status: 'unknown',
      reasonCategory: 'unknown',
      checkedAt,
    })),
  };
}

export function assertSystemStatusContractSync(): void {
  if (SYSTEM_STATUS_ROUTE !== '/status') {
    throw new Error('system-status: route drift');
  }
  if (!isSystemStatusLive()) {
    throw new Error('system-status: /status must be live after E10 unlock');
  }
  if (SYSTEM_STATUS_COMPONENT_IDS.length !== 5) {
    throw new Error('system-status: component count drift');
  }
  if (SYSTEM_STATUS_PUBLIC_RPC !== 'rpc_get_public_platform_status') {
    throw new Error('system-status: public RPC name drift');
  }
  if ((SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE as string) === 'settled') {
    throw new Error('system-status: fail-closed badge must not be settled');
  }
}
