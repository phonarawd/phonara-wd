/**
 * E6 Admin gap desks GATE pin (YAML #251).
 * Authority: Plan `ew-e6-gate-admin-desks` · §29.5 · §29.6 · activity · audit CSV.
 *
 * GATE does not re-ship desks — asserts WAVE green · routes live · read-only
 * boundaries · CSV export · AdminTable · beginner nav → E7.
 * No new migrations (engine 0).
 */

import {
  ADMIN_BEGINNER_NAV_LABEL_KEYS,
  ADMIN_BEGINNER_P2_ROUTES,
} from './admin-beginner-language-display-contract';
import {
  ADMIN_DESK_ROUTE_PAGES,
  ADMIN_DESK_ROUTES,
  ADMIN_ROUTE_WIRE_STATUS,
} from './admin-security-display-contract';
import {
  ADMIN_TABLE_DESK_SURFACE_PATHS,
  ADMIN_TABLE_IMPORT_MARKER,
} from './admin-table-dedup-display-contract';
import {
  assertEwE6AdminDesksSync,
  AUDIT_CSV_EXPORT_ENABLED,
  EW_E6_ADMIN_DESK_ROUTES,
  EW_E6_ADMIN_DESK_RPC_PINS,
  EW_E6_ADMIN_DESKS_ARTIFACT_PATHS,
  EW_E6_ADMIN_DESKS_NEXT_TODO,
  EW_E6_ADMIN_DESKS_TODO,
} from './ew-e6-admin-desks-display-contract';

export const EW_E6_GATE_ADMIN_DESKS_TODO = 'ew-e6-gate-admin-desks' as const;
export const EW_E6_GATE_ADMIN_DESKS_PREREQUISITE_TODO = EW_E6_ADMIN_DESKS_TODO;
export const EW_E6_GATE_ADMIN_DESKS_NEXT_TODO = 'ew-e7-social-wave' as const;

/** App-relative routes unlocked by E6 WAVE + verified by this GATE. */
export const EW_E6_GATE_ADMIN_DESKS_UNLOCK_ROUTES = EW_E6_ADMIN_DESK_ROUTES;

/** Read-only desks — no confirm/upsert write controls (§29.2 R0). */
export const EW_E6_GATE_READ_ONLY_DESK_ROUTES = [
  '/earn/activity',
  '/tier-benefits',
  '/audit',
] as const;

/** Write desks — confirm + reason dialogs allowed. */
export const EW_E6_GATE_WRITE_DESK_ROUTES = ['/promotions', '/cms', '/casino', '/staking'] as const;

/** Surface files that must import + render AdminTable (§29.6). */
export const EW_E6_GATE_ADMIN_TABLE_SURFACE_PATHS = [
  'apps/admin/src/product/surfaces/admin-promotions-page.tsx',
  'apps/admin/src/product/surfaces/admin-cms-page.tsx',
  'apps/admin/src/product/surfaces/admin-tier-benefits-page.tsx',
  'apps/admin/src/product/surfaces/admin-casino-page.tsx',
  'apps/admin/src/product/surfaces/admin-staking-page.tsx',
  'apps/admin/src/product/surfaces/admin-earn-activity-page.tsx',
  'apps/admin/src/product/surfaces/admin-audit-page.tsx',
] as const;

/** Read-only surface sources — must not ship confirm/upsert write chrome. */
export const EW_E6_GATE_READ_ONLY_SURFACE_PATHS = [
  'apps/admin/src/product/surfaces/admin-earn-activity-page.tsx',
  'apps/admin/src/product/surfaces/admin-tier-benefits-page.tsx',
  'apps/admin/src/product/surfaces/admin-audit-page.tsx',
] as const;

export const EW_E6_GATE_ADMIN_DESKS_ARTIFACT_PATHS = [
  'apps/admin/src/domain/ew-e6-gate-admin-desks-display-contract.ts',
  'apps/admin/src/domain/__tests__/ew-e6-gate-admin-desks-display-contract.test.ts',
  'apps/admin/src/domain/ew-e6-admin-desks-display-contract.ts',
  'apps/admin/src/domain/__tests__/ew-e6-admin-desks-display-contract.test.ts',
  'apps/admin/src/hooks/admin/useAdminAuditDesk.ts',
  'apps/admin/src/domain/admin-beginner-language-display-contract.ts',
  'apps/admin/src/domain/admin-table-dedup-display-contract.ts',
  'docs/OPERATIONS/ENGINE_GAP_E6_ADMIN_DESKS.md',
  'docs/OPERATIONS/ENGINE_GAP_E6_GATE_ADMIN_DESKS.md',
] as const;

export const EW_E6_GATE_ADMIN_DESKS_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/ew-e6-gate-admin-desks-display-contract.test.ts',
  'apps/admin/src/domain/__tests__/ew-e6-admin-desks-display-contract.test.ts',
  'apps/admin/src/domain/__tests__/admin-beginner-language-display-contract.test.ts',
  'apps/admin/src/domain/__tests__/admin-table-dedup-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-earn-activity-page.test.tsx',
  'apps/admin/src/product/surfaces/__tests__/admin-audit-page.test.tsx',
] as const;

const FORBIDDEN_WRITE_MARKERS = [
  'confirmKey',
  'ReasonDialog',
  'rpc_admin_upsert',
  'rpc_admin_set_',
] as const;

export function areEwE6DeskRoutesWired(): boolean {
  return EW_E6_ADMIN_DESK_ROUTES.every((route) => {
    const inDeskRoutes = (ADMIN_DESK_ROUTES as readonly string[]).includes(route);
    const page = ADMIN_DESK_ROUTE_PAGES[route as keyof typeof ADMIN_DESK_ROUTE_PAGES];
    const wire = ADMIN_ROUTE_WIRE_STATUS[route as keyof typeof ADMIN_ROUTE_WIRE_STATUS];
    return inDeskRoutes && typeof page === 'string' && wire === 'wired';
  });
}

export function areEwE6BeginnerNavKeysPinned(): boolean {
  return EW_E6_ADMIN_DESK_ROUTES.every((route) => {
    const inP2 = (ADMIN_BEGINNER_P2_ROUTES as readonly string[]).includes(route);
    const navKey = ADMIN_BEGINNER_NAV_LABEL_KEYS[route];
    return inP2 && typeof navKey === 'string' && navKey.startsWith('admin.nav.');
  });
}

export function areEwE6AdminTableSurfacesRegistered(): boolean {
  return EW_E6_GATE_ADMIN_TABLE_SURFACE_PATHS.every((path) =>
    (ADMIN_TABLE_DESK_SURFACE_PATHS as readonly string[]).includes(path),
  );
}

export function isAuditCsvExportFullyUnlocked(): boolean {
  return (
    AUDIT_CSV_EXPORT_ENABLED === true &&
    EW_E6_ADMIN_DESK_RPC_PINS.auditExport === 'client_csv' &&
    (EW_E6_ADMIN_DESK_ROUTES as readonly string[]).includes('/audit')
  );
}

export function isEarnActivityReadOnlyUnlocked(): boolean {
  return (
    (EW_E6_GATE_READ_ONLY_DESK_ROUTES as readonly string[]).includes('/earn/activity') &&
    EW_E6_ADMIN_DESK_RPC_PINS.opsDashboard === 'rpc_admin_get_ops_dashboard' &&
    EW_E6_ADMIN_DESK_RPC_PINS.viralAnalytics === 'rpc_admin_get_viral_analytics'
  );
}

export function isEwE6AdminDesksFullyUnlocked(): boolean {
  return (
    areEwE6DeskRoutesWired() &&
    areEwE6BeginnerNavKeysPinned() &&
    areEwE6AdminTableSurfacesRegistered() &&
    isAuditCsvExportFullyUnlocked() &&
    isEarnActivityReadOnlyUnlocked() &&
    EW_E6_GATE_READ_ONLY_DESK_ROUTES.length === 3 &&
    EW_E6_GATE_WRITE_DESK_ROUTES.length === 4 &&
    EW_E6_GATE_ADMIN_TABLE_SURFACE_PATHS.length === 7
  );
}

export function assertEwE6ReadOnlySurfaceSource(src: string, rel: string): void {
  for (const marker of FORBIDDEN_WRITE_MARKERS) {
    if (src.includes(marker)) {
      throw new Error(`E6 read-only desk must not contain ${marker}: ${rel}`);
    }
  }
  if (!src.includes(ADMIN_TABLE_IMPORT_MARKER) || !src.includes('<AdminTable')) {
    throw new Error(`E6 desk must use AdminTable: ${rel}`);
  }
}

export function assertEwE6GateAdminDesksSync(): void {
  assertEwE6AdminDesksSync();

  if (EW_E6_GATE_ADMIN_DESKS_TODO !== 'ew-e6-gate-admin-desks') {
    throw new Error('E6 GATE todo id drift');
  }
  if (EW_E6_GATE_ADMIN_DESKS_PREREQUISITE_TODO !== 'ew-e6-admin-desks-wave') {
    throw new Error('E6 GATE prerequisite must be ew-e6-admin-desks-wave');
  }
  if (EW_E6_GATE_ADMIN_DESKS_NEXT_TODO !== 'ew-e7-social-wave') {
    throw new Error('E6 GATE next must be ew-e7-social-wave');
  }
  if (EW_E6_ADMIN_DESKS_NEXT_TODO !== 'ew-e6-gate-admin-desks') {
    throw new Error('E6 WAVE next must unlock ew-e6-gate-admin-desks');
  }
  if (EW_E6_GATE_ADMIN_DESKS_UNLOCK_ROUTES.length !== 7) {
    throw new Error('E6 GATE must unlock 7 desk routes');
  }
  if (EW_E6_ADMIN_DESKS_ARTIFACT_PATHS.length < 10) {
    throw new Error('E6 WAVE artifacts missing');
  }
  if (!isEwE6AdminDesksFullyUnlocked()) {
    throw new Error(
      'E6 GATE unlock not live — desk routes · §29.5 nav · AdminTable · activity · audit CSV',
    );
  }
}
