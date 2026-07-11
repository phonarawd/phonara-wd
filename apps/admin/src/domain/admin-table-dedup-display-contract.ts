/**
 * P2 GATE — AdminTable dedup (§29.6 · YAML #207).
 * Authority: `p2-gate-admin-table-dedup` · REBUILD_PLAN_v1 · Plan §29.6.
 *
 * Desk list UI = AdminTable only. Native `<table>` / local LoadingTable = FAIL.
 */

export const P2_GATE_ADMIN_TABLE_DEDUP_TODO = 'p2-gate-admin-table-dedup' as const;

/** Prerequisite primitive todo — must be closed before this GATE. */
export const P2_ADMIN_TABLE_PRIMITIVE_TODO = 'p2-admin-table-primitive' as const;

export const P2_GATE_ADMIN_TABLE_DEDUP_PREREQUISITE_TODOS = [
  P2_ADMIN_TABLE_PRIMITIVE_TODO,
] as const;

/** Single shared primitive path (§29.6 · extend-only). */
export const ADMIN_TABLE_PRIMITIVE_PATH =
  'apps/admin/src/product/primitives/admin-table.tsx' as const;

/**
 * Desk list surfaces that must import + render AdminTable.
 * Matches §29.2/§29.5 live desks with tabular exception queues (23).
 * E6 (#251) adds promotions · cms · tier-benefits · casino · earn/activity.
 */
export const ADMIN_TABLE_DESK_SURFACE_PATHS = [
  'apps/admin/src/product/surfaces/admin-home-page.tsx',
  'apps/admin/src/product/surfaces/admin-queues-page.tsx',
  'apps/admin/src/product/surfaces/admin-deposits-page.tsx',
  'apps/admin/src/product/surfaces/admin-withdrawals-page.tsx',
  'apps/admin/src/product/surfaces/admin-sports-page.tsx',
  'apps/admin/src/product/surfaces/admin-earn-page.tsx',
  'apps/admin/src/product/surfaces/admin-earn-referrals-page.tsx',
  'apps/admin/src/product/surfaces/admin-earn-missions-page.tsx',
  'apps/admin/src/product/surfaces/admin-earn-rewards-page.tsx',
  'apps/admin/src/product/surfaces/admin-earn-activity-page.tsx',
  'apps/admin/src/product/surfaces/admin-viral-stats-page.tsx',
  'apps/admin/src/product/surfaces/admin-users-page.tsx',
  'apps/admin/src/product/surfaces/admin-tiers-page.tsx',
  'apps/admin/src/product/surfaces/admin-tier-benefits-page.tsx',
  'apps/admin/src/product/surfaces/admin-promotions-page.tsx',
  'apps/admin/src/product/surfaces/admin-cms-page.tsx',
  'apps/admin/src/product/surfaces/admin-casino-page.tsx',
  'apps/admin/src/product/surfaces/admin-risk-page.tsx',
  'apps/admin/src/product/surfaces/admin-staking-page.tsx',
  'apps/admin/src/product/surfaces/admin-audit-page.tsx',
  'apps/admin/src/product/surfaces/admin-settings-page.tsx',
  'apps/admin/src/product/surfaces/admin-ops-page.tsx',
  'apps/admin/src/product/surfaces/admin-mfa-policy-page.tsx',
] as const;

/** Import marker every desk list surface must contain. */
export const ADMIN_TABLE_IMPORT_MARKER =
  "from '@/product/primitives/admin-table'" as const;

/** Forbidden local loading-table identifier (§29.6). */
export const ADMIN_TABLE_FORBIDDEN_LOADING_TABLE = 'LoadingTable' as const;

/**
 * Native table open tag — allowed only inside ADMIN_TABLE_PRIMITIVE_PATH.
 * Desk / route / other surface files must have 0 matches.
 */
export const ADMIN_TABLE_NATIVE_OPEN_TAG = '<table' as const;

/** On-disk artifacts required for this GATE. */
export const P2_GATE_ADMIN_TABLE_DEDUP_ARTIFACT_PATHS = [
  'apps/admin/src/domain/admin-table-dedup-display-contract.ts',
  ADMIN_TABLE_PRIMITIVE_PATH,
  'apps/admin/src/product/primitives/__tests__/admin-table.test.tsx',
  ...ADMIN_TABLE_DESK_SURFACE_PATHS,
] as const;

/** gate:ai-impl owner paths. */
export const P2_GATE_ADMIN_TABLE_DEDUP_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/admin-table-dedup-display-contract.test.ts',
  'apps/admin/src/product/primitives/__tests__/admin-table.test.tsx',
] as const;

/** Non-waivable sync for P2 AdminTable dedup GATE closeout. */
export function assertP2GateAdminTableDedupSync(): void {
  if (!P2_GATE_ADMIN_TABLE_DEDUP_PREREQUISITE_TODOS.includes(P2_ADMIN_TABLE_PRIMITIVE_TODO)) {
    throw new Error('p2-gate-admin-table-dedup: missing prerequisite p2-admin-table-primitive');
  }

  if (ADMIN_TABLE_DESK_SURFACE_PATHS.length !== 23) {
    throw new Error(
      `p2-gate-admin-table-dedup: expected 23 desk surfaces, got ${ADMIN_TABLE_DESK_SURFACE_PATHS.length}`,
    );
  }

  if (!ADMIN_TABLE_PRIMITIVE_PATH.endsWith('admin-table.tsx')) {
    throw new Error('p2-gate-admin-table-dedup: primitive path drift');
  }
}
