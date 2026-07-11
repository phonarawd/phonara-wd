import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { messages } from '@phonara/i18n';

import {
  ADMIN_TEAM_DESK_FULL_PATH,
  ADMIN_TEAM_DESK_RPCS,
  ADMIN_TEAM_DESK_ROUTE,
  ADMIN_TEAM_GRANTABLE_ROLES,
  assertP13AdminTeamDeskSync,
  canAccessAdminTeamDesk,
  isAdminNavRouteAllowed,
  P13_ADMIN_TEAM_DESK_ARTIFACT_PATHS,
  P13_ADMIN_TEAM_DESK_TEST_PATHS,
  P13_PREP_ADMIN_TEAM_DESK_TODO,
} from '../admin-team-desk-display-contract';

const ADMIN_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(ADMIN_SRC, '../../..');

const ko = messages.ko as Record<string, string>;
const en = messages.en as Record<string, string>;

describe('admin-team-desk-display-contract (§29.5 · YAML #230)', () => {
  it('registers team desk todo · owner-only · 5 grantable roles', () => {
    expect(P13_PREP_ADMIN_TEAM_DESK_TODO).toBe('p13-prep-admin-team-desk');
    expect(ADMIN_TEAM_DESK_ROUTE).toBe('/team');
    expect(ADMIN_TEAM_DESK_FULL_PATH).toBe('/admin/team');
    expect(ADMIN_TEAM_GRANTABLE_ROLES).toHaveLength(5);
    expect(ADMIN_TEAM_DESK_RPCS).toEqual([
      'rpc_admin_list_role_grants',
      'rpc_admin_set_role_grant',
    ]);
    expect(canAccessAdminTeamDesk('owner')).toBe(true);
    expect(canAccessAdminTeamDesk('finance')).toBe(false);
    expect(canAccessAdminTeamDesk('viewer')).toBe(false);
    expect(isAdminNavRouteAllowed('owner', '/team')).toBe(true);
    expect(isAdminNavRouteAllowed('finance', '/team')).toBe(false);
    expect(() => assertP13AdminTeamDeskSync()).not.toThrow();
  });

  it('pins surface · route · hook artifacts on disk', () => {
    for (const rel of P13_ADMIN_TEAM_DESK_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of P13_ADMIN_TEAM_DESK_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('requires beginner i18n keys for team desk (ko+en)', () => {
    const keys = [
      'admin.nav.team',
      'admin.help.team.title',
      'admin.team.action.grant',
      'admin.team.action.revoke',
      'admin.team.forbidden.title',
      'admin.settings.teamLink',
      'admin.role.owner',
      'admin.role.viewer',
    ];
    for (const key of keys) {
      expect(ko[key], `ko ${key}`).toBeTruthy();
      expect(en[key], `en ${key}`).toBeTruthy();
    }
    expect(ko['admin.nav.team']).toBe('직원 권한');
    expect(ko['admin.settings.teamLink']).toContain('직원 권한');
  });
});
