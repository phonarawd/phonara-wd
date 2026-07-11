/**
 * E6 Admin desk wave contract (YAML #250).
 * Reuses live engine hooks only; no migration or client-side money computation.
 */

export const EW_E6_ADMIN_DESKS_TODO = 'ew-e6-admin-desks-wave' as const;
export const EW_E6_ADMIN_DESKS_PREREQUISITE_TODO = 'ew-e5-gate-gap-surfaces' as const;
export const EW_E6_ADMIN_DESKS_NEXT_TODO = 'ew-e6-gate-admin-desks' as const;

export const EW_E6_ADMIN_DESK_ROUTES = [
  '/promotions',
  '/cms',
  '/tier-benefits',
  '/casino',
  '/staking',
  '/earn/activity',
  '/audit',
] as const;

export const EW_E6_ADMIN_DESK_RPC_PINS = {
  cmsList: 'rpc_admin_list_cms_content',
  cmsUpsert: 'rpc_admin_upsert_cms_content',
  casinoCatalog: 'rpc_admin_list_casino_catalog',
  casinoStatus: 'rpc_admin_set_casino_game_status',
  stakingPools: 'rpc_admin_list_staking_pools',
  stakingSetActive: 'rpc_admin_set_staking_pool_active',
  opsDashboard: 'rpc_admin_get_ops_dashboard',
  viralAnalytics: 'rpc_admin_get_viral_analytics',
  auditExport: 'client_csv',
} as const;

export const AUDIT_CSV_EXPORT_ENABLED = true as const;

export const EW_E6_ADMIN_DESKS_ARTIFACT_PATHS = [
  'apps/admin/src/domain/ew-e6-admin-desks-display-contract.ts',
  'apps/admin/src/domain/__tests__/ew-e6-admin-desks-display-contract.test.ts',
  'apps/admin/src/hooks/admin/useAdminEarnActivityDesk.ts',
  'apps/admin/src/hooks/admin/useAdminTierBenefitsDesk.ts',
  'apps/admin/src/hooks/admin/useAdminAuditDesk.ts',
  'apps/admin/src/product/surfaces/admin-cms-page.tsx',
  'apps/admin/src/product/surfaces/admin-promotions-page.tsx',
  'apps/admin/src/product/surfaces/admin-casino-page.tsx',
  'apps/admin/src/product/surfaces/admin-tier-benefits-page.tsx',
  'apps/admin/src/product/surfaces/admin-earn-activity-page.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E6_ADMIN_DESKS.md',
] as const;

export function assertEwE6AdminDesksSync(): void {
  if (EW_E6_ADMIN_DESKS_TODO !== 'ew-e6-admin-desks-wave') {
    throw new Error('E6 admin desks todo drift');
  }
  if (EW_E6_ADMIN_DESKS_PREREQUISITE_TODO !== 'ew-e5-gate-gap-surfaces') {
    throw new Error('E6 prerequisite must be E5 GATE');
  }
  if (EW_E6_ADMIN_DESKS_NEXT_TODO !== 'ew-e6-gate-admin-desks') {
    throw new Error('E6 next must be its GATE');
  }
  if (EW_E6_ADMIN_DESK_ROUTES.length !== 7 || EW_E6_ADMIN_DESK_ROUTES.some((route) => route.startsWith('/admin'))) {
    throw new Error('E6 routes must be seven app-relative routes');
  }
  if (
    EW_E6_ADMIN_DESK_RPC_PINS.cmsList !== 'rpc_admin_list_cms_content' ||
    EW_E6_ADMIN_DESK_RPC_PINS.cmsUpsert !== 'rpc_admin_upsert_cms_content' ||
    EW_E6_ADMIN_DESK_RPC_PINS.casinoCatalog !== 'rpc_admin_list_casino_catalog' ||
    EW_E6_ADMIN_DESK_RPC_PINS.casinoStatus !== 'rpc_admin_set_casino_game_status' ||
    EW_E6_ADMIN_DESK_RPC_PINS.opsDashboard !== 'rpc_admin_get_ops_dashboard' ||
    EW_E6_ADMIN_DESK_RPC_PINS.auditExport !== 'client_csv'
  ) {
    throw new Error('E6 admin desk RPC pin drift');
  }
  if (!AUDIT_CSV_EXPORT_ENABLED || EW_E6_ADMIN_DESKS_ARTIFACT_PATHS.length < 10) {
    throw new Error('E6 admin desk artifact or CSV export drift');
  }
}
