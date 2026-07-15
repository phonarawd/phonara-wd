import { useRouterState } from '@tanstack/react-router';

import { VerticalSubnav } from './domain-subnav';
import { tradeSurfaceRouteMatcher } from './shell-route-matchers';
import { filterRegisteredSubnavItems } from './subnav-route-manifest';
import { TRADE_SUBNAV } from './trade-subnav';

const VISIBLE_TRADE_SUBNAV = filterRegisteredSubnavItems(TRADE_SUBNAV);

function useTradeSurfaceActive(): boolean {
  return useRouterState({
    select: (s) => tradeSurfaceRouteMatcher(s.location.pathname),
  });
}

/**
 * Desktop TradeSideNav — mirrors EarnSideNavDesktop (§12.19.5). Mobile-only
 * TRADE_SUBNAV (`lg:hidden` HorizontalSubnav in AppShell) left desktop with
 * no in-chrome Spot/Futures switch; this renders the same items as a
 * `hidden lg:block` side rail so Spot/Futures/Positions/Orders/History stay
 * reachable without a URL edit at lg+.
 */
export function TradeSideNavDesktop() {
  const active = useTradeSurfaceActive();
  if (!active) return null;

  return (
    <VerticalSubnav
      items={VISIBLE_TRADE_SUBNAV}
      ariaLabelKey="trade.subnav.aria"
      testId="trade-subnav-desktop"
    />
  );
}
