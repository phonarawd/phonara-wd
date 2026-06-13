import { Link } from '@tanstack/react-router';
import { Button, Icon, buttonVariants } from '@phonara/ui';
import { useI18n, useT } from '../lib/i18n';

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

        <section className="landing-hero auth-stagger auth-stagger-1 flex flex-1 flex-col justify-center text-center">
          <div className="auth-live-badge mx-auto mb-6">
            <span className="auth-live-dot" aria-hidden="true" />
            <Icon name="activity" size="xs" aria-hidden="true" />
            <span>{t('auth.entry.brand.eyebrow')}</span>
          </div>

          <h1 className="auth-headline text-3xl font-extrabold leading-tight sm:text-4xl">
            {t('landing.hero.headlineBefore')}{' '}
            <span className="auth-headline-phon bg-clip-text text-transparent">
              {t('landing.hero.headlinePhon')}
            </span>{' '}
            {t('landing.hero.headlineAfter')}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            {t('landing.hero.sub')}
          </p>

          <div className="landing-proof-grid" aria-label={t('auth.entry.trust.ariaLabel')}>
            <span className="landing-proof-card">
              <Icon name="earn" size="sm" aria-hidden="true" />
              <span>{t('auth.entry.trust.participation')}</span>
            </span>
            <span className="landing-proof-card">
              <Icon name="wallet" size="sm" aria-hidden="true" />
              <span>{t('auth.entry.trust.wallet')}</span>
            </span>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/signup"
              className={buttonVariants({ variant: 'primary', size: 'lg', full: true })}
            >
              {t('landing.cta.primary')}
            </Link>
            <Link
              to="/login"
              className={buttonVariants({ variant: 'secondary', size: 'lg', full: true })}
            >
              {t('landing.cta.secondary')}
            </Link>
          </div>
        </section>

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
