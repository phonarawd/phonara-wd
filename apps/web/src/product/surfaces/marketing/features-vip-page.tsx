import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';

import {
  FEATURES_HUB_ROUTE,
  FEATURES_VIP_CTA_ROUTE,
  FEATURES_VIP_SEO_DESCRIPTION_KEY,
  FEATURES_VIP_SEO_TITLE_KEY,
} from '@/domain/features-hub-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

import { MarketingPageLayout } from './marketing-page-layout';

const VIP_POINTS = ['cashback', 'limits', 'support', 'decay'] as const;

/** Canonical public `/features/vip` — Platinum+ marketing (P12). */
export function FeaturesVipPage() {
  const t = useT();

  useEffect(() => {
    document.title = t(FEATURES_VIP_SEO_TITLE_KEY);
  }, [t]);

  return (
    <MarketingPageLayout
      testId="features-vip-page"
      eyebrow={t('features.vip.eyebrow')}
      title={t(FEATURES_VIP_SEO_TITLE_KEY)}
      lead={t(FEATURES_VIP_SEO_DESCRIPTION_KEY)}
      backTo={FEATURES_HUB_ROUTE}
      backLabelKey="marketing.back.features"
    >
      <ul className="m-0 flex list-none flex-col gap-3 p-0" data-testid="features-vip-points">
        {VIP_POINTS.map((id) => (
          <li key={id}>
            <Card>
              <CardBody className="flex flex-col gap-1">
                <p className="text-foreground m-0 font-medium">
                  {t(`features.vip.point.${id}.title`)}
                </p>
                <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                  {t(`features.vip.point.${id}.body`)}
                </p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Link
          to={FEATURES_VIP_CTA_ROUTE}
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-fit')}
          data-testid="features-vip-tier-cta"
        >
          {t('features.vip.tierCta')}
        </Link>
        <Link
          to="/signup"
          className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-fit')}
          data-testid="features-vip-signup-cta"
        >
          {t('features.vip.signupCta')}
        </Link>
      </div>
    </MarketingPageLayout>
  );
}
