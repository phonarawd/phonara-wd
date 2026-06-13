import { Link } from '@tanstack/react-router';
import { Button, Icon, buttonVariants } from '@phonara/ui';
import { useI18n, useT } from '../lib/i18n';
import { RewardLoopHero } from '../features/landing/reward-loop-hero';

export function LandingPage() {
  const t = useT();
  const { locale, setLocale } = useI18n();

  function toggleLocale() {
    setLocale(locale === 'ko' ? 'en' : 'ko');
  }

  return (
    <main
      className="auth-shell-root flex min-h-dvh flex-col text-fg"
      data-testid="landing-page"
      id="main-content"
      tabIndex={-1}
    >
      <div className="auth-shell-ambient" aria-hidden="true" />
      <div className="landing-frame pn-anim-rise mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="landing-header auth-stagger auth-stagger-0 mb-10 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-fg"
            aria-label={t('common.appName')}
          >
            <span className="app-shell-mark" aria-hidden="true">
              P
            </span>
            <span>{t('common.appName')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="landing-locale-toggle min-h-11 min-w-11"
              onClick={toggleLocale}
              aria-label={locale === 'ko' ? t('appShell.switchToEnglish') : t('appShell.switchToKorean')}
            >
              {locale === 'ko' ? 'EN' : 'KO'}
            </Button>
            <Link
              to="/login"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t('landing.header.login')}
            </Link>
          </div>
        </header>

        <RewardLoopHero />

        <footer
          className="auth-trust-strip auth-stagger auth-stagger-3 mt-10"
          aria-label={t('auth.entry.trust.ariaLabel')}
        >
          <span className="auth-trust-item">
            <Icon name="shield" size="xs" aria-hidden="true" />
            <span>{t('auth.entry.trust.secured')}</span>
          </span>
          <span className="auth-trust-item">
            <Icon name="wallet" size="xs" aria-hidden="true" />
            <span>{t('auth.entry.trust.wallet')}</span>
          </span>
          <span className="auth-trust-item">
            <Icon name="home" size="xs" aria-hidden="true" />
            <span>{t('auth.entry.trust.korea')}</span>
          </span>
        </footer>

        <p className="auth-stagger auth-stagger-3 mt-6 text-center text-xs text-muted">
          <Link to="/terms" className="hover:text-fg hover:underline">
            {t('auth.entry.shared.termsLink')}
          </Link>
          {' · '}
          <Link to="/privacy" className="hover:text-fg hover:underline">
            {t('auth.entry.shared.privacyLink')}
          </Link>
        </p>
      </div>
    </main>
  );
}
