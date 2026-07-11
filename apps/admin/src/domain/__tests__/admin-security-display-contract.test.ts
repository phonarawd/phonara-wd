import { describe, expect, it } from 'vitest';

import {
  ADMIN_DESK_ROUTES,
  ADMIN_DESK_ROUTE_PAGES,
  ADMIN_DESK_SURFACES,
  ADMIN_ROUTE_WIRE_STATUS,
  ADMIN_STALE_DESK_ROUTES_REMOVED,
  ADMIN_USER_CORRESPONDENCE,
} from '@/domain/admin-security-display-contract';

describe('admin-security-display-contract (R0 + E6 live desks)', () => {
  it('does not claim stale /operations · /overview desks', () => {
    for (const stale of ADMIN_STALE_DESK_ROUTES_REMOVED) {
      expect(ADMIN_DESK_ROUTES).not.toContain(stale);
      expect(Object.keys(ADMIN_DESK_ROUTE_PAGES)).not.toContain(stale);
      expect(Object.keys(ADMIN_ROUTE_WIRE_STATUS)).not.toContain(stale);
    }
    expect(ADMIN_DESK_SURFACES.some((p) => p.includes('/operations.tsx'))).toBe(false);
    expect(ADMIN_DESK_SURFACES.some((p) => p.includes('/overview.tsx'))).toBe(false);
  });

  it('wires E6 gap desks · ops · queues · withdrawals · earn rewards', () => {
    expect(ADMIN_DESK_ROUTES).toContain('/ops');
    expect(ADMIN_DESK_ROUTES).toContain('/queues');
    expect(ADMIN_DESK_ROUTES).toContain('/withdrawals');
    expect(ADMIN_DESK_ROUTES).toContain('/earn/rewards');
    expect(ADMIN_DESK_ROUTES).toContain('/cms');
    expect(ADMIN_DESK_ROUTES).toContain('/promotions');
    expect(ADMIN_DESK_ROUTES).toContain('/casino');
    expect(ADMIN_DESK_ROUTES).toContain('/tier-benefits');
    expect(ADMIN_DESK_ROUTES).toContain('/earn/activity');
    expect(ADMIN_DESK_ROUTE_PAGES['/ops']).toBe('AdminOpsPage');
    expect(ADMIN_DESK_ROUTE_PAGES['/cms']).toBe('AdminCmsPage');
    expect(ADMIN_DESK_ROUTE_PAGES['/casino']).toBe('AdminCasinoPage');
    expect(ADMIN_ROUTE_WIRE_STATUS['/ops']).toBe('wired');
    expect(ADMIN_ROUTE_WIRE_STATUS['/earn/activity']).toBe('wired');
  });

  it('maps user casino/cms surfaces to E6 desks', () => {
    const casino = ADMIN_USER_CORRESPONDENCE.find((row) => row.userSurface === '/casino');
    const announcements = ADMIN_USER_CORRESPONDENCE.find(
      (row) => row.userSurface === '/announcements',
    );
    const landing = ADMIN_USER_CORRESPONDENCE.find((row) => row.userSurface === '/');
    expect(casino?.adminRoute).toBe('/casino');
    expect(announcements?.adminRoute).toBe('/cms');
    expect(landing?.adminRoute).toBe('/settings');
    for (const row of ADMIN_USER_CORRESPONDENCE) {
      expect(ADMIN_DESK_ROUTES).toContain(row.adminRoute);
    }
  });
});
