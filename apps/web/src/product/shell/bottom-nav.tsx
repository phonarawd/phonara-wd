import { Link, useRouterState } from '@tanstack/react-router';
import { Coins, Dices, Trophy, TrendingUp, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';
import type { MessageKey } from '@phonara/i18n';

import {
  normalizeShellPath,
  resolveBottomNavTab,
  type BottomNavTabId,
} from './shell-route-matchers';

type BottomNavItem = {
  id: BottomNavTabId;
  labelKey: MessageKey;
  to: string;
  icon: LucideIcon;
};

/** Tab1 uses nav.earn — nav.home forbidden on BottomNav (§12.19.4). */
const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  { id: 'earn', labelKey: 'nav.earn', to: '/home', icon: Coins },
  { id: 'wallet', labelKey: 'nav.wallet', to: '/wallet', icon: Wallet },
  { id: 'trade', labelKey: 'nav.trade', to: '/trade', icon: TrendingUp },
  { id: 'sports', labelKey: 'nav.sports', to: '/sports', icon: Trophy },
  { id: 'casino', labelKey: 'nav.casino', to: '/casino', icon: Dices },
] as const;

export type BottomNavProps = {
  className?: string;
  /** 6px mission badge on Tab1 — wired from earn hub in P8. */
  showEarnMissionBadge?: boolean;
};

export function BottomNav({ className, showEarnMissionBadge = false }: BottomNavProps) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => normalizeShellPath(s.location.pathname) });
  const activeTab = resolveBottomNavTab(pathname);

  return (
    <nav
      className={cn('ds-shell-bottomnav fixed inset-x-0 bottom-0 z-20', className)}
      aria-label={t('shell.bottomnav.aria')}
      data-testid="bottom-nav"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;

        return (
          <Link
            key={item.id}
            to={item.to}
            className="ds-shell-bottomnav-tab"
            data-active={active ? 'true' : 'false'}
            data-tab={item.id}
            aria-current={active ? 'page' : undefined}
          >
            {item.id === 'earn' && showEarnMissionBadge ? (
              <span
                className="ds-shell-bottomnav-badge"
                aria-label={t('shell.earn.missionBadge')}
                data-testid="earn-tab-mission-badge"
              />
            ) : null}
            <Icon
              className="ds-shell-bottomnav-icon"
              strokeWidth={active ? 2.5 : 2}
              fill={active ? 'currentColor' : 'none'}
              aria-hidden
            />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
