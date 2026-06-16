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

type AppNavKey = 'home' | 'games' | 'trade' | 'wallet' | 'more' | 'earn';

type AppShellProps = {
  children: ReactNode;
  active?: AppNavKey;
};

type Wallet = Tables<'wallets'>;

type NavItem = {
  key: AppNavKey;
  to: '/dashboard' | '/casino' | '/trade' | '/wallet' | '/more' | '/earn';
  labelKey: MessageKey;
  icon: IconName;
};

const MOBILE_NAV: ReadonlyArray<NavItem> = [
  { key: 'home', to: '/dashboard', labelKey: 'nav.home', icon: 'home' },
  { key: 'games', to: '/casino', labelKey: 'nav.games', icon: 'games' },
  { key: 'trade', to: '/trade', labelKey: 'nav.trade', icon: 'trade' },
  { key: 'wallet', to: '/wallet', labelKey: 'nav.wallet', icon: 'wallet' },
  { key: 'more', to: '/more', labelKey: 'nav.more', icon: 'menu' },
];

const SIDE_NAV: ReadonlyArray<NavItem> = [
  { key: 'home', to: '/dashboard', labelKey: 'nav.home', icon: 'home' },
  { key: 'earn', to: '/earn', labelKey: 'nav.earn', icon: 'earn' },
  { key: 'games', to: '/casino', labelKey: 'nav.games', icon: 'games' },
  { key: 'trade', to: '/trade', labelKey: 'nav.trade', icon: 'trade' },
  { key: 'wallet', to: '/wallet', labelKey: 'nav.wallet', icon: 'wallet' },
  { key: 'more', to: '/more', labelKey: 'nav.more', icon: 'menu' },
];

function resolveActive(pathname: string, override?: AppNavKey): AppNavKey {
  if (override) return override;
  if (pathname.startsWith('/earn')) return 'earn';
  if (pathname.startsWith('/trade')) return 'trade';
  if (pathname.startsWith('/wallet')) return 'wallet';
  if (pathname.startsWith('/casino')) return 'games';
  if (pathname.startsWith('/more') || pathname.startsWith('/sports') || pathname.startsWith('/staking') || pathname.startsWith('/ledger') || pathname.startsWith('/responsible-gaming')) {
    return 'more';
  }
  return 'home';
}

function NavLink({
  item,
  isActive,
  variant,
}: {
  item: NavItem;
  isActive: boolean;
  variant: 'mobile' | 'side' | 'top';
}) {
  const t = useT();
  const className =
    variant === 'mobile'
      ? `app-shell-nav-item${isActive ? ' is-active' : ''}`
      : variant === 'side'
        ? `app-shell-side-nav-item${isActive ? ' is-active' : ''}`
        : `app-shell-top-nav-item${isActive ? ' is-active' : ''}`;

  return (
    <Link
      to={item.to}
      className={className}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon name={item.icon} size={variant === 'mobile' ? 'sm' : 'xs'} />
      {variant === 'mobile' ? (
        <span className="app-shell-nav-label">{t(item.labelKey)}</span>
      ) : (
        t(item.labelKey)
      )}
      {variant === 'mobile' && isActive ? <span className="app-shell-nav-active" aria-hidden="true" /> : null}
      {variant === 'top' && isActive ? <span className="app-shell-top-nav-active" aria-hidden="true" /> : null}
    </Link>
  );
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
          {SIDE_NAV.map((item) => (
            <NavLink key={item.key} item={item} isActive={item.key === active} variant="top" />
          ))}
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

      <div className="app-shell-layout">
        <nav className="app-shell-side-nav" aria-label={t('appShell.sideNavAria')}>
          {SIDE_NAV.map((item) => (
            <NavLink key={item.key} item={item} isActive={item.key === active} variant="side" />
          ))}
        </nav>

        <div className="app-shell-body">
          <main id="main-content" className="app-shell-main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>

      <nav className="app-shell-nav" aria-label={t('appShell.navAria')}>
        {MOBILE_NAV.map((item) => (
          <NavLink key={item.key} item={item} isActive={item.key === active} variant="mobile" />
        ))}
      </nav>
    </div>
  );
}
