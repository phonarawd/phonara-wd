import {
  formatLandingKrwAmount,
  formatLandingPhonAmount,
  LANDING_WALLET_PREVIEW_PHON,
} from '@/domain/landing-display-contract';
import { landingAnalyticsEventAttr } from '@/domain/landing-analytics-display-contract';
import { LandingAnalyticsSection } from '@/features/landing/landing-analytics-section';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';

export type LandingWalletPreviewProps = {
  signupHref: string;
  className?: string;
};

/** Presentation wallet card — 1 PHON = 1 KRW · withdraw CTA → signup (CVR §3.4). */
export function LandingWalletPreview({ signupHref, className }: LandingWalletPreviewProps) {
  const t = useT();
  const phonAmount = formatLandingPhonAmount(LANDING_WALLET_PREVIEW_PHON);
  const krwAmount = formatLandingKrwAmount(LANDING_WALLET_PREVIEW_PHON);

  return (
    <LandingAnalyticsSection
      event="landing.wallet.viewed"
      className={cn('flex flex-col gap-3', className)}
      testId="landing-wallet-preview"
    >
      <Card className="border-accent/20 bg-surface-raised">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{t('landing.wallet.title')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-foreground-muted text-xs font-medium">
                {t('landing.wallet.balanceLabel')}
              </span>
              <p className="text-foreground m-0 text-3xl font-semibold tabular-nums">
                {phonAmount}
              </p>
            </div>
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {t('landing.wallet.fiatApprox', { amount: krwAmount })}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-foreground-muted m-0 text-xs">{t('landing.wallet.footnote')}</p>
            <a
              href={signupHref}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0')}
              data-testid="landing-wallet-withdraw-cta"
              {...landingAnalyticsEventAttr('landing.signup.started')}
            >
              {t('landing.wallet.withdrawCta')}
            </a>
          </div>
          <p className="text-foreground-muted m-0 text-xs">{t('landing.wallet.withdrawHint')}</p>
        </CardBody>
      </Card>
    </LandingAnalyticsSection>
  );
}
