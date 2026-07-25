import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertAdminPhase5PolishContractSync,
  PHASE5_ADMIN_HI_QA_MATRIX,
  PHASE5_ADMIN_OWNER_PATHS,
  PHASE5_ADMIN_PART_ORDER,
  PHASE5_ADMIN_VIEWPORT_WIDTHS,
  PHASE5_MOBILE_QUICK_NAV_ROUTES,
  PHASE5_NAV_TOKEN_MARKERS,
} from '../admin-phase5-polish-display-contract';
import { ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST } from '../admin-beginner-language-display-contract';

const adminSrcRoot = resolve(import.meta.dirname, '../..');

function readAdmin(relativePath: string): string {
  return readFileSync(resolve(adminSrcRoot, relativePath), 'utf8');
}

describe('admin-phase5-polish-display-contract', () => {
  it('keeps finance→…→HI-QA part order and desktop evidence widths', () => {
    expect(() => assertAdminPhase5PolishContractSync()).not.toThrow();
    expect(PHASE5_ADMIN_PART_ORDER).toEqual([
      'finance-desks',
      'risk-users',
      'content-growth',
      'ops-team-support',
      'hi-qa',
    ]);
    expect(PHASE5_ADMIN_VIEWPORT_WIDTHS).toEqual([390, 1024, 2560]);
    expect(PHASE5_ADMIN_HI_QA_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(PHASE5_ADMIN_OWNER_PATHS.length).toBeGreaterThanOrEqual(5);
  });

  it('reconfirms fix-admin-rbac-nav-gaps allowlist pins', () => {
    expect(ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.finance).toContain('/earn/rewards');
    expect(ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.support).toContain('/withdrawals');
  });

  it('nav uses defined hover/focus/radius/touch tokens (not surface-elevated)', () => {
    const source = readAdmin('product/layout/admin-nav.tsx');
    for (const marker of PHASE5_NAV_TOKEN_MARKERS) {
      expect(source).toContain(marker);
    }
    expect(source).not.toContain('hover:bg-surface-elevated');
    expect(source).not.toContain('rounded-md');
  });

  it('mobile quick nav includes role-primary desks', () => {
    const source = readAdmin('product/layout/admin-nav.tsx');
    expect(source).toContain('MOBILE_QUICK_NAV');
    for (const route of PHASE5_MOBILE_QUICK_NAV_ROUTES) {
      expect(source).toContain(`to: '${route}'`);
    }
  });

  it('parseOpsDashboard sorts exception queues by canon order', () => {
    const source = readAdmin('product/bridge/parse-ops-dashboard.ts');
    expect(source).toContain('EXCEPTION_QUEUE_CANON_ORDER');
    expect(source).toContain('sortExceptionQueuesByCanon');
    expect(source).toContain("'withdrawal'");
    expect(source).toMatch(/exceptionQueues:\s*sortExceptionQueuesByCanon/);
  });

  it('settings / mfa use border-line (not undefined border-border)', () => {
    const settings = readAdmin('product/surfaces/admin-settings-page.tsx');
    expect(settings).toContain('border-line');
    expect(settings).toContain('bg-surface-raised');
    expect(settings).not.toContain('border-border');
    expect(settings).not.toContain('bg-surface-1');
    expect(settings).toContain('admin-settings-section-empty');
    expect(settings).toContain('empty=');

    const mfa = readAdmin('product/surfaces/admin-mfa-enroll-page.tsx');
    expect(mfa).toContain('border-line');
    expect(mfa).not.toContain('border-border');
  });

  it('nav group headers share typography whether link or label', () => {
    const source = readAdmin('product/layout/admin-nav.tsx');
    expect(source).toContain('headerClass');
    expect(source).not.toContain('tracking-wide uppercase');
  });
});
