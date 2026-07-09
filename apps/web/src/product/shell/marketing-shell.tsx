import type { ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';

import { isAdsAttributionRoute } from '@/domain/ads-attribution-display-contract';
import { ContentShell, ShellPage } from '@/product/layout';
import { cn } from '@/product/primitives/lib/cn';
import { AuthAttributionChunk } from '@/product/surfaces/landing/auth-attribution-chunk';

import {
  normalizeShellPath,
  resolveMarketingShellVariant,
  type MarketingShellVariant,
} from './shell-route-matchers';

export type MarketingShellProps = {
  children: ReactNode;
};

function marketingShellClassName(variant: MarketingShellVariant): string {
  return cn(
    'ds-marketing-shell bg-background text-foreground flex min-h-dvh flex-col',
    variant === 'landing' && 'ds-marketing-shell--landing',
    variant === 'auth' && 'ds-marketing-shell--auth',
  );
}

/** §12.19.5 marketing zone — `/` · auth funnel · AppShell chrome 0. */
export function MarketingShell({ children }: MarketingShellProps) {
  const pathname = useRouterState({ select: (s) => normalizeShellPath(s.location.pathname) });
  const variant = resolveMarketingShellVariant(pathname);
  const trackViewContent = pathname === '/';

  return (
    <ShellPage
      id="main-content"
      className={marketingShellClassName(variant)}
      data-testid="marketing-shell"
    >
      {isAdsAttributionRoute(pathname) ? (
        <AuthAttributionChunk trackViewContent={trackViewContent} />
      ) : null}
      <ContentShell className="ds-marketing-shell-content flex-1">{children}</ContentShell>
    </ShellPage>
  );
}
