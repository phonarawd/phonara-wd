import { describe, expect, it } from 'vitest';

import {
  ADMIN_DESK_ROUTES,
  ADMIN_DESK_ROUTE_PAGES,
  ADMIN_DESK_SURFACES,
  ADMIN_ROUTE_WIRE_STATUS,
  ADMIN_STALE_DESK_ROUTES_REMOVED,
  ADMIN_USER_CORRESPONDENCE,
} from '@/domain/admin-security-display-contract';

describe('admin-security-display-contract (R0 live desks)', () => {
  it('does not claim stale /casino · /cms · /operations · /overview desks', () => {
    for (const stale of ADMIN_STALE_DESK_ROUTES_REMOVED) {
      expect(ADMIN_DESK_ROUTES).not.toContain(stale);
      expect(Object.keys(ADMIN_DESK_ROUTE_PAGES)).not.toContain(stale);
      expect(Object.keys(ADMIN_ROUTE_WIRE_STATUS)).not.toContain(stale);
    }
    expect(ADMIN_DESK_SURFACES.some((p) => p.includes('/casino.tsx'))).toBe(false);
    expect(ADMIN_DESK_SURFACES.some((p) => p.includes('/cms.tsx'))).toBe(false);
    expect(ADMIN_DESK_SURFACES.some((p) => p.includes('/operations.tsx'))).toBe(false);
  });

  it('wires ops + queues + withdrawals + earn rewards as live desks', () => {
    expect(ADMIN_DESK_ROUTES).toContain('/ops');
    expect(ADMIN_DESK_ROUTES).toContain('/queues');
    expect(ADMIN_DESK_ROUTES).toContain('/withdrawals');
    expect(ADMIN_DESK_ROUTES).toContain('/earn/rewards');
    expect(ADMIN_DESK_ROUTE_PAGES['/ops']).toBe('AdminOpsPage');
    expect(ADMIN_ROUTE_WIRE_STATUS['/ops']).toBe('wired');
  });

  it('maps user casino/landing to existing admin desks (not ghost routes)', () => {
    const casino = ADMIN_USER_CORRESPONDENCE.find((row) => row.userSurface === '/casino');
    const landing = ADMIN_USER_CORRESPONDENCE.find((row) => row.userSurface === '/');
    expect(casino?.adminRoute).toBe('/ops');
    expect(landing?.adminRoute).toBe('/settings');
    for (const row of ADMIN_USER_CORRESPONDENCE) {
      expect(ADMIN_DESK_ROUTES).toContain(row.adminRoute);
    }
  });
});
