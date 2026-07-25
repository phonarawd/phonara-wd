import { describe, expect, it } from 'vitest';

import type { AdminRbacRole } from '@/domain/admin-rbac';
import { filterAdminNavEntries, type NavEntry } from '@/product/layout/admin-nav-filter';

const SAMPLE_NAV: NavEntry[] = [
  { kind: 'leaf', labelKey: 'admin.nav.overview', to: '/', end: true },
  {
    kind: 'group',
    labelKey: 'admin.nav.queues',
    to: '/queues',
    children: [
      { kind: 'leaf', labelKey: 'admin.nav.deposits', to: '/deposits' },
      { kind: 'leaf', labelKey: 'admin.nav.withdrawals', to: '/withdrawals' },
      { kind: 'leaf', labelKey: 'admin.nav.sports', to: '/sports' },
    ],
  },
  {
    kind: 'group',
    labelKey: 'admin.nav.earn',
    to: '/earn',
    children: [
      { kind: 'leaf', labelKey: 'admin.nav.rewards', to: '/earn/rewards' },
      { kind: 'leaf', labelKey: 'admin.nav.earnActivity', to: '/earn/activity' },
      { kind: 'leaf', labelKey: 'admin.nav.referrals', to: '/earn/referrals' },
    ],
  },
  { kind: 'leaf', labelKey: 'admin.nav.team', to: '/team' },
  { kind: 'leaf', labelKey: 'admin.nav.ops', to: '/ops' },
  { kind: 'leaf', labelKey: 'admin.nav.support', to: '/support' },
  { kind: 'leaf', labelKey: 'admin.nav.mfa', to: '/mfa/policy' },
];

function leafHrefs(role: AdminRbacRole): string[] {
  const entries = filterAdminNavEntries(SAMPLE_NAV, role);
  const hrefs: string[] = [];
  for (const entry of entries) {
    if (entry.kind === 'leaf') hrefs.push(entry.to);
    else {
      if (entry.to) hrefs.push(entry.to);
      for (const child of entry.children) hrefs.push(child.to);
    }
  }
  return hrefs;
}

describe('filterAdminNavEntries (H-07)', () => {
  it('hides withdrawals and team from viewer', () => {
    const hrefs = leafHrefs('viewer');
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/ops');
    expect(hrefs).toContain('/earn/activity');
    expect(hrefs).not.toContain('/withdrawals');
    expect(hrefs).not.toContain('/team');
    expect(hrefs).not.toContain('/deposits');
    expect(hrefs).not.toContain('/earn/referrals');
  });

  it('keeps finance money desks · drops team', () => {
    const hrefs = leafHrefs('finance');
    expect(hrefs).toContain('/deposits');
    expect(hrefs).toContain('/withdrawals');
    expect(hrefs).toContain('/earn/activity');
    expect(hrefs).toContain('/earn/rewards');
    expect(hrefs).not.toContain('/team');
    expect(hrefs).not.toContain('/earn/referrals');
  });

  it('keeps support withdrawals desk · drops team', () => {
    const hrefs = leafHrefs('support');
    expect(hrefs).toContain('/support');
    expect(hrefs).toContain('/withdrawals');
    expect(hrefs).toContain('/queues');
    expect(hrefs).not.toContain('/team');
    expect(hrefs).not.toContain('/deposits');
  });

  it('owner sees team and mfa policy', () => {
    const hrefs = leafHrefs('owner');
    expect(hrefs).toContain('/team');
    expect(hrefs).toContain('/mfa/policy');
    expect(hrefs).toContain('/withdrawals');
  });
});
