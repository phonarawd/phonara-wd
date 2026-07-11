import { describe, expect, it } from 'vitest';

import {
  assertEwE6AdminDesksSync,
  AUDIT_CSV_EXPORT_ENABLED,
  EW_E6_ADMIN_DESKS_ARTIFACT_PATHS,
  EW_E6_ADMIN_DESKS_NEXT_TODO,
  EW_E6_ADMIN_DESKS_PREREQUISITE_TODO,
  EW_E6_ADMIN_DESKS_TODO,
  EW_E6_ADMIN_DESK_ROUTES,
  EW_E6_ADMIN_DESK_RPC_PINS,
} from '../ew-e6-admin-desks-display-contract';

describe('ew-e6-admin-desks-display-contract', () => {
  it('pins the E6 prerequisite, desk routes, existing RPCs, and CSV export', () => {
    expect(EW_E6_ADMIN_DESKS_TODO).toBe('ew-e6-admin-desks-wave');
    expect(EW_E6_ADMIN_DESKS_PREREQUISITE_TODO).toBe('ew-e5-gate-gap-surfaces');
    expect(EW_E6_ADMIN_DESKS_NEXT_TODO).toBe('ew-e6-gate-admin-desks');
    expect(EW_E6_ADMIN_DESK_ROUTES).toEqual([
      '/promotions',
      '/cms',
      '/tier-benefits',
      '/casino',
      '/staking',
      '/earn/activity',
      '/audit',
    ]);
    expect(EW_E6_ADMIN_DESK_RPC_PINS.cmsList).toBe('rpc_admin_list_cms_content');
    expect(EW_E6_ADMIN_DESK_RPC_PINS.auditExport).toBe('client_csv');
    expect(AUDIT_CSV_EXPORT_ENABLED).toBe(true);
    expect(EW_E6_ADMIN_DESKS_ARTIFACT_PATHS).toContain(
      'apps/admin/src/product/surfaces/admin-earn-activity-page.tsx',
    );
    expect(() => assertEwE6AdminDesksSync()).not.toThrow();
  });
});
