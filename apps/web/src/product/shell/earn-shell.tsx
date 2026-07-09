import { useRouterState } from '@tanstack/react-router';

import { EARN_SUBNAV } from './earn-subnav';
import { HorizontalSubnav, VerticalSubnav } from './domain-subnav';
import { earnSurfaceRouteMatcher } from './shell-route-matchers';
import { filterRegisteredSubnavItems } from './subnav-route-manifest';

const VISIBLE_EARN_SUBNAV = filterRegisteredSubnavItems(EARN_SUBNAV);

function useEarnSurfaceActive(): boolean {
  return useRouterState({
    select: (s) => earnSurfaceRouteMatcher(s.location.pathname),
  });
}

/** Mobile horizontal earnSubnav chips — §12.19.4. */
export function EarnSubnavMobile() {
  const active = useEarnSurfaceActive();
  if (!active) return null;

  return (
    <HorizontalSubnav
      items={VISIBLE_EARN_SUBNAV}
      ariaLabelKey="earn.subnav.aria"
      className="lg:hidden"
      testId="earn-subnav-mobile"
    />
  );
}

/** Desktop EarnSideNav — 240px expanded (§12.19.5). */
export function EarnSideNavDesktop() {
  const active = useEarnSurfaceActive();
  if (!active) return null;

  return (
    <VerticalSubnav
      items={VISIBLE_EARN_SUBNAV}
      ariaLabelKey="earn.subnav.aria"
      testId="earn-subnav-desktop"
    />
  );
}

/** @deprecated Use EarnSubnavMobile + EarnSideNavDesktop from AppShell layout. */
export function EarnShell() {
  return (
    <>
      <EarnSubnavMobile />
      <EarnSideNavDesktop />
    </>
  );
}
