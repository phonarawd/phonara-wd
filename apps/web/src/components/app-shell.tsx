import type { MessageKey } from '@phonara/i18n';
import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Icon, Money, type IconName } from '@phonara/ui';
import type { Tables } from '@phonara/shared-types';
import { useI18n, useT } from '../lib/i18n';
import { signOut } from '../lib/auth';
import { useAuth } from '../contexts/auth-context';
import { walletKeys } from '../hooks/use-wallet';
import { supabase } from '../lib/supabase';

type AppNavKey = 'home' | 'trade' | 'wallet' | 'casino' | 'staking';

type AppShellProps = {
  children: ReactNode;
  /** Override active tab when the route is not in the primary nav map. */
  active?: AppNavKey;
};

type Wallet = Tables<'wallets'>;

const NAV: ReadonlyArray<{
  key: AppNavKey;
  to: '/dashboard' | '/trade' | '/wallet' | '/casino' | '/staking';
  labelKey: MessageKey;
  icon: IconName;
}> = [
  { key: 'home', to: '/dashboard', labelKey: 'nav.home', icon: 'home' },
  { key: 'trade', to: '/trade', labelKey: 'nav.trade', icon: 'trade' },
  { key: 'wallet', to: '/wallet', labelKey: 'nav.wallet', icon: 'wallet' },
  { key: 'casino', to: '/casino', labelKey: 'nav.casino', icon: 'casino' },
  { key: 'staking', to: '/staking', labelKey: 'nav.staking', icon: 'staking' },
];

function resolveActive(pathname: string, override?: AppNavKey): AppNavKey {
  if (override) return override;
  if (pathname.startsWith('/trade')) return 'trade';
  if (pathname.startsWith('/wallet')) return 'wallet';
  if (pathname.startsWith('/casino')) return 'casino';
  if (pathname.startsWith('/staking')) return 'staking';
  return 'home';
}

export function AppShell({ children, active: activeOverride }: AppShellProps) {
  const t = useT();
  const { locale, setLocale } = useI18n();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const { data: wallet = null, isLoading: walletLoading } = useQuery({
    queryKey: walletKeys.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId!)
        .single();
      if (error) throw error;
      return data as Wallet;
    },
    enabled: !!userId,
  });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = resolveActive(pathname, activeOverride);
  const accountLabel = session?.user.email ?? t('common.appName');

  function toggleLocale() {
    setLocale(locale === 'ko' ? 'en' : 'ko');
  }

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <Link to="/dashboard" className="app-shell-brand" aria-label={t('common.appName')}>
          <span className="app-shell-mark" aria-hidden="true">
            P
          </span>
          <span className="app-shell-brand-copy">
            <span className="app-shell-name">{t('common.appName')}</span>
            <span className="app-shell-subtitle">{t('appShell.desktopSubtitle')}</span>
          </span>
        </Link>

        <nav className="app-shell-top-nav" aria-label={t('appShell.topNavAria')}>
          {NAV.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={`app-shell-top-nav-item${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon name={item.icon} size="xs" />
                {t(item.labelKey)}
                {isActive ? <span className="app-shell-top-nav-active" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="app-shell-header-actions">
          <Link to="/wallet" className="app-shell-balance-pill">
            <span className="app-shell-balance-label">{t('wallet.available')}</span>
            <span className="app-shell-balance-value">
              {walletLoading ? t('common.loading') : <Money amount={wallet?.phon_available ?? '0'} currency="PHON" tabularNums />}
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="app-shell-locale-toggle"
            aria-label={locale === 'ko' ? t('appShell.switchToEnglish') : t('appShell.switchToKorean')}
            onClick={toggleLocale}
          >
            {locale === 'ko' ? 'EN' : 'KO'}
          </Button>
          <Link to="/ledger" className="app-shell-header-link">
            {t('nav.ledgerHistory')}
          </Link>
          <div className="app-shell-profile" title={accountLabel}>
            <span className="app-shell-profile-dot" aria-hidden="true" />
            <span className="app-shell-profile-label">{accountLabel}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="app-shell-logout"
            onClick={() => {
              void signOut();
            }}
          >
            {t('nav.logout')}
          </Button>
        </div>
      </header>

      <main id="main-content" className="app-shell-main" tabIndex={-1}>{children}</main>

      <nav className="app-shell-nav" aria-label={t('appShell.navAria')}>
        {NAV.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`app-shell-nav-item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon name={item.icon} size="sm" />
              <span className="app-shell-nav-label">{t(item.labelKey)}</span>
              {isActive ? <span className="app-shell-nav-active" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
