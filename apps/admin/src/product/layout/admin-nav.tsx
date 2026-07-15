import { Link, useRouterState } from '@tanstack/react-router';

import { useAdminOperatorRbac } from '@/hooks/admin/useAdminOperatorRbac';
import { useT } from '@/product/i18n';
import {
  filterAdminNavEntries,
  flattenAdminNavLeaves,
  type NavEntry,
  type NavGroup,
  type NavLeaf,
} from '@/product/layout/admin-nav-filter';
import { cn } from '@/product/primitives/lib/cn';
import type { MessageKey } from '@phonara/i18n';

export type { NavEntry, NavGroup, NavLeaf } from '@/product/layout/admin-nav-filter';
export { filterAdminNavEntries, flattenAdminNavLeaves } from '@/product/layout/admin-nav-filter';

/** §6.1 · §12.19 Admin chrome — operator-facing Korean labels (admin app routes omit `/admin` prefix). */
const ADMIN_NAV: NavEntry[] = [
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
      { kind: 'leaf', labelKey: 'admin.nav.referrals', to: '/earn/referrals' },
      { kind: 'leaf', labelKey: 'admin.nav.missions', to: '/earn/missions' },
      { kind: 'leaf', labelKey: 'admin.nav.rewards', to: '/earn/rewards' },
      { kind: 'leaf', labelKey: 'admin.nav.earnActivity', to: '/earn/activity' },
      { kind: 'leaf', labelKey: 'admin.nav.viralStats', to: '/viral-stats' },
    ],
  },
  { kind: 'leaf', labelKey: 'admin.nav.users', to: '/users' },
  { kind: 'leaf', labelKey: 'admin.nav.tiers', to: '/tiers' },
  { kind: 'leaf', labelKey: 'admin.nav.tierBenefits', to: '/tier-benefits' },
  { kind: 'leaf', labelKey: 'admin.nav.promotions', to: '/promotions' },
  { kind: 'leaf', labelKey: 'admin.nav.cms', to: '/cms' },
  { kind: 'leaf', labelKey: 'admin.nav.casino', to: '/casino' },
  { kind: 'leaf', labelKey: 'admin.nav.risk', to: '/risk' },
  { kind: 'leaf', labelKey: 'admin.nav.staking', to: '/staking' },
  { kind: 'leaf', labelKey: 'admin.nav.audit', to: '/audit' },
  { kind: 'leaf', labelKey: 'admin.nav.settings', to: '/settings' },
  { kind: 'leaf', labelKey: 'admin.nav.team', to: '/team' },
  { kind: 'leaf', labelKey: 'admin.nav.support', to: '/support' },
  { kind: 'leaf', labelKey: 'admin.nav.mfa', to: '/mfa/policy' },
  { kind: 'leaf', labelKey: 'admin.nav.ops', to: '/ops' },
];

/** Mobile quick subset — still filtered by the same RBAC predicate. */
const MOBILE_QUICK_NAV: NavLeaf[] = [
  { kind: 'leaf', labelKey: 'admin.nav.overview', to: '/', end: true },
  { kind: 'leaf', labelKey: 'admin.nav.queues', to: '/queues' },
  { kind: 'leaf', labelKey: 'admin.nav.deposits', to: '/deposits' },
  { kind: 'leaf', labelKey: 'admin.nav.withdrawals', to: '/withdrawals' },
  { kind: 'leaf', labelKey: 'admin.nav.earn', to: '/earn' },
  { kind: 'leaf', labelKey: 'admin.nav.users', to: '/users' },
  { kind: 'leaf', labelKey: 'admin.nav.audit', to: '/audit' },
  { kind: 'leaf', labelKey: 'admin.nav.ops', to: '/ops' },
];

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isPathActive(pathname: string, to: string, end = false): boolean {
  const current = normalizePath(pathname);
  const target = normalizePath(to);
  if (end) return current === target;
  return current === target || current.startsWith(`${target}/`);
}

function NavLinkItem({
  labelKey,
  to,
  end,
  nested = false,
}: {
  labelKey: MessageKey;
  to: string;
  end?: boolean;
  nested?: boolean;
}) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = isPathActive(pathname, to, end);

  return (
    <Link
      to={to}
      className={cn(
        'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
        nested && 'pl-6',
        active
          ? 'bg-accent/10 text-accent'
          : 'text-foreground-muted hover:bg-surface-elevated hover:text-foreground',
        'whitespace-nowrap',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {t(labelKey)}
    </Link>
  );
}

function NavGroupItem({ group }: { group: NavGroup }) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groupActive =
    (group.to ? isPathActive(pathname, group.to, group.end) : false) ||
    group.children.some((child) => isPathActive(pathname, child.to, child.end));

  return (
    <div className="space-y-1">
      {group.to ? (
        <Link
          to={group.to}
          className={cn(
            'block rounded-md px-3 py-2 text-sm font-semibold transition-colors',
            groupActive ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-surface-elevated',
          )}
          aria-current={groupActive ? 'page' : undefined}
        >
          {t(group.labelKey)}
        </Link>
      ) : (
        <p className="text-foreground-muted px-3 py-1 text-xs font-semibold tracking-wide uppercase">
          {t(group.labelKey)}
        </p>
      )}
      <div className="space-y-0.5">
        {group.children.map((child) => (
          <NavLinkItem key={child.to} {...child} nested />
        ))}
      </div>
    </div>
  );
}

export function AdminNav({ className }: { className?: string }) {
  const t = useT();
  const { role } = useAdminOperatorRbac();
  const entries = filterAdminNavEntries(ADMIN_NAV, role);

  return (
    <nav className={cn('space-y-4', className)} aria-label={t('admin.nav.ariaLabel')}>
      {entries.map((entry) =>
        entry.kind === 'leaf' ? (
          <NavLinkItem key={entry.to} {...entry} />
        ) : (
          <NavGroupItem key={entry.labelKey} group={entry} />
        ),
      )}
    </nav>
  );
}

/** Touch-first quick links — flat list for horizontal scroll under the header. */
export function AdminMobileNav({ className }: { className?: string }) {
  const t = useT();
  const { role } = useAdminOperatorRbac();
  const entries = filterAdminNavEntries(MOBILE_QUICK_NAV, role);
  const items = flattenAdminNavLeaves(entries);

  return (
    <nav className={cn('flex min-w-max gap-1', className)} aria-label={t('admin.nav.ariaLabel')}>
      {items.map((item) => (
        <NavLinkItem key={item.to} {...item} nested={false} />
      ))}
    </nav>
  );
}

/** Resolve shell header title from the current admin route. */
export function resolveAdminNavTitleKey(pathname: string): MessageKey {
  const current = normalizePath(pathname);

  if (/^\/users\/[^/]+\/tier$/.test(current)) {
    return 'admin.userTier.title';
  }

  if (current === '/mfa/policy') {
    return 'admin.nav.mfa';
  }

  if (current === '/team') {
    return 'admin.nav.team';
  }

  if (current === '/support') {
    return 'admin.nav.support';
  }

  for (const entry of ADMIN_NAV) {
    if (entry.kind === 'leaf') {
      if (isPathActive(current, entry.to, entry.end)) return entry.labelKey;
      continue;
    }

    for (const child of entry.children) {
      if (isPathActive(current, child.to, child.end)) return child.labelKey;
    }

    if (entry.to && isPathActive(current, entry.to, entry.end)) {
      return entry.labelKey;
    }
  }

  return 'admin.nav.overview';
}
