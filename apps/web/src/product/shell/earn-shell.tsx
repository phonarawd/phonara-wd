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

/** Desktop EarnSideNav — 240px expanded floating rail (§12.19.5 · §34.11). */
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

/**
 * Earn lg+ complementary side rail — visual balance for Orbit Grid (§34.11).
 * Decorative chrome only (aria-hidden) — nav lives in EarnSideNavDesktop.
 */
export function EarnSideRailDesktop() {
  const active = useEarnSurfaceActive();
  if (!active) return null;

  return (
    <aside
      className="ds-shell-earn-side-rail"
      data-testid="earn-side-rail-desktop"
      aria-hidden
    />
  );
}

/** @deprecated Use EarnSubnavMobile + EarnSideNavDesktop from AppShell layout. */
export function EarnShell() {
  return (
    <>
      <EarnSubnavMobile />
      <EarnSideNavDesktop />
      <EarnSideRailDesktop />
    </>
  );
}
