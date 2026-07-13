import type { ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';

import { ContentShell, ShellPage } from '@/product/layout';

import { AuroraBackground } from './aurora-background';
import { resolveAuroraBackdropIntensity } from './aurora-backdrop-policy';
import { CASINO_SUBNAV } from './casino-subnav';
import { HorizontalSubnav } from './domain-subnav';
import { EarnSideNavDesktop, EarnSideRailDesktop, EarnSubnavMobile } from './earn-shell';
import { BottomNav } from './bottom-nav';
import { SPORTS_SUBNAV } from './sports-subnav';
import {
  casinoSurfaceRouteMatcher,
  sportsSurfaceRouteMatcher,
  tradeSurfaceRouteMatcher,
  walletSurfaceRouteMatcher,
} from './shell-route-matchers';
import { TopBar } from './top-bar';
import { TradeSideNavDesktop } from './trade-shell';
import { TRADE_SUBNAV } from './trade-subnav';
import { BetFirstVisitEducationGate } from './bet-first-visit-education-gate';
import { TradeFirstVisitEducationGate } from './trade-first-visit-education-gate';
import { TradeRealtimeFeedbackGate } from './trade-realtime-feedback-gate';
import { WALLET_SUBNAV } from './wallet-subnav';
import { filterRegisteredSubnavItems } from './subnav-route-manifest';

export type AppShellProps = {
  children: ReactNode;
};

function DomainSubnav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (tradeSurfaceRouteMatcher(pathname)) {
    return (
      <HorizontalSubnav
        items={filterRegisteredSubnavItems(TRADE_SUBNAV)}
        ariaLabelKey="trade.subnav.aria"
        className="lg:hidden"
        testId="trade-subnav"
      />
    );
  }

  if (sportsSurfaceRouteMatcher(pathname)) {
    return (
      <HorizontalSubnav
        items={filterRegisteredSubnavItems(SPORTS_SUBNAV)}
        ariaLabelKey="sports.subnav.aria"
        className="lg:hidden"
        testId="sports-subnav"
      />
    );
  }

  if (casinoSurfaceRouteMatcher(pathname)) {
    return (
      <HorizontalSubnav
        items={filterRegisteredSubnavItems(CASINO_SUBNAV)}
        ariaLabelKey="casino.subnav.aria"
        className="lg:hidden"
        testId="casino-subnav"
      />
    );
  }

  if (walletSurfaceRouteMatcher(pathname)) {
    return (
      <HorizontalSubnav
        items={filterRegisteredSubnavItems(WALLET_SUBNAV)}
        ariaLabelKey="wallet.subnav.aria"
        className="lg:hidden"
        testId="wallet-subnav"
      />
    );
  }

  return null;
}

function AppShellAurora() {
  const intensity = useRouterState({
    select: (s) => resolveAuroraBackdropIntensity(s.location.pathname),
  });
  return <AuroraBackground intensity={intensity} />;
}

/** §12.19.5 super-app chrome — BottomNav 5-tab · TopBar · domain subnav registries. */
export function AppShell({ children }: AppShellProps) {
  return (
    <ShellPage
      id="main-content"
      className="ds-shell-appshell-root bg-background text-foreground flex min-h-dvh flex-col"
    >
      <AppShellAurora />
      <div className="ds-shell-appshell-chrome flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <EarnSideNavDesktop />
          <TradeSideNavDesktop />
          <div className="flex min-w-0 flex-1 flex-col">
            <EarnSubnavMobile />
            <DomainSubnav />
            <main className="ds-shell-main-with-bottomnav flex-1">
              <ContentShell className="py-4">{children}</ContentShell>
            </main>
          </div>
          <EarnSideRailDesktop />
        </div>
        <BottomNav className="lg:hidden" />
      </div>
      <TradeFirstVisitEducationGate />
      <BetFirstVisitEducationGate />
      <TradeRealtimeFeedbackGate />
    </ShellPage>
  );
}
