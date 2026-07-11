import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { messages } from '@phonara/i18n';

import {
  ADMIN_BEGINNER_ALL_ROUTES,
  ADMIN_BEGINNER_GLOSSARY_CONCEPTS,
  ADMIN_BEGINNER_HELP_KEYS,
  ADMIN_BEGINNER_NAV_LABEL_KEYS,
  ADMIN_BEGINNER_P2_ROUTES,
  ADMIN_BEGINNER_PLANNED_ROUTES,
  ADMIN_BEGINNER_SECTION_29_2_EXTRA_ROWS,
  ADMIN_BEGINNER_STATUS_CONCEPTS,
  ADMIN_FORBIDDEN_SCREEN_JARGON,
  ADMIN_R3_IRREVERSIBLE_I18N_KEY,
  ADMIN_SECTION_12_14_CANONICAL_ROUTES,
  ADMIN_TEAM_ROLE_LABEL_KEYS,
  ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST,
  ADMIN_TEAM_ROLES,
  ADMIN_USER_CORRESPONDENCE_ROWS,
  assertP13AdminCanonicalDocsSync,
  P13_ADMIN_CANONICAL_DOCS_ARTIFACT_PATHS,
  P13_ADMIN_CANONICAL_DOCS_TEST_PATHS,
  P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODO,
  P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODOS,
  P13_PREP_ADMIN_CANONICAL_DOCS_TODO,
  P13_PREP_ADMIN_TEAM_DESK_TODO,
} from '../admin-beginner-language-display-contract';

const ADMIN_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(ADMIN_SRC, '../../..');

const ko = messages.ko as Record<string, string>;

describe('admin-beginner-language-display-contract (§29.5 · YAML #229)', () => {
  it('registers DOC todo · prerequisite W8 GATE · next team desk', () => {
    expect(P13_PREP_ADMIN_CANONICAL_DOCS_TODO).toBe('p13-prep-admin-canonical-docs');
    expect(P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODO).toBe(
      'da-w8-gate-signature-experience',
    );
    expect(P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODOS).toEqual([
      P13_PREP_ADMIN_CANONICAL_DOCS_PREREQUISITE_TODO,
    ]);
    expect(P13_PREP_ADMIN_TEAM_DESK_TODO).toBe('p13-prep-admin-team-desk');
    expect(() => assertP13AdminCanonicalDocsSync()).not.toThrow();
  });

  it('maps every route to a nav label key with ko catalog pin', () => {
    for (const route of ADMIN_BEGINNER_ALL_ROUTES) {
      const key = ADMIN_BEGINNER_NAV_LABEL_KEYS[route];
      expect(key, route).toBeTruthy();
      expect(ko[key!], key).toBeTruthy();
    }
    expect(ko['admin.nav.overview']).toBe('오늘 할 일');
    expect(ko['admin.nav.team']).toBe('직원 권한');
    expect(ko['admin.nav.support']).toBe('회원 문의');
    expect(ko['admin.nav.earnActivity']).toBe('회원 활동 보기');
    expect(ko['admin.nav.deposits']).toBe('입금 확인');
    expect(ko['admin.nav.withdrawals']).toBe('출금 보내기');
  });

  it('lists planned admin routes for §32.6', () => {
    expect(ADMIN_BEGINNER_PLANNED_ROUTES).toEqual([]);
    expect(ADMIN_BEGINNER_P2_ROUTES).toContain('/team');
    expect(ADMIN_BEGINNER_P2_ROUTES).toContain('/support');
    expect(ADMIN_BEGINNER_P2_ROUTES).toContain('/earn/activity');
    expect(ADMIN_BEGINNER_P2_ROUTES).toContain('/cms');
    expect(ADMIN_BEGINNER_P2_ROUTES).toContain('/casino');
  });

  it('defines five team roles with label keys and ko names', () => {
    expect(ADMIN_TEAM_ROLES).toHaveLength(5);
    for (const role of ADMIN_TEAM_ROLES) {
      const key = ADMIN_TEAM_ROLE_LABEL_KEYS[role];
      expect(key).toMatch(/^admin\.role\./);
      expect(ko[key]).toBeTruthy();
    }
    expect(ko['admin.role.owner']).toBe('주인');
    expect(ko['admin.role.viewer']).toBe('보기만');
  });

  it('pins RBAC menu allowlist — viewer no withdrawals · finance no team', () => {
    expect(ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.owner).toContain('/team');
    expect(ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.viewer).not.toContain('/withdrawals');
    expect(ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.finance).not.toContain('/team');
    expect(ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.support).toContain('/support');
    expect(ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.risk).toContain('/risk');
  });

  it('requires help keys for major desks', () => {
    expect(ADMIN_BEGINNER_HELP_KEYS.length).toBeGreaterThanOrEqual(10);
    for (const key of ADMIN_BEGINNER_HELP_KEYS) {
      expect(key.startsWith('admin.help.')).toBe(true);
      expect(ko[`${key}.title`] ?? ko[key], key).toBeTruthy();
    }
    expect(ADMIN_BEGINNER_HELP_KEYS).toContain('admin.help.team');
    expect(ADMIN_BEGINNER_HELP_KEYS).toContain('admin.help.support');
    expect(ADMIN_BEGINNER_HELP_KEYS).toContain('admin.help.earnActivity');
  });

  it('forbids jargon · pins §29.1 glossary/status · R3 i18n', () => {
    expect(ADMIN_FORBIDDEN_SCREEN_JARGON).toContain('queue');
    expect(ADMIN_FORBIDDEN_SCREEN_JARGON).toContain('rpc_');
    expect(ADMIN_BEGINNER_GLOSSARY_CONCEPTS).toContain('reject');
    expect(ADMIN_BEGINNER_GLOSSARY_CONCEPTS).toContain('todayWork');
    expect(ADMIN_BEGINNER_STATUS_CONCEPTS).toHaveLength(6);
    expect(ADMIN_BEGINNER_STATUS_CONCEPTS).toContain('rejected');
    expect(ADMIN_R3_IRREVERSIBLE_I18N_KEY).toBe('admin.overview.irreversible');
    expect(ko[ADMIN_R3_IRREVERSIBLE_I18N_KEY]).toContain('되돌릴 수 없');
  });

  it('pins §29.2 33차 extra rows and §12.14↔team/support', () => {
    expect(ADMIN_BEGINNER_SECTION_29_2_EXTRA_ROWS.map((r) => r.desk)).toEqual([
      '/admin/team',
      '/admin/support',
      '/admin/earn/activity',
      '/admin/audit',
      '/admin/deposits',
    ]);
    expect(ADMIN_SECTION_12_14_CANONICAL_ROUTES).toContain('/admin/team');
    expect(ADMIN_SECTION_12_14_CANONICAL_ROUTES).toContain('/admin/support');
    expect(ADMIN_SECTION_12_14_CANONICAL_ROUTES).toContain('/admin/earn/activity');
    expect(ADMIN_USER_CORRESPONDENCE_ROWS.some((r) => r.adminRoute === '/admin/deposits')).toBe(
      true,
    );
  });

  it('requires SSOT + contract artifacts on disk', () => {
    for (const rel of P13_ADMIN_CANONICAL_DOCS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of P13_ADMIN_CANONICAL_DOCS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('ADMIN_BEGINNER_LANGUAGE_CANON pins §29.5 nav · glossary · todo', () => {
    const canon = readFileSync(
      resolve(REPO_ROOT, 'docs/SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md'),
      'utf8',
    );
    expect(canon).toContain('p13-prep-admin-canonical-docs');
    expect(canon).toContain('오늘 할 일');
    expect(canon).toContain('직원 권한');
    expect(canon).toContain('회원 문의');
    expect(canon).toContain('반려');
    expect(canon).toContain('admin-beginner-language-display-contract');
  });

  it('ADMIN_TEAM_RBAC_CANON pins 5 roles · owner-only team · viewer deny', () => {
    const canon = readFileSync(resolve(REPO_ROOT, 'docs/SSOT/ADMIN_TEAM_RBAC_CANON.md'), 'utf8');
    expect(canon).toContain('owner');
    expect(canon).toContain('viewer');
    expect(canon).toContain('주인');
    expect(canon).toContain('직원 권한');
    expect(canon).toContain('rpc_admin_set_role_grant');
    expect(canon).toContain('p13-prep-admin-team-desk');
    expect(canon).toContain('ADMIN_TEAM_ROLE_MENU');
  });

  it('PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX pins user↔admin 1:1 · §12.14', () => {
    const matrix = readFileSync(
      resolve(REPO_ROOT, 'docs/PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md'),
      'utf8',
    );
    expect(matrix).toContain('p13-prep-admin-canonical-docs');
    expect(matrix).toContain('/admin/deposits');
    expect(matrix).toContain('/admin/withdrawals');
    expect(matrix).toContain('/admin/team');
    expect(matrix).toContain('/admin/support');
    expect(matrix).toContain('§12.14');
  });
});
