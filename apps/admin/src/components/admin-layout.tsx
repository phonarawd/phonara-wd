import { Link, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useT } from '../lib/i18n';
import { signOut } from '../lib/auth';
import { Button } from '@phonara/ui';

interface NavItem {
  to: string;
  labelKey:
    | 'admin.nav.overview'
    | 'admin.nav.alerts'
    | 'admin.nav.queues'
    | 'admin.nav.audit'
    | 'admin.nav.operations';
  testId: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/overview', labelKey: 'admin.nav.overview', testId: 'nav-overview' },
  { to: '/alerts', labelKey: 'admin.nav.alerts', testId: 'nav-alerts' },
  { to: '/queues', labelKey: 'admin.nav.queues', testId: 'nav-queues' },
  { to: '/audit', labelKey: 'admin.nav.audit', testId: 'nav-audit' },
  { to: '/operations', labelKey: 'admin.nav.operations', testId: 'nav-operations' },
];

function navLinkClass(active: boolean, baseClass: string): string {
  return `${baseClass}${active ? ' is-active' : ''}`;
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const { location } = useRouterState();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-shell-sidebar" data-testid="admin-sidebar">
        <div className="admin-shell-brand-block">
          <Link to="/overview" className="admin-shell-brand" aria-label={t('admin.shell.brandAria')}>
            <span className="admin-shell-mark" aria-hidden="true">
              P
            </span>
            <span className="admin-shell-brand-text">
              <span className="admin-shell-brand-name">{t('common.appName')}</span>
              <span className="admin-shell-brand-sub">{t('admin.shell.subtitle')}</span>
            </span>
          </Link>
        </div>

        <nav className="admin-shell-side-nav" aria-label={t('admin.nav.ariaLabel')}>
          {NAV_ITEMS.map(({ to, labelKey, testId }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                data-testid={testId}
                className={navLinkClass(active, 'admin-shell-side-link')}
                aria-current={active ? 'page' : undefined}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="admin-shell-sidebar-footer">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="admin-logout"
            onClick={handleSignOut}
          >
            {t('nav.logout')}
          </Button>
        </div>
      </aside>

      <div className="admin-shell-body">
        <header className="admin-shell-header">
          <div className="admin-shell-header-brand">
            <span className="admin-shell-mark" aria-hidden="true">
              P
            </span>
            <span className="admin-shell-header-title">{t('admin.shell.subtitle')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            data-testid="admin-logout-mobile"
            onClick={handleSignOut}
          >
            {t('nav.logout')}
          </Button>
        </header>

        <main className="admin-shell-main">
          <div className="admin-page admin-pn-rise">{children}</div>
        </main>
      </div>

      <nav className="admin-shell-nav" aria-label={t('admin.nav.ariaLabel')}>
        {NAV_ITEMS.map(({ to, labelKey, testId }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              data-testid={`${testId}-mobile`}
              className={navLinkClass(active, 'admin-shell-nav-item')}
              aria-current={active ? 'page' : undefined}
            >
              <span className="admin-shell-nav-label">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
