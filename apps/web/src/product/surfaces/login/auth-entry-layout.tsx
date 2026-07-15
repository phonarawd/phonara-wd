import { ShieldCheck, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import { useT } from '@/product/i18n';
import { BrandMark, BrandWordmark } from '@/product/primitives/brand-mark';
import { cn } from '@/product/primitives/lib/cn';
import { PLATFORM_POSITIONING_KEYS } from '@/domain/platform-narrative-display-contract';

function AuthDocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="text-accent underline-offset-4 hover:underline">
      {children}
    </a>
  );
}

export type AuthEntryLayoutProps = {
  testId?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Centered auth column with brand trust cues (AUTH_UX_CANON · Apple/Notion pattern). */
export function AuthEntryLayout({
  testId,
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthEntryLayoutProps) {
  const t = useT();

  return (
    <div
      data-testid={testId}
      className={cn(
        // Form owns the dominant 1fr track (UX_REFERENCE_CANON.md §Login/Auth ·
        // AUTH_UX_CANON.md — no promo/hero content may crowd out the form) —
        // the brand/trust <aside> stays in the narrow fixed track, never the reverse.
        // Track separator MUST be `_` (space), not `,` — a comma produces an
        // invalid `grid-template-columns` value (that property takes a
        // space-separated track list, never comma-separated), so the browser
        // drops the whole declaration and both columns silently collapse to a
        // single stacked column at every width. Confirmed via 1024/2560
        // screenshots showing the aside stacked above the form instead of
        // beside it (2026-07-15 Phase 0B re-verification) — every other
        // `grid-cols-[...]` arbitrary value in this repo already uses `_`.
        'mx-auto grid w-full max-w-5xl gap-8 py-6 md:py-10 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-center lg:gap-12 lg:py-12',
        className,
      )}
    >
      <aside className="hidden flex-col gap-6 lg:flex" aria-label={t('auth.entry.trust.ariaLabel')}>
        <div className="flex flex-col gap-2">
          <p className="text-accent m-0 text-sm font-semibold tracking-wide uppercase">
            {t(PLATFORM_POSITIONING_KEYS.eyebrow)}
          </p>
          <h1 className="text-foreground m-0 text-3xl font-semibold tracking-tight break-keep">
            {t(PLATFORM_POSITIONING_KEYS.headline)}
          </h1>
          <p className="text-foreground-muted m-0 text-base leading-relaxed">
            {t(PLATFORM_POSITIONING_KEYS.subhead)}
          </p>
        </div>
        <ul className="text-foreground-muted m-0 flex list-none flex-col gap-3 p-0 text-sm">
          <li className="flex items-center gap-2">
            <Wallet className="text-accent size-4 shrink-0" aria-hidden />
            {t('auth.entry.trust.wallet')}
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="text-accent size-4 shrink-0" aria-hidden />
            {t('auth.entry.trust.secured')}
          </li>
        </ul>
      </aside>

      <section className="flex w-full flex-col gap-6">
        <header className="flex flex-col items-center gap-1.5 text-center lg:items-start lg:text-left">
          <div className="flex items-center gap-2">
            <BrandMark size={24} className="text-accent" testId="auth-brand-mark" />
            <BrandWordmark className="text-foreground text-base" />
          </div>
          <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase lg:hidden">
            {t(PLATFORM_POSITIONING_KEYS.eyebrow)}
          </p>
          <h2 className="text-foreground m-0 text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-foreground-muted m-0 text-sm">{subtitle}</p>
        </header>
        {children}
        {footer}
      </section>
    </div>
  );
}

export function AuthLegalFooter() {
  const t = useT();

  return (
    <p className="text-foreground-muted m-0 text-center text-xs lg:text-left">
      <AuthDocLink href="/legal/terms">{t('auth.entry.shared.termsLink')}</AuthDocLink>
      {' · '}
      <AuthDocLink href="/legal/privacy">{t('auth.entry.shared.privacyLink')}</AuthDocLink>
    </p>
  );
}
