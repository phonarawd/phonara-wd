import { useEffect } from 'react';
import {
  createRootRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
  type ErrorComponentProps,
} from '@tanstack/react-router';

import { AuthProvider } from '../contexts/auth-context';
import { useT } from '@/product/i18n';
import { ContentShell, ShellPage } from '@/product/layout';
import { formatRedirectHref, resolveRouteRedirect } from '@/product/routing';
import {
  AppShell,
  MarketingShell,
  PwaShell,
  shouldMountAppShell,
  shouldMountMarketingShell,
  SkipLink,
} from '@/product/shell';

function RootErrorPage({ reset }: ErrorComponentProps) {
  const t = useT();

  return (
    <div className="grid min-h-[50dvh] place-items-center gap-3 py-8 text-center">
      <h1 className="text-foreground m-0 text-xl font-semibold">{t('common.error.title')}</h1>
      <p className="text-foreground-muted m-0 text-sm">{t('common.error.generic')}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="text-accent text-sm font-medium underline-offset-4 hover:underline"
      >
        {t('common.error.retry')}
      </button>
    </div>
  );
}

function NotFoundPage() {
  const t = useT();

  return (
    <div className="grid min-h-[50dvh] place-items-center gap-3 py-8 text-center">
      <p
        className="text-foreground-muted m-0 text-4xl font-semibold tabular-nums"
        aria-hidden="true"
      >
        404
      </p>
      <h1 className="text-foreground m-0 text-xl font-semibold">{t('seo.notFound.title')}</h1>
      <p className="text-foreground-muted m-0 text-sm">{t('seo.notFound.body')}</p>
      <Link to="/" className="text-accent text-sm font-medium underline-offset-4 hover:underline">
        {t('seo.notFound.cta')}
      </Link>
    </div>
  );
}

function RootOutlet() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (shouldMountAppShell(pathname)) {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }

  if (shouldMountMarketingShell(pathname)) {
    return (
      <MarketingShell>
        <Outlet />
      </MarketingShell>
    );
  }

  return (
    <ShellPage id="main-content" className="bg-background text-foreground">
      <ContentShell>
        <Outlet />
      </ContentShell>
    </ShellPage>
  );
}

/**
 * Phase R route root contract — PwaShell + SkipLink required by check:pwa.
 */
function RootLayout() {
  useEffect(() => {
    if (import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1') {
      document.documentElement.dataset['e2eEngine'] = '1';
    }

    const splash = document.getElementById('boot-splash-static');
    if (!splash) return;
    if (import.meta.env.DEV) {
      splash.remove();
      return;
    }
    splash.style.opacity = '0';
    const timer = window.setTimeout(() => splash.remove(), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <SkipLink />
      <PwaShell>
        <RootOutlet />
      </PwaShell>
    </AuthProvider>
  );
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const target = resolveRouteRedirect(location.pathname, location.searchStr);
    if (!target) return;
    throw redirect({
      href: formatRedirectHref(target),
      replace: true,
    });
  },
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RootErrorPage,
});
