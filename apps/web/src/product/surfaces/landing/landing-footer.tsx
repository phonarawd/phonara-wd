import { Link } from '@tanstack/react-router';

import {
  LEGAL_AFFILIATE_ROUTE,
  LEGAL_COOKIES_ROUTE,
  LEGAL_PRIVACY_ROUTE,
  LEGAL_RESPONSIBLE_GAMING_ROUTE,
  LEGAL_TERMS_ROUTE,
} from '@/domain/legal-display-contract';
import { FEES_PAGE_ROUTE } from '@/domain/fees-page-display-contract';
import { FEATURES_HUB_ROUTE } from '@/domain/features-hub-display-contract';
import {
  OPERATOR_TRUST_FAQ_ROUTE,
  OPERATOR_TRUST_FEEDBACK_ROUTE,
} from '@/domain/operator-trust-pages-display-contract';
import { SUPPORT_HUB_ROUTE } from '@/domain/support-hub-display-contract';
import { TIER_GUIDE_ROUTE } from '@/domain/tier-guide-display-contract';
import { TRUST_HUB_ROUTE } from '@/domain/trust-hub-display-contract';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

export type LandingFooterProps = {
  className?: string;
};

/** §28.2 section 7 — working legal + P12 trust/marketing links · age notice · operator contact. */
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
        <Link
          to={LEGAL_AFFILIATE_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-affiliate"
        >
          {t('legal.nav.affiliate')}
        </Link>
        <Link
          to={LEGAL_COOKIES_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-cookies"
        >
          {t('legal.nav.cookies')}
        </Link>
        <Link
          to={TRUST_HUB_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-security"
        >
          {t('trust.hub.head.title')}
        </Link>
        <Link
          to={FEATURES_HUB_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-features"
        >
          {t('features.hub.head.title')}
        </Link>
        <Link
          to={FEES_PAGE_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-fees"
        >
          {t('fees.page.head.title')}
        </Link>
        <Link
          to={TIER_GUIDE_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-tier"
        >
          {t('tier.guide.title')}
        </Link>
        <Link
          to={SUPPORT_HUB_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-support"
        >
          {t('support.hub.head.title')}
        </Link>
        <Link
          to={OPERATOR_TRUST_FAQ_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-faq"
        >
          {t('faq.title')}
        </Link>
        <Link
          to={OPERATOR_TRUST_FEEDBACK_ROUTE}
          className="text-accent font-medium underline-offset-4 hover:underline"
          data-testid="landing-footer-feedback"
        >
          {t('feedback.page.head.title')}
        </Link>
      </nav>
      <p className="text-foreground-muted m-0 text-xs">{t('landing.footer.age')}</p>
      <p className="text-foreground-muted m-0 text-xs">{t('landing.footer.company')}</p>
      <p className="text-foreground-muted m-0 text-xs">{t('legal.contactBody')}</p>
    </footer>
  );
}
