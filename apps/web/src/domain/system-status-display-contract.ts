/**
 * `/status` — public service status (E10 trust/support UI).
 * Fail-closed unknown until R4 `rpc_get_public_platform_status` is verified (C-02).
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import { ANNOUNCEMENTS_ROUTE } from './announcements-display-contract';
import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';
import { SUPPORT_HUB_ROUTE } from './support-hub-display-contract';

export const SYSTEM_STATUS_ROUTE = '/status' as const;

export const SYSTEM_STATUS_SEO_TITLE_KEY = 'status.page.head.title' as const satisfies MessageKey;
export const SYSTEM_STATUS_SEO_DESCRIPTION_KEY =
  'status.page.head.desc' as const satisfies MessageKey;

export const SYSTEM_STATUS_DEFER_TITLE_KEY =
  'status.page.defer.title' as const satisfies MessageKey;
export const SYSTEM_STATUS_DEFER_BODY_KEY = 'status.page.defer.body' as const satisfies MessageKey;

export const SYSTEM_STATUS_ENGINE_TODO = 'ew-e10-trust-support-ui' as const;
export const SYSTEM_STATUS_UI_UNLOCK_TODO = 'ew-e10-trust-support-ui' as const;

/** Presentation service lanes — fail-closed until public health aggregate ships (R4). */
export const SYSTEM_STATUS_COMPONENT_IDS = ['earn', 'wallet', 'trade', 'sports', 'casino'] as const;

export type SystemStatusComponentId = (typeof SYSTEM_STATUS_COMPONENT_IDS)[number];

export const SYSTEM_STATUS_COMPONENT_TITLE_KEYS = {
  earn: 'status.page.component.earn.title',
  wallet: 'status.page.component.wallet.title',
  trade: 'status.page.component.trade.title',
  sports: 'status.page.component.sports.title',
  casino: 'status.page.component.casino.title',
} as const satisfies Record<SystemStatusComponentId, MessageKey>;

/** @deprecated Operational labels must not render until live health feed (C-02). */
export const SYSTEM_STATUS_OPERATIONAL_KEY =
  'status.page.component.operational' as const satisfies MessageKey;

export const SYSTEM_STATUS_UNKNOWN_KEY =
  'status.page.component.unknown' as const satisfies MessageKey;

export const SYSTEM_STATUS_SUMMARY_UNKNOWN_KEY =
  'status.page.summary.unknown' as const satisfies MessageKey;

/** Fail-closed badge grammar — pending = unknown · never settled/green without live feed. */
export const SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE = 'pending' as const;

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
  if ((SYSTEM_STATUS_FAIL_CLOSED_BADGE_STATE as string) === 'settled') {
    throw new Error('system-status: fail-closed badge must not be settled');
  }
}
