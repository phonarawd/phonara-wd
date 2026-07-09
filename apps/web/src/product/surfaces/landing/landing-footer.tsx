import { Link } from '@tanstack/react-router';

import {
  LEGAL_PRIVACY_ROUTE,
  LEGAL_RESPONSIBLE_GAMING_ROUTE,
  LEGAL_TERMS_ROUTE,
} from '@/domain/legal-display-contract';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

export type LandingFooterProps = {
  className?: string;
};

/** §28.2 section 7 — working legal links · age notice · operator contact. */
export function LandingFooter({ className }: LandingFooterProps) {
  const t = useT();

  return (
    <footer
      className={cn('border-line flex flex-col gap-4 border-t pt-8', className)}
      data-testid="landing-footer"
    >
      <nav
        className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
        aria-label={t('landing.footer.linksAria')}
      >
        <Link
          to={LEGAL_TERMS_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-terms"
        >
          {t('legal.nav.terms')}
        </Link>
        <Link
          to={LEGAL_PRIVACY_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-privacy"
        >
          {t('legal.nav.privacy')}
        </Link>
        <Link
          to={LEGAL_RESPONSIBLE_GAMING_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-rg"
        >
          {t('legal.nav.rg')}
        </Link>
      </nav>
      <p className="text-foreground-muted m-0 text-xs">{t('landing.footer.age')}</p>
      <p className="text-foreground-muted m-0 text-xs">{t('landing.footer.company')}</p>
      <p className="text-foreground-muted m-0 text-xs">{t('legal.contactBody')}</p>
    </footer>
  );
}
