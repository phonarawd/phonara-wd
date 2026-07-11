import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { messages } from '@phonara/i18n';

import { ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST } from '../admin-beginner-language-display-contract';
import {
  canAccessAdminTeamDesk,
  isAdminNavRouteAllowed,
} from '../admin-team-desk-display-contract';

const ADMIN_SRC = resolve(import.meta.dirname, '../..');
const PRODUCT_ROOT = resolve(ADMIN_SRC, 'product');

const ko = messages.ko as Record<string, string>;
const en = messages.en as Record<string, string>;

/** Soft Launch (#233) — exception dry-run desks. */
const SOFT_LAUNCH_EXCEPTION_ROUTES = ['/queues', '/deposits', '/withdrawals', '/ops'] as const;

/** Soft Launch viewer allow/deny (must match ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST). */
const SOFT_LAUNCH_VIEWER_ALLOWED = ['/', '/ops'] as const;
const SOFT_LAUNCH_VIEWER_FORBIDDEN = [
  '/team',
  '/withdrawals',
  '/deposits',
  '/queues',
  '/settings',
] as const;

/** UI-facing jargon that must not appear as hardcoded JSX text / title attrs. */
const UI_JARGON_PATTERNS = [
  />\s*queue\s*</i,
  />\s*desk\s*</i,
  />\s*settle\s*</i,
  />\s*void\s*</i,
  />\s*compliance\s*</i,
  />\s*AML\s*</i,
  /title=["']queue["']/i,
  /title=["']desk["']/i,
  /aria-label=["']queue["']/i,
  /aria-label=["']ops desk["']/i,
] as const;

function collectTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue;
      out.push(...collectTsxFiles(full));
      continue;
    }
    if (name.endsWith('.tsx') && !name.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

function surfaceBodyWithoutNoise(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/^import\s.+$/gm, ' ');
}

describe('p13-soft-launch-admin-spotcheck · §29.5 · viewer negative (#233)', () => {
  it('pins Soft Launch exception desks and viewer allow/deny', () => {
    expect(SOFT_LAUNCH_EXCEPTION_ROUTES).toEqual(['/queues', '/deposits', '/withdrawals', '/ops']);
    expect([...ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.viewer]).toEqual([
      ...SOFT_LAUNCH_VIEWER_ALLOWED,
    ]);
    for (const route of SOFT_LAUNCH_VIEWER_FORBIDDEN) {
      expect(ADMIN_TEAM_ROLE_MENU_ROUTE_ALLOWLIST.viewer).not.toContain(route);
      expect(isAdminNavRouteAllowed('viewer', route)).toBe(false);
    }
    for (const route of SOFT_LAUNCH_VIEWER_ALLOWED) {
      expect(isAdminNavRouteAllowed('viewer', route)).toBe(true);
    }
  });

  it('team desk is owner-only · viewer cannot access', () => {
    expect(canAccessAdminTeamDesk('owner')).toBe(true);
    expect(canAccessAdminTeamDesk('viewer')).toBe(false);
    expect(canAccessAdminTeamDesk('finance')).toBe(false);
    expect(isAdminNavRouteAllowed('viewer', '/team')).toBe(false);
    expect(isAdminNavRouteAllowed('owner', '/team')).toBe(true);
  });

  it('admin nav beginner labels — ko Hangul · en no Hangul · no jargon menu words', () => {
    expect(ko['admin.nav.queues']).toBe('처리 대기함');
    expect(ko['admin.nav.overview']).toBe('오늘 할 일');
    expect(ko['admin.nav.ops']).toBe('시스템 상태');
    expect(ko['admin.nav.team']).toBe('직원 권한');
    expect(ko['admin.nav.deposits']).toBe('입금 확인');
    expect(ko['admin.nav.withdrawals']).toBe('출금 보내기');

    expect(en['admin.nav.queues']).toBe('Pending');
    expect(en['admin.nav.ops']).toBe('System status');
    expect(en['admin.nav.queues']).not.toMatch(/[\uAC00-\uD7A3]/);
    expect(en['admin.nav.ops']).not.toMatch(/[\uAC00-\uD7A3]/);

    for (const key of [
      'admin.nav.queues',
      'admin.nav.ops',
      'admin.nav.team',
      'admin.nav.deposits',
      'admin.nav.withdrawals',
    ]) {
      expect(ko[key].toLowerCase()).not.toMatch(/\b(queue|desk|rpc|aml|kyc|compliance)\b/);
      expect(en[key].toLowerCase()).not.toMatch(/\b(queue|desk|rpc|aml|compliance)\b/);
    }
  });

  it('product surfaces have 0 hardcoded Soft Launch UI jargon copy', () => {
    const files = collectTsxFiles(PRODUCT_ROOT);
    expect(files.length).toBeGreaterThan(10);

    const hits: string[] = [];
    for (const file of files) {
      const body = surfaceBodyWithoutNoise(readFileSync(file, 'utf8'));
      for (const pattern of UI_JARGON_PATTERNS) {
        if (pattern.test(body)) {
          hits.push(`${file.replace(/\\/g, '/')}: ${pattern}`);
        }
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
