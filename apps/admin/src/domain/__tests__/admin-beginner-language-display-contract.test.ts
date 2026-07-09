import { describe, expect, it } from 'vitest';

import {
  ADMIN_BEGINNER_ALL_ROUTES,
  ADMIN_BEGINNER_HELP_KEYS,
  ADMIN_BEGINNER_NAV_LABEL_KEYS,
  ADMIN_BEGINNER_PLANNED_ROUTES,
  ADMIN_FORBIDDEN_SCREEN_JARGON,
  ADMIN_TEAM_ROLE_LABEL_KEYS,
  ADMIN_TEAM_ROLES,
} from '../admin-beginner-language-display-contract';

describe('admin-beginner-language-display-contract (§29.5)', () => {
  it('maps every route to a nav label key', () => {
    for (const route of ADMIN_BEGINNER_ALL_ROUTES) {
      expect(ADMIN_BEGINNER_NAV_LABEL_KEYS[route], route).toBeTruthy();
    }
  });

  it('lists planned admin routes for §32.6', () => {
    expect(ADMIN_BEGINNER_PLANNED_ROUTES).toEqual(['/team', '/support', '/earn/activity']);
  });

  it('defines five team roles with label keys', () => {
    expect(ADMIN_TEAM_ROLES).toHaveLength(5);
    for (const role of ADMIN_TEAM_ROLES) {
      expect(ADMIN_TEAM_ROLE_LABEL_KEYS[role]).toMatch(/^admin\.role\./);
    }
  });

  it('requires help keys for major desks', () => {
    expect(ADMIN_BEGINNER_HELP_KEYS.length).toBeGreaterThanOrEqual(10);
    for (const key of ADMIN_BEGINNER_HELP_KEYS) {
      expect(key.startsWith('admin.help.')).toBe(true);
    }
  });

  it('forbids common jargon tokens', () => {
    expect(ADMIN_FORBIDDEN_SCREEN_JARGON).toContain('queue');
    expect(ADMIN_FORBIDDEN_SCREEN_JARGON).toContain('rpc_');
  });
});
