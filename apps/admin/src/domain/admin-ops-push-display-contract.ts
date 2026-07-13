/**
 * P13 INFRA — operator ops_alerts Web Push (§32.6 Gap A-4).
 * Authority: `p13-admin-ops-push` · PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX §6
 * Engine reuse: `push_subscriptions` · edge `ops-notify` fan-out · no new migration.
 */

export const P13_ADMIN_OPS_PUSH_TODO = 'p13-admin-ops-push' as const;

/** Prerequisite Track A UI — must be closed before this INFRA. */
export const P13_ADMIN_OPS_PUSH_PREREQUISITE_TODO = 'p13-prep-admin-team-desk' as const;

/** Next Track A todo after this INFRA. */
export const P13_ADMIN_OPS_PUSH_NEXT_TODO = 'p13-ops-prod-preflight' as const;

/** Admin SPA deep-link when operator taps the push (pending work queue). */
export const ADMIN_OPS_PUSH_DEEP_LINK_ROUTE = '/queues' as const;

export const ADMIN_OPS_PUSH_DEEP_LINK_FULL_PATH = '/admin/queues' as const;

export const ADMIN_OPS_PUSH_SUBSCRIPTIONS_TABLE = 'push_subscriptions' as const;

export const ADMIN_OPS_PUSH_EDGE_FUNCTION = 'ops-notify' as const;

export const ADMIN_OPS_PUSH_SW_PATH = '/sw.js' as const;

export const ADMIN_OPS_PUSH_EVENT_TYPE = 'ops_alert' as const;

/** Settings surface hosts the phone-alert CTA (no parallel desk). */
export const ADMIN_OPS_PUSH_SETTINGS_SURFACE_PATH =
  'apps/admin/src/product/surfaces/admin-settings-page.tsx' as const;

export const ADMIN_OPS_PUSH_HOOK_PATH = 'apps/admin/src/hooks/admin/useAdminOpsPush.ts' as const;

export const ADMIN_OPS_PUSH_FEATURE_PATH =
  'apps/admin/src/features/ops-push/admin-ops-web-push.ts' as const;

export const ADMIN_OPS_PUSH_SW_PUBLIC_PATH = 'apps/admin/public/sw.js' as const;

export const ADMIN_OPS_PUSH_EDGE_SHARED_PATH =
  'supabase/functions/_shared/ops-web-push-dispatch.ts' as const;

export const P13_ADMIN_OPS_PUSH_ARTIFACT_PATHS = [
  'apps/admin/src/domain/admin-ops-push-display-contract.ts',
  'apps/admin/src/domain/__tests__/admin-ops-push-display-contract.test.ts',
  ADMIN_OPS_PUSH_SETTINGS_SURFACE_PATH,
  'apps/admin/src/product/surfaces/__tests__/admin-settings-page.test.tsx',
  ADMIN_OPS_PUSH_HOOK_PATH,
  ADMIN_OPS_PUSH_FEATURE_PATH,
  'apps/admin/src/features/ops-push/__tests__/admin-ops-web-push.test.ts',
  ADMIN_OPS_PUSH_SW_PUBLIC_PATH,
  ADMIN_OPS_PUSH_EDGE_SHARED_PATH,
] as const;

export const P13_ADMIN_OPS_PUSH_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/admin-ops-push-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-settings-page.test.tsx',
  'apps/admin/src/features/ops-push/__tests__/admin-ops-web-push.test.ts',
] as const;

export const ADMIN_OPS_PUSH_I18N_KEYS = [
  'admin.settings.push.title',
  'admin.settings.push.body',
  'admin.settings.push.enable',
  'admin.settings.push.disable',
  'admin.settings.push.status.on',
  'admin.settings.push.status.off',
  'admin.settings.push.status.denied',
  'admin.settings.push.status.unsupported',
  'admin.settings.push.status.error',
  'admin.settings.push.queuesHint',
] as const;

export type AdminOpsPushStatus = 'on' | 'off' | 'denied' | 'unsupported' | 'loading' | 'error';

/** Build notification payload for SW + WEB_PUSH_DISPATCH_URL (url → /queues). */
export function buildAdminOpsPushPayload(input: {
  severity?: string | null;
  summary?: string | null;
  alertId?: string | null;
  notifyKind?: string | null;
}): {
  title: string;
  body: string;
  url: typeof ADMIN_OPS_PUSH_DEEP_LINK_ROUTE;
  tag: string;
  event_type: typeof ADMIN_OPS_PUSH_EVENT_TYPE;
} {
  const kind = input.notifyKind === 'digest' ? 'DIGEST' : 'ALERT';
  const severity = String(input.severity ?? 'critical').toUpperCase();
  return {
    title: `[PHONARA ${kind}] ${severity}`,
    body: input.summary?.trim() || 'Ops alert',
    url: ADMIN_OPS_PUSH_DEEP_LINK_ROUTE,
    tag: input.alertId ? `ops-alert:${input.alertId}` : `ops-alert:${kind.toLowerCase()}`,
    event_type: ADMIN_OPS_PUSH_EVENT_TYPE,
  };
}

export function assertP13AdminOpsPushSync(): void {
  if (P13_ADMIN_OPS_PUSH_TODO !== 'p13-admin-ops-push') {
    throw new Error('ops push todo id drift');
  }
  if (P13_ADMIN_OPS_PUSH_PREREQUISITE_TODO !== 'p13-prep-admin-team-desk') {
    throw new Error('ops push prerequisite drift');
  }
  if (ADMIN_OPS_PUSH_DEEP_LINK_ROUTE !== '/queues') {
    throw new Error('ops push must deep-link to /queues');
  }
  if (ADMIN_OPS_PUSH_SUBSCRIPTIONS_TABLE !== 'push_subscriptions') {
    throw new Error('ops push must reuse push_subscriptions');
  }
  if (ADMIN_OPS_PUSH_I18N_KEYS.length < 8) {
    throw new Error('ops push i18n keys incomplete');
  }
}
