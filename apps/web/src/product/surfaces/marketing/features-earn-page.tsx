import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';

import {
  FEATURES_EARN_CTA_ROUTE,
  FEATURES_EARN_SEO_DESCRIPTION_KEY,
  FEATURES_EARN_SEO_TITLE_KEY,
  FEATURES_HUB_ROUTE,
} from '@/domain/features-hub-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

const EARN_POINTS = ['missions', 'referral', 'tier', 'wallet'] as const;

/** Canonical public `/features/earn` — side-income intro (P12). */
export function FeaturesEarnPage() {
  const t = useT();

  useEffect(() => {
    document.title = t(FEATURES_EARN_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="features-earn-page"
      eyebrow={t('features.earn.eyebrow')}
      title={t(FEATURES_EARN_SEO_TITLE_KEY)}
      lead={t(FEATURES_EARN_SEO_DESCRIPTION_KEY)}
      backTo={FEATURES_HUB_ROUTE}
      backLabelKey="marketing.back.features"
    >
      <ul className="m-0 flex list-none flex-col gap-3 p-0" data-testid="features-earn-points">
        {EARN_POINTS.map((id) => (
          <li key={id}>
            <Card>
              <CardBody className="flex flex-col gap-1">
                <p className="text-foreground m-0 font-medium">
                  {t(`features.earn.point.${id}.title`)}
                </p>
                <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                  {t(`features.earn.point.${id}.body`)}
                </p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Link
          to={FEATURES_EARN_CTA_ROUTE}
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-fit')}
          data-testid="features-earn-home-cta"
        >
          {t('features.earn.homeCta')}
        </Link>
        <Link
          to="/signup"
          className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-fit')}
          data-testid="features-earn-signup-cta"
        >
          {t('features.earn.signupCta')}
        </Link>
      </div>
    </MarketingPageLayout>
  );
}
