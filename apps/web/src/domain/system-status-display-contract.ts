/**
 * `/status` — STUB until E10 trust/support status UI.
 * IA-hidden via PLATFORM_EWAVE_HIDDEN_ROUTES — direct URL shows defer empty state.
 */

import type { MessageKey } from '@phonara/i18n';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';
import { SUPPORT_HUB_ROUTE } from './support-hub-display-contract';

export const SYSTEM_STATUS_ROUTE = '/status' as const;

export const SYSTEM_STATUS_SEO_TITLE_KEY = 'status.page.head.title' as const satisfies MessageKey;
export const SYSTEM_STATUS_SEO_DESCRIPTION_KEY =
  'status.page.head.desc' as const satisfies MessageKey;

export const SYSTEM_STATUS_DEFER_TITLE_KEY = 'status.page.defer.title' as const satisfies MessageKey;
export const SYSTEM_STATUS_DEFER_BODY_KEY = 'status.page.defer.body' as const satisfies MessageKey;

export const SYSTEM_STATUS_ENGINE_TODO = 'ew-e10-trust-support-ui' as const;
export const SYSTEM_STATUS_UI_UNLOCK_TODO = 'ew-e10-gate-platform-world-class' as const;

export function shouldDeferSystemStatus(): boolean {
  return (PLATFORM_EWAVE_HIDDEN_ROUTES as readonly string[]).includes(SYSTEM_STATUS_ROUTE);
}

export function resolveSystemStatusBackRoute(): typeof SUPPORT_HUB_ROUTE {
  return SUPPORT_HUB_ROUTE;
}

export function assertSystemStatusContractSync(): void {
  if (SYSTEM_STATUS_ROUTE !== '/status') {
    throw new Error('system-status: route drift');
  }
  if (!shouldDeferSystemStatus()) {
    throw new Error('system-status: /status must stay deferred until E10');
  }
}
