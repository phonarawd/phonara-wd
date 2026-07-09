import { Link, useRouterState } from '@tanstack/react-router';

import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';
import type { MessageKey } from '@phonara/i18n';

import type { SubnavItem } from './earn-subnav';
import { normalizeShellPath } from './shell-route-matchers';

function isSubnavActive(pathname: string, item: SubnavItem): boolean {
  const current = normalizeShellPath(pathname);
  const target = normalizeShellPath(item.to);

  if (item.end) {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}

export type HorizontalSubnavProps = {
  items: readonly SubnavItem[];
  ariaLabelKey: MessageKey;
  className?: string;
  testId?: string;
};

/** §12.19.5 — 48px chips · horizontal scroll-snap (mobile earn/trade/sports/casino/wallet). */
export function HorizontalSubnav({
  items,
  ariaLabelKey,
  className,
  testId,
}: HorizontalSubnavProps) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className={cn('border-line bg-surface border-b', className)}
      aria-label={t(ariaLabelKey)}
      data-testid={testId}
    >
      <div className="ds-shell-content-column py-2">
        <div className="ds-shell-subnav-scroller">
          {items.map((item) => {
            const active = isSubnavActive(pathname, item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn('ds-shell-subnav-chip', item.helpKey && 'ds-shell-subnav-chip--help')}
                data-active={active ? 'true' : 'false'}
                aria-current={active ? 'page' : undefined}
              >
                <span className="ds-shell-subnav-chip-label">{t(item.labelKey)}</span>
                {item.helpKey ? (
                  <span className="ds-shell-subnav-chip-help">{t(item.helpKey)}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export type VerticalSubnavProps = {
  items: readonly SubnavItem[];
  ariaLabelKey: MessageKey;
  collapsed?: boolean;
  className?: string;
  testId?: string;
};

/** Desktop side nav — 240px expanded / 64px collapsed (§12.19.5). */
export function VerticalSubnav({
  items,
  ariaLabelKey,
  collapsed = false,
  className,
  testId,
}: VerticalSubnavProps) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className={cn('ds-shell-earn-sidenav hidden lg:block', className)}
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-label={t(ariaLabelKey)}
      data-testid={testId}
    >
      <div className="flex flex-col gap-1 p-2">
        {items.map((item) => {
          const active = isSubnavActive(pathname, item);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="ds-shell-earn-sidenav-link"
              data-active={active ? 'true' : 'false'}
              title={collapsed ? t(item.labelKey) : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <span className={cn(collapsed && 'sr-only')}>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
