import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon } from '@phonara/ui';
import { useT } from '../lib/i18n';

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  const t = useT();
  return (
    <main className="auth-shell-root flex min-h-screen items-center justify-center text-fg" id="main-content" tabIndex={-1}>
      <div className="auth-shell-ambient" aria-hidden="true" />
      <div className="auth-shell-frame pn-anim-rise w-full max-w-[420px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="mb-8 text-center">
          <div className="auth-live-badge auth-stagger auth-stagger-0 mb-4">
            <span className="auth-live-dot" aria-hidden="true" />
            <Icon name="activity" size="xs" aria-hidden="true" />
            <span>{t('auth.entry.brand.eyebrow')}</span>
          </div>
          <Link
            to="/"
            className="auth-brand-link auth-stagger auth-stagger-1 inline-flex text-sm font-semibold text-primary transition-colors hover:text-fg"
          >
            {t('common.appName')}
          </Link>
          <h1 className="auth-headline auth-stagger auth-stagger-2 mt-3 text-3xl font-extrabold leading-tight text-fg sm:text-4xl">
            {t('auth.entry.brand.headlineBefore')}{' '}
            <span className="auth-headline-phon bg-clip-text text-transparent">
              {t('auth.entry.brand.headlinePhon')}
            </span>{' '}
            {t('auth.entry.brand.headlineAfter')}
          </h1>
          <p className="auth-stagger auth-stagger-3 mx-auto mt-3 max-w-[340px] text-sm leading-relaxed tracking-normal text-muted">
            {t('auth.entry.brand.subtitle')}
          </p>
        </header>

        <div className="auth-content">{children}</div>

        <footer className="auth-trust-strip auth-stagger auth-stagger-3" aria-label={t('auth.entry.trust.ariaLabel')}>
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
      </div>
    </main>
  );
}
