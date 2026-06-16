import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { Button, Card, Icon } from '@phonara/ui';
import { useT } from '../lib/i18n';
import { signOut } from '../lib/auth';
import { AppShell } from '../components/app-shell';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/more',
  component: MorePage,
});

const MORE_LINKS = [
  { to: '/sports' as const, labelKey: 'more.sports' as const, icon: 'games' as const },
  { to: '/earn' as const, labelKey: 'more.earn' as const, icon: 'earn' as const },
  { to: '/staking' as const, labelKey: 'more.staking' as const, icon: 'staking' as const },
  { to: '/ledger' as const, labelKey: 'more.ledger' as const, icon: 'ledger' as const },
  { to: '/responsible-gaming' as const, labelKey: 'more.responsibleGaming' as const, icon: 'shield' as const },
] as const;

function MorePage() {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  if (authLoading || !session) {
    return (
      <AppShell active="more">
        <div className="surface-earn app-page" aria-busy="true" />
      </AppShell>
    );
  }

  return (
    <AppShell active="more">
      <div className="surface-earn app-page pn-anim-rise" data-testid="more-page">
        <section className="app-section" aria-labelledby="more-page-title">
          <Card className="p-5">
            <p className="text-xs font-medium text-muted">{t('more.eyebrow')}</p>
            <h1 id="more-page-title" className="mt-1 text-xl font-medium text-fg">
              {t('more.title')}
            </h1>
            <p className="mt-2 text-sm text-muted">{t('more.sub')}</p>
          </Card>
        </section>

        <section className="app-section" aria-label={t('more.linksAria')}>
          <div className="more-link-grid">
            {MORE_LINKS.map((item) => (
              <Link key={item.to} to={item.to} className="more-link-card">
                <Icon name={item.icon} size="md" className="text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
                <Icon name="chevronRight" size="sm" className="ml-auto text-muted" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="app-section-secondary">
          <Button
            type="button"
            variant="outline"
            full
            className="earn-touch-target"
            onClick={() => {
              void signOut();
            }}
          >
            {t('nav.logout')}
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
